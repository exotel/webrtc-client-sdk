
class WebrtcSIPPhoneEventDelegate {

	constructor(username, logger) {
		this.username = username;
		this.logger = logger;
		this._listeners = new Map();
		this.delegates = new Set();
	}

	/**
	 * @param {string}   event  
	 * @param {Function} handler  
	 * @returns {Function}       
	 */

	attach(event, handler) {
		if (!this._listeners.has(event)) {
			this._listeners.set(event, new Set());
		}
		this._listeners.get(event).add(handler);

		return () => this._listeners.get(event)?.delete(handler);
	}

	emit(event, ...args) {
		this._listeners.get(event)?.forEach((h) => {
			try {
				h(...args);
			} catch (e) {
				console.error(`[Delegate:${this.username}]`, e);
			}
		});
	}

	registerDelegate(webrtcDelegate) {
		this.delegates.add(webrtcDelegate);
	}

	unregisterDelegate(webrtcDelegate) {
		this.delegates.delete(webrtcDelegate);
	}

	setTestingMode(mode) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.setTestingMode === 'function') {
				delegate.setTestingMode(mode);
			}
		});
	}

	onCallStatSipJsSessionEvent(ev) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatSipJsSessionEvent === 'function') {
				delegate.onCallStatSipJsSessionEvent(ev);
			}
		});
	}

	sendWebRTCEventsToFSM(eventType, sipMethod) {
		this.logger.log("delegationHandler: sendWebRTCEventsToFSM");
		this.logger.log("delegationHandler: eventType", [eventType]);
		this.logger.log("delegationHandler: sipMethod", [sipMethod]);
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.sendWebRTCEventsToFSM === 'function') {
				delegate.sendWebRTCEventsToFSM(eventType, sipMethod);
			}
		});
	}

	playBeepTone() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.playBeepTone === 'function') {
				delegate.playBeepTone();
			}
		});
	}

	onStatPeerConnectionIceGatheringStateChange(iceGatheringState) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onStatPeerConnectionIceGatheringStateChange === 'function') {
				delegate.onStatPeerConnectionIceGatheringStateChange(iceGatheringState);
			}
		});
	}

	onCallStatIceCandidate(ev, icestate) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatIceCandidate === 'function') {
				delegate.onCallStatIceCandidate(ev, icestate);
			}
		});
	}

	onCallStatNegoNeeded(icestate) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatNegoNeeded === 'function') {
				delegate.onCallStatNegoNeeded(icestate);
			}
		});
	}

	onCallStatSignalingStateChange(cstate) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatSignalingStateChange === 'function') {
				delegate.onCallStatSignalingStateChange(cstate);
			}
		});
	}

	onStatPeerConnectionIceConnectionStateChange(iceConnectionState) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onStatPeerConnectionIceConnectionStateChange === 'function') {
				delegate.onStatPeerConnectionIceConnectionStateChange(iceConnectionState);
			}
		});
	}

	onStatPeerConnectionConnectionStateChange() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onStatPeerConnectionConnectionStateChange === 'function') {
				delegate.onStatPeerConnectionConnectionStateChange();
			}
		});
	}

	onGetUserMediaSuccessCallstatCallback() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onGetUserMediaSuccessCallstatCallback === 'function') {
				delegate.onGetUserMediaSuccessCallstatCallback();
			}
		});
	}

	onGetUserMediaErrorCallstatCallback() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onGetUserMediaErrorCallstatCallback === 'function') {
				delegate.onGetUserMediaErrorCallstatCallback();
			}
		});
	}

	onCallStatAddStream() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatAddStream === 'function') {
				delegate.onCallStatAddStream();
			}
		});
	}

	onCallStatRemoveStream() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatRemoveStream === 'function') {
				delegate.onCallStatRemoveStream();
			}
		});
	}

	setWebRTCFSMMapper(stack) {
		this.logger.log("webrtcSIPPhoneEventDelegate: setWebRTCFSMMapper: Initialisation complete");
	}

	onCallStatSipJsTransportEvent(ev) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatSipJsTransportEvent === 'function') {
				delegate.onCallStatSipJsTransportEvent(ev);
			}
		});
	}

	onCallStatSipSendCallback(tsipData, sipStack) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatSipSendCallback === 'function') {
				delegate.onCallStatSipSendCallback(tsipData, sipStack);
			}
		});
	}

	onCallStatSipRecvCallback(tsipData, sipStack) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCallStatSipRecvCallback === 'function') {
				delegate.onCallStatSipRecvCallback(tsipData, sipStack);
			}
		});
	}

	stopCallStat() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.stopCallStat === 'function') {
				delegate.stopCallStat();
			}
		});
	}

	onRecieveInvite(incomingSession) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onRecieveInvite === 'function') {
				delegate.onRecieveInvite(incomingSession);
			}
		});
	}

	onPickCall() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onPickCall === 'function') {
				delegate.onPickCall();
			}
		});
	}

	onRejectCall() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onRejectCall === 'function') {
				delegate.onRejectCall();
			}
		});
	}

	onCreaterAnswer() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onCreaterAnswer === 'function') {
				delegate.onCreaterAnswer();
			}
		});
	}

	onSettingLocalDesc() {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.onSettingLocalDesc === 'function') {
				delegate.onSettingLocalDesc();
			}
		});
	}

	initGetStats(pc, callid, username) {
		this.delegates.forEach(delegate => {
			if (delegate && typeof delegate.initGetStats === 'function') {
				delegate.initGetStats(pc, callid, username);
			}
		});
	}

	onRegisterWebRTCSIPEngine(engine) {
		this.emit("engine-selected", engine);
	}
}

export default WebrtcSIPPhoneEventDelegate;