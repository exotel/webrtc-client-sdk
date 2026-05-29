/**
 * WebRTC diagnostic logging for voice-blank / media RCA.
 * Enabled only when window.ENABLE_WEBRTC_DIAGNOSTICS === true
 * or process.env.REACT_APP_ENABLE_WEBRTC_DIAGNOSTICS === 'true' (build-time).
 *
 * Does not log secrets, SDP, or auth tokens.
 */

import coreSDKLogger from './coreSDKLogger.js';

const logger = coreSDKLogger;

let activeCallContext = {};
const statsStopByPc = new WeakMap();
const activeStatsStoppers = new Set();
const attachedPcs = new WeakSet();
let visibilityInitialized = false;

const loopCounters = {};

function isEnabled() {
	if (typeof window !== 'undefined' && window.ENABLE_WEBRTC_DIAGNOSTICS === true) {
		return true;
	}
	try {
		if (typeof process !== 'undefined' && process.env
			&& process.env.REACT_APP_ENABLE_WEBRTC_DIAGNOSTICS === 'true') {
			return true;
		}
	} catch (_e) {
		// ignore
	}
	return false;
}

function getPageVisibility() {
	if (typeof document === 'undefined') {
		return 'unknown';
	}
	return document.visibilityState || 'unknown';
}

function mergeContext(override = {}) {
	return {
		interactionId: null,
		callId: null,
		sipCallId: null,
		exotelCallSid: null,
		exotelLegSid: null,
		...activeCallContext,
		...override,
	};
}

function emit(type, details = {}, contextOverride = {}) {
	if (!isEnabled()) {
		return;
	}
	const ctx = mergeContext(contextOverride);
	const payload = {
		event: 'WEBRTC_DIAGNOSTIC',
		type,
		timestamp: new Date().toISOString(),
		interactionId: ctx.interactionId ?? null,
		callId: ctx.callId ?? null,
		sipCallId: ctx.sipCallId ?? null,
		exotelCallSid: ctx.exotelCallSid ?? null,
		exotelLegSid: ctx.exotelLegSid ?? null,
		pageVisibility: getPageVisibility(),
		details,
	};
	console.info('WEBRTC_DIAGNOSTIC', payload);
	logger.info('WEBRTC_DIAGNOSTIC', payload);
}

function setActiveCallContext(context = {}) {
	activeCallContext = { ...activeCallContext, ...context };
}

function getActiveCallContext() {
	return { ...activeCallContext };
}

function clearActiveCallContext() {
	activeCallContext = {};
}

function resolveContext(getBaseContext) {
	if (typeof getBaseContext === 'function') {
		try {
			return mergeContext(getBaseContext() || {});
		} catch (e) {
			logger.warn('webrtcDiagnostics: getBaseContext failed', e?.message);
		}
	}
	return mergeContext(getBaseContext || {});
}

function attachWebRTCStateDiagnostics(pc, getBaseContext) {
	if (!isEnabled() || !pc || attachedPcs.has(pc)) {
		return;
	}
	attachedPcs.add(pc);

	const logState = (stateName, value) => {
		emit('state_change', { stateName, value }, resolveContext(getBaseContext));
	};

	pc.addEventListener('iceconnectionstatechange', () => {
		logState('iceConnectionState', pc.iceConnectionState);
	});
	pc.addEventListener('connectionstatechange', () => {
		logState('connectionState', pc.connectionState);
	});
	pc.addEventListener('signalingstatechange', () => {
		logState('signalingState', pc.signalingState);
	});
	pc.addEventListener('icegatheringstatechange', () => {
		logState('iceGatheringState', pc.iceGatheringState);
	});

	emit('state_change', {
		stateName: 'peer_connection_attached',
		value: 'created',
		iceConnectionState: pc.iceConnectionState,
		connectionState: pc.connectionState,
		signalingState: pc.signalingState,
	}, resolveContext(getBaseContext));

	pc.addEventListener('track', (event) => {
		const track = event.track;
		emit('track_event', {
			action: 'ontrack',
			kind: track?.kind,
			trackId: track?.id,
			trackReadyState: track?.readyState,
			enabled: track?.enabled,
			muted: track?.muted,
			streamIds: (event.streams || []).map((s) => s.id),
		}, resolveContext(getBaseContext));

		if (!track) {
			return;
		}
		const trackLog = (action) => () => {
			emit('track_event', {
				action,
				kind: track.kind,
				trackId: track.id,
				trackReadyState: track.readyState,
				enabled: track.enabled,
				muted: track.muted,
			}, resolveContext(getBaseContext));
		};
		track.onmute = trackLog('track_mute');
		track.onunmute = trackLog('track_unmute');
		track.onended = trackLog('track_ended');
	});
}

function startWebRTCStatsDiagnostics(pc, getBaseContext) {
	if (!isEnabled() || !pc || statsStopByPc.has(pc)) {
		return null;
	}

	let lastInboundBytes = 0;
	let lastOutboundBytes = 0;
	let lastTimestamp = Date.now();

	const intervalId = setInterval(async () => {
		if (!pc || pc.connectionState === 'closed') {
			stopWebRTCStatsDiagnosticsForPc(pc);
			return;
		}
		try {
			const stats = await pc.getStats();
			const snapshot = {
				connectionState: pc.connectionState,
				iceConnectionState: pc.iceConnectionState,
				signalingState: pc.signalingState,
				iceGatheringState: pc.iceGatheringState,
				inboundAudio: [],
				outboundAudio: [],
				candidatePairs: [],
			};

			stats.forEach((report) => {
				if (report.type === 'inbound-rtp' && report.kind === 'audio') {
					snapshot.inboundAudio.push({
						id: report.id,
						ssrc: report.ssrc,
						packetsReceived: report.packetsReceived,
						bytesReceived: report.bytesReceived,
						packetsLost: report.packetsLost,
						jitter: report.jitter,
						audioLevel: report.audioLevel,
						totalAudioEnergy: report.totalAudioEnergy,
						concealedSamples: report.concealedSamples,
						silentConcealedSamples: report.silentConcealedSamples,
						jitterBufferDelay: report.jitterBufferDelay,
						jitterBufferEmittedCount: report.jitterBufferEmittedCount,
					});
				}
				if (report.type === 'outbound-rtp' && report.kind === 'audio') {
					snapshot.outboundAudio.push({
						id: report.id,
						ssrc: report.ssrc,
						packetsSent: report.packetsSent,
						bytesSent: report.bytesSent,
						retransmittedPacketsSent: report.retransmittedPacketsSent,
						retransmittedBytesSent: report.retransmittedBytesSent,
						totalPacketSendDelay: report.totalPacketSendDelay,
					});
				}
				if (report.type === 'candidate-pair' && report.state === 'succeeded') {
					snapshot.candidatePairs.push({
						id: report.id,
						state: report.state,
						nominated: report.nominated,
						selected: report.selected,
						currentRoundTripTime: report.currentRoundTripTime,
						availableOutgoingBitrate: report.availableOutgoingBitrate,
						bytesSent: report.bytesSent,
						bytesReceived: report.bytesReceived,
						packetsSent: report.packetsSent,
						packetsReceived: report.packetsReceived,
						localCandidateId: report.localCandidateId,
						remoteCandidateId: report.remoteCandidateId,
					});
				}
			});

			const inboundBytes = snapshot.inboundAudio.reduce((sum, x) => sum + (x.bytesReceived || 0), 0);
			const outboundBytes = snapshot.outboundAudio.reduce((sum, x) => sum + (x.bytesSent || 0), 0);
			const now = Date.now();
			const elapsedSec = Math.max((now - lastTimestamp) / 1000, 1);

			snapshot.delta = {
				inboundBytesDelta: inboundBytes - lastInboundBytes,
				outboundBytesDelta: outboundBytes - lastOutboundBytes,
				elapsedSec,
			};

			lastInboundBytes = inboundBytes;
			lastOutboundBytes = outboundBytes;
			lastTimestamp = now;

			emit('stats', snapshot, resolveContext(getBaseContext));
		} catch (error) {
			emit('stats_error', {
				message: error?.message,
				name: error?.name,
			}, resolveContext(getBaseContext));
		}
	}, 1000);

	const stop = () => {
		clearInterval(intervalId);
		statsStopByPc.delete(pc);
		activeStatsStoppers.delete(stop);
	};
	statsStopByPc.set(pc, stop);
	activeStatsStoppers.add(stop);
	emit('stats', { action: 'stats_interval_started' }, resolveContext(getBaseContext));
	return stop;
}

function stopWebRTCStatsDiagnosticsForPc(pc) {
	const stop = statsStopByPc.get(pc);
	if (stop) {
		stop();
	}
}

function stopAllWebRTCStatsDiagnostics() {
	activeStatsStoppers.forEach((stop) => stop());
	activeStatsStoppers.clear();
}

async function logRemoteAudioBind(remoteAudioEl, stream, context = {}) {
	if (!isEnabled()) {
		return;
	}
	emit('audio_element', {
		action: 'bind_remote_stream',
		streamId: stream?.id,
		trackCount: stream?.getTracks?.().length || 0,
		audioTrackCount: stream?.getAudioTracks?.().length || 0,
		audioTracks: (stream?.getAudioTracks?.() || []).map((t) => ({
			id: t.id,
			enabled: t.enabled,
			muted: t.muted,
			readyState: t.readyState,
		})),
	}, mergeContext(context));

	if (!remoteAudioEl || !stream) {
		return;
	}

	try {
		const playResult = remoteAudioEl.play();
		if (playResult && typeof playResult.then === 'function') {
			await playResult;
		}
		emit('audio_element', {
			action: 'remote_audio_play_success',
			muted: remoteAudioEl.muted,
			volume: remoteAudioEl.volume,
			paused: remoteAudioEl.paused,
			readyState: remoteAudioEl.readyState,
		}, mergeContext(context));
	} catch (error) {
		emit('audio_element', {
			action: 'remote_audio_play_failed',
			errorName: error?.name,
			errorMessage: error?.message,
		}, mergeContext(context));
	}
}

function initVisibilityListener() {
	if (visibilityInitialized || typeof document === 'undefined') {
		return;
	}
	visibilityInitialized = true;
	document.addEventListener('visibilitychange', () => {
		const ctx = getActiveCallContext();
		emit('visibility_change', {
			hidden: document.hidden,
			hasActiveCall: Boolean(ctx.callId || ctx.interactionId || ctx.sipCallId || ctx.exotelCallSid),
		}, ctx);
	});
}

function recordFrontendLoopCall(functionName, context = {}, reason = null) {
	if (!isEnabled()) {
		return;
	}
	if (!loopCounters[functionName]) {
		loopCounters[functionName] = { count: 0, lastFlushAt: Date.now(), lastReason: null };
	}
	const counter = loopCounters[functionName];
	counter.count += 1;
	if (reason) {
		counter.lastReason = reason;
	}
	const now = Date.now();
	if (now - counter.lastFlushAt >= 10000) {
		emit('frontend_loop', {
			functionName,
			callsInLast10Sec: counter.count,
			lastReason: counter.lastReason,
		}, mergeContext(context));
		counter.count = 0;
		counter.lastFlushAt = now;
	}
}

function logApiErrorForActiveCall(error, requestInfo = {}, context = {}) {
	if (!isEnabled()) {
		return;
	}
	const ctx = mergeContext(context);
	emit('api_error', {
		endpointGroup: requestInfo.endpointGroup || 'unknown',
		status: error?.response?.status ?? error?.status ?? null,
		retryCount: requestInfo.retryCount || 0,
		hasActiveCall: Boolean(ctx.callId || ctx.interactionId || ctx.sipCallId || ctx.exotelCallSid),
	}, ctx);
}

function setDiagnosticsEnabled(enabled) {
	if (typeof window !== 'undefined') {
		window.ENABLE_WEBRTC_DIAGNOSTICS = Boolean(enabled);
	}
	emit('state_change', { stateName: 'diagnostics_enabled', value: Boolean(enabled) });
}

const webrtcDiagnostics = {
	isEnabled,
	setDiagnosticsEnabled,
	setActiveCallContext,
	getActiveCallContext,
	clearActiveCallContext,
	attachWebRTCStateDiagnostics,
	startWebRTCStatsDiagnostics,
	stopWebRTCStatsDiagnosticsForPc,
	stopAllWebRTCStatsDiagnostics,
	logRemoteAudioBind,
	initVisibilityListener,
	recordFrontendLoopCall,
	logApiErrorForActiveCall,
	emit,
};

export default webrtcDiagnostics;
