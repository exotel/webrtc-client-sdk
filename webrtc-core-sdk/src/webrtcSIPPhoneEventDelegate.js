
import coreSDKLogger from './coreSDKLogger';

const logger = coreSDKLogger;

class WebrtcSIPPhoneEventDelegate {

	constructor(username) {
		this.username = username;
		this._listeners = new Map();
		this.delegate = null;
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
		
		 registerDelegate (webrtcDelegate) {
		   this.delegate = webrtcDelegate;
		   }
		
	registerDelegate(webrtcDelegate) {
		this.delegate = webrtcDelegate;
	}

	setTestingMode(mode) {
		if(this.delegate) {
			this.delegate.setTestingMode(mode);
		}
	}
		
	onCallStatSipJsSessionEvent(ev){
		if(this.delegate) {
			this.delegate.onCallStatSipJsSessionEvent(ev);
		}
	}
	
	sendWebRTCEventsToFSM(eventType, sipMethod) {
		logger.log("delegationHandler: sendWebRTCEventsToFSM");
		logger.log("delegationHandler: eventType", [eventType]);
		logger.log("delegationHandler: sipMethod", [sipMethod]);
		
		if(this.delegate) {
			this.delegate.sendWebRTCEventsToFSM(eventType, sipMethod);
		}
	}
	
	playBeepTone()  {
		if(this.delegate) {
			this.delegate.playBeepTone();
		}
	}
	
	onStatPeerConnectionIceGatheringStateChange(iceGatheringState)  {
		if(this.delegate) {
			this.delegate.onStatPeerConnectionIceGatheringStateChange(iceGatheringState);
		}
	}
	
	onCallStatIceCandidate(ev, icestate)  {
		if(this.delegate) {
			this.delegate.onCallStatIceCandidate(ev,icestate);
		}
	}
	
	
	onCallStatNegoNeeded(icestate)  {
		if(this.delegate) {
			this.delegate.onCallStatNegoNeeded(icestate);
		}
	}

	onCallStatSignalingStateChange (cstate)  {
		if(this.delegate) {
			this.delegate.onCallStatSignalingStateChange(cstate);
		}
	}

	
	onStatPeerConnectionIceConnectionStateChange ()  {
		if(this.delegate) {
			this.delegate.onStatPeerConnectionIceConnectionStateChange();
		}
	}
	
	
	onStatPeerConnectionConnectionStateChange ()  {
		if(this.delegate) {
			this.delegate.onStatPeerConnectionConnectionStateChange();
		}
	}
	
	onGetUserMediaSuccessCallstatCallback ()  {
		if(this.delegate) {
			this.delegate.onGetUserMediaSuccessCallstatCallback();
		}
	}

	onGetUserMediaErrorCallstatCallback ()  {
		if(this.delegate) {
			this.delegate.onGetUserMediaErrorCallstatCallback();
		}
	}
	
	
	onCallStatAddStream ()  {
		if(this.delegate) {
			this.delegate.onCallStatAddStream();
		}
	}

	onCallStatRemoveStream ()  {
		if(this.delegate) {
			this.delegate.onCallStatRemoveStream();
		}
	}
	
	setWebRTCFSMMapper(stack) {
		logger.log("webrtcSIPPhoneEventDelegate: setWebRTCFSMMapper: Initialisation complete");
	}
	
	onCallStatSipJsTransportEvent(ev) {
		if(this.delegate) {
			this.delegate.onCallStatSipJsTransportEvent(ev);
		}
	}
	
	onCallStatSipSendCallback(tsipData, sipStack) {
		if(this.delegate) {
			this.delegate.onCallStatSipSendCallback(tsipData, sipStack);
		}
	}

	onCallStatSipRecvCallback(tsipData, sipStack) {
		if(this.delegate) {
			this.delegate.onCallStatSipRecvCallback(tsipData, sipStack);
		}
	}

	stopCallStat ()  {
		if(this.delegate) {
			this.delegate.stopCallStat();
		}
	}
	
	onRecieveInvite (incomingSession)  {
		if(this.delegate) {
			this.delegate.onRecieveInvite(incomingSession);
		}
	}
	
	onPickCall ()  {
		if(this.delegate) {
			this.delegate.onPickCall();
		}
	}

	onRejectCall  ()  {
		if(this.delegate) {
			this.delegate.onRejectCall();
		}
	}
	
	onCreaterAnswer ()  {
		if(this.delegate) {
			this.delegate.onCreaterAnswer();
		}
	}

	onSettingLocalDesc ()  {
		if(this.delegate) {
			this.delegate.onSettingLocalDesc();
		}
	}

	initGetStats (pc, callid, username)  {
		if(this.delegate) {
			this.delegate.initGetStats(pc, callid, username);
		}
	}
	
	onRegisterWebRTCSIPEngine  (engine)  {
		this.emit("engine-selected", engine);

	}
	
	
}
export default WebrtcSIPPhoneEventDelegate;