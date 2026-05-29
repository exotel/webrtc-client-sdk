/**
 * Production media recovery: ICE FSM, inbound RTP watchdog, visibility recovery.
 */

import coreSDKLogger from './coreSDKLogger.js';
import { audioDeviceManager } from './audioDeviceManager.js';

const logger = coreSDKLogger;

const RECOVERY_MAX_ATTEMPTS = 3;
const RECOVERY_WINDOW_MS = 30000;
const INBOUND_STALL_SEC = 5;
const STATS_POLL_MS = 1000;
const ICE_RESTART_DELAY_MS = 3000;

const recoveryByPc = new WeakMap();
const activeRecoveryStates = new Set();
let visibilityInitialized = false;

function emitRecoveryEvent(phoneContext, eventName, details = {}) {
    const delegate = phoneContext?.webrtcSIPPhoneEventDelegate;
    if (delegate && typeof delegate.onMediaRecoveryEvent === 'function') {
        delegate.onMediaRecoveryEvent(eventName, details);
    }
    logger.log(`mediaRecovery:${eventName}`, details);
}

function getActiveSession(phoneContext) {
    const callActiveId = phoneContext?.ctxSip?.callActiveID;
    if (!callActiveId) {
        return null;
    }
    return phoneContext.ctxSip.Sessions?.[callActiveId] || null;
}

function isSessionEstablished(session) {
    if (!session || !session.state) {
        return false;
    }
    const state = typeof session.state === 'string' ? session.state : session.state?.toString?.();
    return state === 'Established' || state?.includes?.('Established');
}

function shouldSkipWatchdog(phoneContext) {
    return Boolean(phoneContext?.isOnHold || phoneContext?.isMuted);
}

function logSenderTrackState(pc, label) {
    if (!pc?.getSenders) {
        return;
    }
    pc.getSenders().forEach((sender, idx) => {
        const track = sender.track;
        if (track?.kind === 'audio') {
            logger.log(`mediaRecovery:${label}: sender[${idx}]`, {
                readyState: track.readyState,
                enabled: track.enabled,
                muted: track.muted
            });
        }
    });
}

/**
 * Restore outbound mic after ICE/network recovery.
 * Inbound recovery (remote <audio> play) alone does not re-enable sender tracks.
 */
async function ensureLocalAudioSending(phoneContext, session) {
    if (!phoneContext || !session) {
        return false;
    }

    if (phoneContext.isOnHold || phoneContext.isMuted) {
        logger.log('mediaRecovery:ensureLocalAudioSending: skipped — call is on hold or muted');
        return true;
    }

    const pc = session.sessionDescriptionHandler?.peerConnection;
    if (!pc) {
        return false;
    }

    logSenderTrackState(pc, 'ensureLocalAudioSending:before');

    let endedAudioSender = null;
    pc.getSenders().forEach((sender) => {
        const track = sender.track;
        if (track?.kind === 'audio' && track.readyState === 'ended') {
            endedAudioSender = sender;
        }
    });

    if (endedAudioSender && typeof phoneContext.replaceSenderTrack === 'function') {
        const deviceId = audioDeviceManager.currentAudioInputDeviceId || 'default';
        try {
            const constraints = deviceId === 'default'
                ? { audio: true }
                : { audio: { deviceId: { exact: deviceId } } };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            phoneContext.replaceSenderTrack(stream, deviceId);
            logger.log('mediaRecovery:ensureLocalAudioSending: replaced ended mic track');
            logSenderTrackState(pc, 'ensureLocalAudioSending:after_replace');
            return true;
        } catch (error) {
            logger.log('mediaRecovery:ensureLocalAudioSending: getUserMedia failed', error?.name, error?.message);
            return false;
        }
    }

    if (typeof phoneContext.enableSenderTracks === 'function') {
        phoneContext.enableSenderTracks(session, true);
    } else {
        pc.getSenders().forEach((sender) => {
            if (sender.track?.kind === 'audio') {
                sender.track.enabled = true;
            }
        });
    }

    if (!phoneContext.isOnHold && typeof phoneContext.enableReceiverTracks === 'function') {
        phoneContext.enableReceiverTracks(session, true);
    }

    logSenderTrackState(pc, 'ensureLocalAudioSending:after');
    return true;
}

async function ensureRemoteAudioPlaying(audioRemote, retries = 3) {
    if (!audioRemote) {
        return false;
    }
    const delays = [0, 250, 500];
    for (let i = 0; i < retries; i++) {
        if (delays[i] > 0) {
            await new Promise((resolve) => setTimeout(resolve, delays[i]));
        }
        try {
            if (audioRemote.paused || audioRemote.readyState < 2) {
                audioRemote.load?.();
            }
            await audioRemote.play();
            logger.log('mediaRecovery:ensureRemoteAudioPlaying: success on attempt', i + 1);
            return true;
        } catch (error) {
            logger.log('mediaRecovery:ensureRemoteAudioPlaying: attempt failed', i + 1, error?.name, error?.message);
        }
    }
    return false;
}

function getInboundAudioBytes(stats) {
    let total = 0;
    stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            total += report.bytesReceived || 0;
        }
    });
    return total;
}

async function attemptIceRestart(session) {
    if (!session || typeof session.invite !== 'function') {
        return false;
    }
    try {
        logger.log('mediaRecovery:attemptIceRestart: sending re-INVITE with iceRestart');
        await session.invite({
            sessionDescriptionHandlerOptions: {
                offerOptions: { iceRestart: true }
            }
        });
        return true;
    } catch (error) {
        logger.log('mediaRecovery:attemptIceRestart: failed', error?.message || error);
        return false;
    }
}

async function attemptRecovery(state, reason) {
    const { phoneContext, pc, session } = state;
    const now = Date.now();

    if (now - state.recoveryWindowStartMs > RECOVERY_WINDOW_MS) {
        state.recoveryAttempts = 0;
        state.recoveryWindowStartMs = now;
    }

    if (state.recoveryAttempts >= RECOVERY_MAX_ATTEMPTS) {
        emitRecoveryEvent(phoneContext, 'media_recovery_failed', {
            reason,
            attempts: state.recoveryAttempts,
            callActiveId: phoneContext?.ctxSip?.callActiveID
        });
        return;
    }

    state.recoveryAttempts += 1;
    state.lastRecoveryAttemptMs = now;

    emitRecoveryEvent(phoneContext, 'media_recovery_attempted', {
        reason,
        attempt: state.recoveryAttempts,
        callActiveId: phoneContext?.ctxSip?.callActiveID
    });

    const remoteStream = session?.sessionDescriptionHandler?.remoteMediaStream;
    const audioRemote = phoneContext?.audioRemote;

    if (remoteStream && audioRemote && typeof phoneContext.assignStream === 'function') {
        phoneContext.assignStream(remoteStream, audioRemote);
    }

    const senderRestored = await ensureLocalAudioSending(phoneContext, session);

    const played = await ensureRemoteAudioPlaying(audioRemote);
    if (played) {
        emitRecoveryEvent(phoneContext, 'media_recovery_succeeded', {
            reason,
            attempt: state.recoveryAttempts,
            action: senderRestored ? 'reassign_play_and_sender' : 'reassign_and_play',
            sender_restored: senderRestored
        });
        state.inboundStallSec = 0;
        return;
    }

    if (state.pendingIceRestart) {
        return;
    }

    state.pendingIceRestart = true;
    setTimeout(async () => {
        state.pendingIceRestart = false;
        const restarted = await attemptIceRestart(session);
        if (restarted) {
            emitRecoveryEvent(phoneContext, 'media_recovery_attempted', {
                reason: `${reason}_ice_restart`,
                attempt: state.recoveryAttempts
            });
            if (remoteStream && audioRemote && typeof phoneContext.assignStream === 'function') {
                phoneContext.assignStream(remoteStream, audioRemote);
            }
            const senderAfterRestart = await ensureLocalAudioSending(phoneContext, session);
            const playAfterRestart = await ensureRemoteAudioPlaying(audioRemote);
            if (playAfterRestart) {
                emitRecoveryEvent(phoneContext, 'media_recovery_succeeded', {
                    reason: `${reason}_ice_restart`,
                    attempt: state.recoveryAttempts,
                    action: senderAfterRestart ? 'ice_restart_play_and_sender' : 'ice_restart_play',
                    sender_restored: senderAfterRestart
                });
                state.inboundStallSec = 0;
            }
        }
    }, ICE_RESTART_DELAY_MS);
}

function onIceOrConnectionStateChange(state) {
    const { pc } = state;
    const iceState = pc.iceConnectionState;
    const connState = pc.connectionState;

    if (iceState === 'disconnected' || iceState === 'failed' || connState === 'disconnected' || connState === 'failed') {
        if (!state.degradedSinceMs) {
            state.degradedSinceMs = Date.now();
            emitRecoveryEvent(state.phoneContext, 'media_recovery_degraded', {
                iceConnectionState: iceState,
                connectionState: connState
            });
        }
        return;
    }

    if (iceState === 'connected' || iceState === 'completed' || connState === 'connected') {
        if (state.degradedSinceMs) {
            const durationMs = Date.now() - state.degradedSinceMs;
            emitRecoveryEvent(state.phoneContext, 'media_recovery_attempted', {
                reason: 'ice_reconnected',
                ice_disconnect_duration_ms: durationMs
            });
            state.degradedSinceMs = null;
            attemptRecovery(state, 'ice_reconnected');
        }
    }
}

function startStatsWatchdog(state) {
    if (state.statsIntervalId) {
        return;
    }

    state.lastInboundBytes = 0;
    state.inboundStallSec = 0;

    state.statsIntervalId = setInterval(async () => {
        const { pc, phoneContext, session } = state;
        if (!pc || pc.connectionState === 'closed') {
            detachMediaRecovery(pc);
            return;
        }

        if (!isSessionEstablished(session) || shouldSkipWatchdog(phoneContext)) {
            state.inboundStallSec = 0;
            state.lastInboundBytes = 0;
            return;
        }

        try {
            const stats = await pc.getStats();
            const inboundBytes = getInboundAudioBytes(stats);

            if (!state.inboundBytesInitialized) {
                if (inboundBytes > 0) {
                    state.inboundBytesInitialized = true;
                } else {
                    return;
                }
            }

            const delta = inboundBytes - state.lastInboundBytes;
            state.lastInboundBytes = inboundBytes;

            if (delta <= 0) {
                state.inboundStallSec += STATS_POLL_MS / 1000;
            } else {
                state.inboundStallSec = 0;
            }

            if (state.inboundStallSec >= INBOUND_STALL_SEC) {
                logger.log('mediaRecovery: inbound RTP stall detected', state.inboundStallSec, 'sec');
                emitRecoveryEvent(phoneContext, 'media_recovery_attempted', {
                    reason: 'inbound_stall',
                    inbound_bytes_stall_sec: state.inboundStallSec
                });
                state.inboundStallSec = 0;
                attemptRecovery(state, 'inbound_stall');
            }
        } catch (error) {
            logger.log('mediaRecovery: stats poll error', error?.message || error);
        }
    }, STATS_POLL_MS);
}

function initVisibilityListener() {
    if (visibilityInitialized || typeof document === 'undefined') {
        return;
    }
    visibilityInitialized = true;

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
            return;
        }

        activeRecoveryStates.forEach((state) => {
            if (!state?.phoneContext) {
                return;
            }
            const session = getActiveSession(state.phoneContext);
            if (!isSessionEstablished(session)) {
                return;
            }

            audioDeviceManager.ensureAudioContextRunning();
            ensureRemoteAudioPlaying(state.phoneContext.audioRemote);
            if (state.inboundStallSec > 0) {
                attemptRecovery(state, 'visibility_visible');
            }
        });
    });
}

export function attachMediaRecovery(pc, session, phoneContext) {
    if (!pc || recoveryByPc.has(pc)) {
        return;
    }

    initVisibilityListener();

    const state = {
        pc,
        session,
        phoneContext,
        recoveryAttempts: 0,
        recoveryWindowStartMs: Date.now(),
        lastRecoveryAttemptMs: 0,
        degradedSinceMs: null,
        pendingIceRestart: false,
        statsIntervalId: null,
        lastInboundBytes: 0,
        inboundStallSec: 0,
        inboundBytesInitialized: false,
        handlers: {}
    };

    state.handlers.ice = () => onIceOrConnectionStateChange(state);
    state.handlers.connection = () => onIceOrConnectionStateChange(state);

    pc.addEventListener('iceconnectionstatechange', state.handlers.ice);
    pc.addEventListener('connectionstatechange', state.handlers.connection);

    recoveryByPc.set(pc, state);
    activeRecoveryStates.add(state);
    startStatsWatchdog(state);

    logger.log('mediaRecovery: attachMediaRecovery for call', phoneContext?.ctxSip?.callActiveID);
}

export function detachMediaRecovery(pc) {
    const state = recoveryByPc.get(pc);
    if (!state) {
        return;
    }

    if (state.statsIntervalId) {
        clearInterval(state.statsIntervalId);
    }
    if (state.handlers.ice) {
        pc.removeEventListener('iceconnectionstatechange', state.handlers.ice);
    }
    if (state.handlers.connection) {
        pc.removeEventListener('connectionstatechange', state.handlers.connection);
    }

    activeRecoveryStates.delete(state);
    recoveryByPc.delete(pc);
    logger.log('mediaRecovery: detachMediaRecovery');
}

export { ensureRemoteAudioPlaying };

export default {
    attachMediaRecovery,
    detachMediaRecovery,
    ensureRemoteAudioPlaying
};
