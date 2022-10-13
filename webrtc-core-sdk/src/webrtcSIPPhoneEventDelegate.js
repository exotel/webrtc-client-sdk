/*
 * delegate listener , webrtc sip phone could invoke events to delegate and it will further send event to registered delegator
 */
let testingMode = false;
let delegate = null;


const webrtcSIPPhoneEventDelegate = {
		
	registerDelegate : (webrtcDelegate) => {
		delegate = webrtcDelegate;
	},

	setTestingMode : (mode) => {
		if(delegate) {
			delegate.setTestingMode(mode);
		}
	}, 	
		
	onCallStatSipJsSessionEvent : (ev) => {
		if(delegate) {
			delegate.onCallStatSipJsSessionEvent(ev);
		}
	},
	
	sendWebRTCEventsToFSM : (eventType, sipMethod) => {
		if(delegate) {
			delegate.sendWebRTCEventsToFSM(eventType, sipMethod);
		}
	},
	
	playBeepTone : () => {
		if(delegate) {
			delegate.playBeepTone();
		}
	},
	
	onStatPeerConnectionIceGatheringStateChange: (iceGatheringState) => {
		if(delegate) {
			delegate.onStatPeerConnectionIceGatheringStateChange(iceGatheringState);
		}
	},
	
	onCallStatIceCandidate: (ev, icestate) => {
		if(delegate) {
			delegate.onCallStatIceCandidate(ev,icestate);
		}
	},
	
	
	onCallStatNegoNeeded: (icestate) => {
		if(delegate) {
			delegate.onCallStatNegoNeeded(icestate);
		}
	},

	onCallStatSignalingStateChange: (cstate) => {
		if(delegate) {
			delegate.onCallStatSignalingStateChange(cstate);
		}
	},

	
	onStatPeerConnectionIceConnectionStateChange: () => {
		if(delegate) {
			delegate.onStatPeerConnectionIceConnectionStateChange();
		}
	},
	
	
	onStatPeerConnectionConnectionStateChange: () => {
		if(delegate) {
			delegate.onStatPeerConnectionConnectionStateChange();
		}
	},
	
	onGetUserMediaSuccessCallstatCallback: () => {
		if(delegate) {
			delegate.onGetUserMediaSuccessCallstatCallback();
		}
	},

	onGetUserMediaErrorCallstatCallback: () => {
		if(delegate) {
			delegate.onGetUserMediaErrorCallstatCallback();
		}
	},
	
	
	onCallStatAddStream: () => {
		if(delegate) {
			delegate.onCallStatAddStream();
		}
	},

	onCallStatRemoveStream: () => {
		if(delegate) {
			delegate.onCallStatRemoveStream();
		}
	},
	
	setWebRTCFSMMapper : () => {
		if(delegate) {
			delegate.setWebRTCFSMMapper();
		}
	},
	
	onCallStatSipJsTransportEvent : () => {
		if(delegate) {
			delegate.onCallStatSipJsTransportEvent();
		}
	},
	
	onCallStatSipSendCallback: (tsipData, sipStack) => {
		if(delegate) {
			delegate.onCallStatSipSendCallback();
		}
	},

	onCallStatSipRecvCallback: (tsipData, sipStack) => {
		if(delegate) {
			delegate.onCallStatSipRecvCallback();
		}
	},

	stopCallStat: () => {
		if(delegate) {
			delegate.stopCallStat();
		}
	},
	
	onRecieveInvite: () => {
		if(delegate) {
			delegate.onRecieveInvite();
		}
	},
	
	onPickCall: () => {
		if(delegate) {
			delegate.onPickCall();
		}
	},

	onRejectCall : () => {
		if(delegate) {
			delegate.onRejectCall();
		}
	},
	
	onCreaterAnswer: () => {
		if(delegate) {
			delegate.onCreaterAnswer();
		}
	},

	onSettingLocalDesc: () => {
		if(delegate) {
			delegate.onSettingLocalDesc();
		}
	},

	initGetStats: (pc, callid, username) => {
		if(delegate) {
			delegate.initGetStats(pc, callid, username);
		}
	},
	
	onRegisterWebRTCSIPEngine : (engine) => {
		if(delegate) {
			delegate.onRegisterWebRTCSIPEngine(engine);
		}
	}
	
	
}

export default webrtcSIPPhoneEventDelegate;