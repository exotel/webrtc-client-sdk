/**
 * Media recovery: ICE FSM, inbound RTP watchdog, network/visibility events.
 *
 * Design goals
 *  - Works through patchy, slow, and switching networks (WiFi ↔ cellular)
 *  - Never gives up — exponential backoff, no hard attempt cap
 *  - Declares success only when inbound RTP bytes increase (not just play())
 *  - Single-flight recovery to prevent AbortError storms
 *  - Handles Chrome, Firefox, Safari (14+), Edge
 */

import coreSDKLogger from './coreSDKLogger.js';
import { audioDeviceManager } from './audioDeviceManager.js';

const logger = coreSDKLogger;

// ─── Tunable constants ────────────────────────────────────────────────────────
const INBOUND_STALL_SEC       = 3;      // RTP silence before soft recovery (3s is typical)
const STATS_POLL_MS           = 500;    // getStats() interval — fast enough to catch blips
const ICE_RESTART_DELAY_MS    = 1000;   // wait before re-INVITE iceRestart
const ICE_DEGRADED_TIMEOUT_MS = 4000;   // proactive restart if ICE stays degraded
const RECOVERY_DEBOUNCE_MS    = 1500;   // min gap between non-urgent recovery runs
const RTP_VERIFY_MS           = 5000;   // wait for RTP bytes after recovery action
const RTP_VERIFY_POLL_MS      = 500;
const HEALTHY_POLLS_RESET     = 6;      // 3s of healthy traffic at 500ms poll → reset backoff

// Exponential backoff — no hard cap, call keeps retrying forever
// attempt 1→2s, 2→5s, 3→12s, 4→30s, 5+→60s
const BACKOFF_MS = [2000, 5000, 12000, 30000, 60000];
// ─────────────────────────────────────────────────────────────────────────────

const recoveryByPc          = new WeakMap();
const activeRecoveryStates  = new Set();
let   visibilityInitialized = false;
let   networkEventsInitialized = false;

// ─── Emit ─────────────────────────────────────────────────────────────────────

function emit(phoneContext, eventName, details = {}) {
    const delegate = phoneContext?.webrtcSIPPhoneEventDelegate;
    if (delegate && typeof delegate.onMediaRecoveryEvent === 'function') {
        delegate.onMediaRecoveryEvent(eventName, details);
    }
    logger.log(`mediaRecovery:${eventName}`, details);
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function getActiveSession(phoneContext) {
    const id = phoneContext?.ctxSip?.callActiveID;
    return id ? (phoneContext.ctxSip.Sessions?.[id] ?? null) : null;
}

function isSessionEstablished(session) {
    if (!session?.state) return false;
    const s = typeof session.state === 'string' ? session.state : session.state?.toString?.();
    return s === 'Established' || Boolean(s?.includes?.('Established'));
}

function shouldSkipWatchdog(phoneContext) {
    return Boolean(phoneContext?.isOnHold || phoneContext?.isMuted);
}

// ─── Transport state ──────────────────────────────────────────────────────────

function isTransportHealthy(pc) {
    if (!pc || pc.connectionState === 'closed') return false;
    return (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed')
        && pc.connectionState === 'connected';
}

function isTransportDegraded(pc) {
    if (!pc) return false;
    const ice  = pc.iceConnectionState;
    const conn = pc.connectionState;
    return ice === 'disconnected' || ice === 'failed'
        || conn === 'disconnected' || conn === 'failed';
}

// ─── Sender (mic) restore ─────────────────────────────────────────────────────

function logSenderState(pc, label) {
    pc?.getSenders?.().forEach((s, i) => {
        const t = s.track;
        if (t?.kind === 'audio') {
            logger.log(`mediaRecovery:${label}:sender[${i}]`, {
                readyState: t.readyState, enabled: t.enabled, muted: t.muted
            });
        }
    });
}

async function ensureLocalAudioSending(phoneContext, session) {
    if (!phoneContext || !session || phoneContext.isOnHold || phoneContext.isMuted) {
        return true; // expected state — not a failure
    }
    const pc = session.sessionDescriptionHandler?.peerConnection;
    if (!pc) return false;

    logSenderState(pc, 'ensureLocalAudioSending:before');

    const endedSender = pc.getSenders?.().find(
        s => s.track?.kind === 'audio' && s.track.readyState === 'ended'
    );

    if (endedSender && typeof phoneContext.replaceSenderTrack === 'function') {
        const deviceId = audioDeviceManager.currentAudioInputDeviceId || 'default';
        const constraints = deviceId === 'default'
            ? { audio: true }
            : { audio: { deviceId: { exact: deviceId } } };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            phoneContext.replaceSenderTrack(stream, deviceId);
            logSenderState(pc, 'ensureLocalAudioSending:replaced');
            return true;
        } catch (e) {
            logger.log('mediaRecovery:ensureLocalAudioSending: getUserMedia failed', e?.name, e?.message);
            return false;
        }
    }

    if (typeof phoneContext.enableSenderTracks === 'function') {
        phoneContext.enableSenderTracks(session, true);
    } else {
        pc.getSenders?.().forEach(s => { if (s.track?.kind === 'audio') s.track.enabled = true; });
    }
    if (!phoneContext.isOnHold && typeof phoneContext.enableReceiverTracks === 'function') {
        phoneContext.enableReceiverTracks(session, true);
    }
    logSenderState(pc, 'ensureLocalAudioSending:after');
    return true;
}

// ─── Remote audio playback ────────────────────────────────────────────────────

async function ensureRemoteAudioPlaying(audioRemote, remoteStream) {
    if (!audioRemote) return false;

    // Reassign srcObject — handles stale reference after network change (all browsers)
    if (remoteStream && audioRemote.srcObject !== remoteStream) {
        audioRemote.srcObject = remoteStream;
    }

    // Resume AudioContext before play() — Chrome/Safari suspend on tab hide or autoplay policy
    audioDeviceManager.ensureAudioContextRunning?.();

    for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 300));
        try {
            await audioRemote.play();
            logger.log('mediaRecovery:ensureRemoteAudioPlaying: ok on attempt', attempt + 1);
            return true;
        } catch (e) {
            if (e?.name === 'AbortError') {
                // Concurrent load() interrupted play() — retry after a beat
                await new Promise(r => setTimeout(r, 200));
                continue;
            }
            if (e?.name === 'NotAllowedError') {
                // Browser autoplay blocked — needs a user gesture; nothing we can do
                logger.log('mediaRecovery:ensureRemoteAudioPlaying: autoplay blocked by browser policy');
                return false;
            }
            logger.log('mediaRecovery:ensureRemoteAudioPlaying: attempt', attempt + 1, e?.name, e?.message);
        }
    }
    return false;
}

// ─── Stats / quality metrics ──────────────────────────────────────────────────

function parseStats(stats) {
    const m = { inboundBytes: 0, packetsLost: 0, jitter: 0, rtt: 0 };
    // stats is a Map in Chrome/FF/Safari; iterate defensively
    const iter = typeof stats.values === 'function' ? stats.values() : Object.values(stats);
    for (const r of iter) {
        if (r.kind !== 'audio') continue;
        if (r.type === 'inbound-rtp') {
            m.inboundBytes += r.bytesReceived || 0;
            m.packetsLost  += r.packetsLost   || 0;
            m.jitter        = Math.max(m.jitter, r.jitter || 0);
        }
        // roundTripTime lives on remote-inbound-rtp in Chrome & Firefox
        if (r.type === 'remote-inbound-rtp') {
            m.rtt = Math.max(m.rtt, r.roundTripTime || 0);
        }
    }
    return m;
}

async function readMetrics(pc) {
    if (!pc?.getStats) return { inboundBytes: 0 };
    try {
        return parseStats(await pc.getStats());
    } catch (e) {
        logger.log('mediaRecovery:readMetrics: error', e?.message || e);
        return { inboundBytes: 0 };
    }
}

async function waitForRTPIncrease(pc, baselineBytes, timeoutMs = RTP_VERIFY_MS) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (pc?.connectionState === 'closed') break;
        const m = await readMetrics(pc);
        if (m.inboundBytes > baselineBytes) {
            return { verified: true, delta: m.inboundBytes - baselineBytes, metrics: m };
        }
        await new Promise(r => setTimeout(r, RTP_VERIFY_POLL_MS));
    }
    const m = await readMetrics(pc);
    return {
        verified: false,
        delta: Math.max(0, m.inboundBytes - baselineBytes),
        metrics: m,
        iceConnectionState: pc?.iceConnectionState,
        connectionState:    pc?.connectionState
    };
}

// ─── ICE restart ──────────────────────────────────────────────────────────────

// SIP.js can return "Reinvite in progress" if a re-INVITE (e.g. hold, previous
// ICE restart) is still completing. We wait and retry rather than counting it
// as a failure, because the root network issue has not changed.
const REINVITE_BUSY_RETRY_MS  = 2500;
const REINVITE_BUSY_MAX_WAITS = 3;

async function doIceRestart(session) {
    if (!session || typeof session.invite !== 'function') return false;
    for (let attempt = 0; attempt <= REINVITE_BUSY_MAX_WAITS; attempt++) {
        try {
            logger.log('mediaRecovery:doIceRestart: sending re-INVITE with iceRestart', attempt > 0 ? `(retry ${attempt})` : '');
            await session.invite({
                sessionDescriptionHandlerOptions: { offerOptions: { iceRestart: true } }
            });
            return true;
        } catch (e) {
            const msg = e?.message || String(e);
            if (msg.includes('Reinvite in progress') && attempt < REINVITE_BUSY_MAX_WAITS) {
                logger.log('mediaRecovery:doIceRestart: re-INVITE busy, waiting', REINVITE_BUSY_RETRY_MS, 'ms before retry');
                await new Promise(r => setTimeout(r, REINVITE_BUSY_RETRY_MS));
                continue;
            }
            logger.log('mediaRecovery:doIceRestart: failed', msg);
            return false;
        }
    }
    return false;
}

// ─── Backoff ──────────────────────────────────────────────────────────────────

function backoffDelay(consecutiveFailures) {
    return BACKOFF_MS[Math.min(consecutiveFailures, BACKOFF_MS.length - 1)];
}

function noteHealthyTraffic(state, delta) {
    if (delta <= 0 || !isTransportHealthy(state.pc)) { state.healthyPolls = 0; return; }
    state.inboundStallSec = 0;
    state.healthyPolls += 1;
    if (state.healthyPolls >= HEALTHY_POLLS_RESET && state.consecutiveFailures > 0) {
        logger.log('mediaRecovery: healthy RTP — resetting backoff');
        state.consecutiveFailures = 0;
        state.healthyPolls = 0;
        emit(state.phoneContext, 'media_recovery_healthy', {
            callActiveId: state.phoneContext?.ctxSip?.callActiveID
        });
    }
}

// ─── Recovery orchestration ───────────────────────────────────────────────────

function clearDegradedTimer(state) {
    if (state.degradedTimerId) { clearTimeout(state.degradedTimerId); state.degradedTimerId = null; }
    if (state.failedTimerId)   { clearTimeout(state.failedTimerId);   state.failedTimerId   = null; }
}

function emitSucceeded(state, reason, senderRestored, v) {
    emit(state.phoneContext, 'media_recovery_succeeded', {
        reason,
        sender_restored:    senderRestored,
        inbound_byte_delta: v.delta,
        rtt_sec:            v.metrics?.rtt,
        jitter_sec:         v.metrics?.jitter,
        packets_lost:       v.metrics?.packetsLost,
        iceConnectionState: state.pc?.iceConnectionState,
        connectionState:    state.pc?.connectionState,
        callActiveId:       state.phoneContext?.ctxSip?.callActiveID
    });
    state.inboundStallSec = 0;
    state.degradedSinceMs = null;
    state.consecutiveFailures = 0;
    state.healthyPolls = 0;
    clearDegradedTimer(state);
}

async function runSoftRecovery(state, reason) {
    const { phoneContext, pc, session } = state;
    const remoteStream = session?.sessionDescriptionHandler?.remoteMediaStream;
    const audioRemote  = phoneContext?.audioRemote;

    const { inboundBytes: baseline } = await readMetrics(pc);

    if (remoteStream && audioRemote && typeof phoneContext.assignStream === 'function') {
        phoneContext.assignStream(remoteStream, audioRemote);
    }
    const senderRestored = await ensureLocalAudioSending(phoneContext, session);
    await ensureRemoteAudioPlaying(audioRemote, remoteStream);

    const v = await waitForRTPIncrease(pc, baseline);
    if (v.verified) { emitSucceeded(state, reason, senderRestored, v); return true; }

    logger.log('mediaRecovery:runSoftRecovery: RTP not verified', reason, v.delta, 'bytes', v.iceConnectionState);
    return false;
}

async function runIceRestartRecovery(state, reason) {
    if (state.pendingIceRestart) return false;
    state.pendingIceRestart = true;
    try {
        await new Promise(r => setTimeout(r, ICE_RESTART_DELAY_MS));
        if (!state.pc || state.pc.connectionState === 'closed') return false;

        const { phoneContext, pc, session } = state;
        const ok = await doIceRestart(session);
        if (!ok) { state.consecutiveFailures += 1; return false; }

        const remoteStream = session?.sessionDescriptionHandler?.remoteMediaStream;
        const audioRemote  = phoneContext?.audioRemote;
        const { inboundBytes: baseline } = await readMetrics(pc);

        if (remoteStream && audioRemote && typeof phoneContext.assignStream === 'function') {
            phoneContext.assignStream(remoteStream, audioRemote);
        }
        const senderRestored = await ensureLocalAudioSending(phoneContext, session);
        await ensureRemoteAudioPlaying(audioRemote, remoteStream);

        const v = await waitForRTPIncrease(pc, baseline, RTP_VERIFY_MS + 2000);
        if (v.verified) { emitSucceeded(state, `${reason}_ice_restart`, senderRestored, v); return true; }

        logger.log('mediaRecovery:runIceRestartRecovery: RTP not verified', reason, v.delta, 'bytes', v.iceConnectionState);
        state.consecutiveFailures += 1;
        return false;
    } finally {
        state.pendingIceRestart = false;
    }
}

const URGENT = new Set(['connection_failed', 'connection_degraded', 'network_online', 'network_change']);

async function attemptRecovery(state, reason) {
    if (state.recoveryInFlight) {
        state.pendingRecoveryReason = reason; // latest urgent wins; processed after current flight
        return;
    }
    if (!URGENT.has(reason) && Date.now() - state.lastRecoveryAttemptMs < RECOVERY_DEBOUNCE_MS) {
        return;
    }

    state.recoveryInFlight      = true;
    state.lastRecoveryAttemptMs = Date.now();
    const { pc } = state;

    emit(state.phoneContext, 'media_recovery_attempted', {
        reason,
        consecutive_failures: state.consecutiveFailures,
        next_backoff_ms:      backoffDelay(state.consecutiveFailures),
        transport_degraded:   isTransportDegraded(pc),
        iceConnectionState:   pc?.iceConnectionState,
        connectionState:      pc?.connectionState,
        callActiveId:         state.phoneContext?.ctxSip?.callActiveID
    });

    try {
        let recovered = false;
        if (!isTransportDegraded(pc)) {
            recovered = await runSoftRecovery(state, reason);
        }
        if (!recovered) {
            recovered = await runIceRestartRecovery(state, reason);
        }

        if (!recovered) {
            const delay = backoffDelay(state.consecutiveFailures);
            emit(state.phoneContext, 'media_recovery_failed', {
                reason,
                consecutive_failures: state.consecutiveFailures,
                next_retry_ms:        delay,
                signaling_ok:         true,
                media_ok:             false,
                iceConnectionState:   pc?.iceConnectionState,
                connectionState:      pc?.connectionState,
                callActiveId:         state.phoneContext?.ctxSip?.callActiveID
            });
            // Retry with exponential backoff — no hard cap, keeps trying the whole call
            setTimeout(() => {
                if (state.pc && state.pc.connectionState !== 'closed') {
                    attemptRecovery(state, `${reason}_retry`);
                }
            }, delay);
        }
    } finally {
        state.recoveryInFlight = false;
        const pending = state.pendingRecoveryReason;
        state.pendingRecoveryReason = null;
        if (pending) attemptRecovery(state, pending);
    }
}

// ─── ICE state change handler ─────────────────────────────────────────────────

function scheduleDegradedRecovery(state) {
    if (state.degradedTimerId || state.recoveryInFlight) return;
    state.degradedTimerId = setTimeout(() => {
        state.degradedTimerId = null;
        if (state.pc && isTransportDegraded(state.pc)) {
            logger.log('mediaRecovery: transport still degraded — proactive ICE restart');
            attemptRecovery(state, 'connection_degraded');
        }
    }, ICE_DEGRADED_TIMEOUT_MS);
}

function onTransportStateChange(state) {
    const { pc } = state;
    if (isTransportDegraded(pc)) {
        if (!state.degradedSinceMs) {
            state.degradedSinceMs = Date.now();
            emit(state.phoneContext, 'media_recovery_degraded', {
                iceConnectionState: pc.iceConnectionState,
                connectionState:    pc.connectionState,
                signaling_ok:       true,
                media_ok:           false,
                callActiveId:       state.phoneContext?.ctxSip?.callActiveID
            });
        }
        scheduleDegradedRecovery(state);
        return;
    }

    clearDegradedTimer(state);

    if (isTransportHealthy(pc) && state.degradedSinceMs) {
        const ms = Date.now() - state.degradedSinceMs;
        state.degradedSinceMs = null;
        logger.log('mediaRecovery: ICE reconnected after', ms, 'ms');
        attemptRecovery(state, 'ice_reconnected');
    }

    if (pc.connectionState === 'failed' && !state.failedTimerId) {
        state.failedTimerId = setTimeout(() => {
            state.failedTimerId = null;
            if (state.pc?.connectionState === 'failed') {
                logger.log('mediaRecovery: connectionState still failed — forcing ICE restart');
                attemptRecovery(state, 'connection_failed');
            }
        }, ICE_DEGRADED_TIMEOUT_MS);
    }
}

// ─── Stats watchdog ───────────────────────────────────────────────────────────

function startStatsWatchdog(state) {
    if (state.statsIntervalId) return;
    state.statsIntervalId = setInterval(async () => {
        const { pc, phoneContext, session } = state;
        if (!pc || pc.connectionState === 'closed') { detachMediaRecovery(pc); return; }
        if (!isSessionEstablished(session) || shouldSkipWatchdog(phoneContext)) {
            state.inboundStallSec = 0;
            state.lastInboundBytes = 0;
            state.healthyPolls = 0;
            return;
        }

        const m = await readMetrics(pc);
        if (!state.inboundBytesInitialized) {
            if (m.inboundBytes > 0) state.inboundBytesInitialized = true;
            return;
        }

        const delta = m.inboundBytes - state.lastInboundBytes;
        state.lastInboundBytes = m.inboundBytes;
        noteHealthyTraffic(state, delta);

        state.inboundStallSec = delta > 0 ? 0 : state.inboundStallSec + STATS_POLL_MS / 1000;

        if (state.inboundStallSec >= INBOUND_STALL_SEC) {
            logger.log('mediaRecovery: RTP stall', state.inboundStallSec, 's — jitter', m.jitter, 'rtt', m.rtt);
            state.inboundStallSec = 0;
            attemptRecovery(state, isTransportDegraded(pc) ? 'inbound_stall_transport_down' : 'inbound_stall');
        }
    }, STATS_POLL_MS);
}

// ─── Global event listeners ───────────────────────────────────────────────────

function initVisibilityListener() {
    if (visibilityInitialized || typeof document === 'undefined') return;
    visibilityInitialized = true;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        activeRecoveryStates.forEach(state => {
            const session = getActiveSession(state.phoneContext);
            if (!isSessionEstablished(session)) return;
            logger.log('mediaRecovery: tab became visible');
            audioDeviceManager.ensureAudioContextRunning?.();
            attemptRecovery(state, 'visibility_visible');
        });
    });
}

function initNetworkEventListeners() {
    if (networkEventsInitialized || typeof window === 'undefined') return;
    networkEventsInitialized = true;

    // Fires when OS network interface comes back — WiFi reconnected, cable in, mobile data on
    window.addEventListener('online', () => {
        logger.log('mediaRecovery: network online');
        activeRecoveryStates.forEach(state => {
            const session = getActiveSession(state.phoneContext);
            if (isSessionEstablished(session)) attemptRecovery(state, 'network_online');
        });
    });

    window.addEventListener('offline', () => {
        logger.log('mediaRecovery: network offline');
        activeRecoveryStates.forEach(state => {
            if (state.degradedSinceMs) return;
            state.degradedSinceMs = Date.now();
            emit(state.phoneContext, 'media_recovery_degraded', {
                reason:       'network_offline',
                signaling_ok: false,
                media_ok:     false,
                callActiveId: state.phoneContext?.ctxSip?.callActiveID
            });
        });
    });

    // Network Information API — fires on WiFi ↔ cellular switch (Chrome/Edge/Opera)
    // Gracefully absent in Firefox/Safari — no-op if not available
    navigator.connection?.addEventListener('change', () => {
        const { effectiveType, downlink, rtt } = navigator.connection;
        logger.log('mediaRecovery: network type changed', { effectiveType, downlink, rtt });
        activeRecoveryStates.forEach(state => {
            const session = getActiveSession(state.phoneContext);
            if (!isSessionEstablished(session)) return;
            // 1s pause for OS to fully complete the network switch before ICE restart
            setTimeout(() => attemptRecovery(state, 'network_change'), 1000);
        });
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function attachMediaRecovery(pc, session, phoneContext) {
    if (!pc || recoveryByPc.has(pc)) return;

    initVisibilityListener();
    initNetworkEventListeners();

    const state = {
        pc, session, phoneContext,
        consecutiveFailures:  0,
        healthyPolls:         0,
        lastRecoveryAttemptMs: 0,
        recoveryInFlight:     false,
        pendingRecoveryReason: null,
        pendingIceRestart:    false,
        degradedSinceMs:      null,
        degradedTimerId:      null,
        failedTimerId:        null,
        statsIntervalId:      null,
        lastInboundBytes:     0,
        inboundStallSec:      0,
        inboundBytesInitialized: false,
        handlers:             {}
    };

    state.handlers.ice        = () => onTransportStateChange(state);
    state.handlers.connection = () => onTransportStateChange(state);

    pc.addEventListener('iceconnectionstatechange', state.handlers.ice);
    pc.addEventListener('connectionstatechange',    state.handlers.connection);

    recoveryByPc.set(pc, state);
    activeRecoveryStates.add(state);
    startStatsWatchdog(state);

    logger.log('mediaRecovery: attached for call', phoneContext?.ctxSip?.callActiveID);
}

export function detachMediaRecovery(pc) {
    const state = recoveryByPc.get(pc);
    if (!state) return;

    clearInterval(state.statsIntervalId);
    clearDegradedTimer(state);

    pc.removeEventListener('iceconnectionstatechange', state.handlers.ice);
    pc.removeEventListener('connectionstatechange',    state.handlers.connection);

    activeRecoveryStates.delete(state);
    recoveryByPc.delete(pc);
    logger.log('mediaRecovery: detached');
}

export { ensureRemoteAudioPlaying };

export default { attachMediaRecovery, detachMediaRecovery, ensureRemoteAudioPlaying };
