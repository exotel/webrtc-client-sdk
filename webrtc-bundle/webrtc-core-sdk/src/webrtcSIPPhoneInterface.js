/*
 * once webrtc sip phone is registered, it will be used to control phone interface
 */
import webrtcSIPPhone from './webrtcSIPPhone';

export function webrtcSIPPhoneInterface() {
    
    this.isConnected =  function() {
        return webrtcSIPPhone.isConnected();
    }

	this.sendDTMFWebRTC =  function(dtmfValue) {
		webrtcSIPPhone.sendDTMFWebRTC(dtmfValue);
    }
    
    this.webRTCMuteUnmute =  function(isMuted) {
		webrtcSIPPhone.webRTCMuteUnmute(isMuted);
    }
    
    this.pickCall =  function() {
        webrtcSIPPhone.pickCall();
    }

    this.rejectCall =  function() {
        webrtcSIPPhone.rejectCall();
    }

    this.playBeepTone =  function() {
        webrtcSIPPhone.playBeepTone();
    }

    /* New functions added by NL */
    this.getSpeakerTestTone =  function() {
        return webrtcSIPPhone.getSpeakerTestTone()
    }

    this.callHold =  function() {
        webrtcSIPPhone.holdCall();
    }

    this.holdAction =  function(bHold) {
        webrtcSIPPhone.holdCall();
        //webrtcSIPPhone.holdAction(bHold);
    }

    this.muteAction =  function(bHold) {
        webrtcSIPPhone.muteAction(bHold);
    }    
    
    this.getWSSURL  =  function() {
        return webrtcSIPPhone.getWSSUrl();
    }

};

export default webrtcSIPPhoneInterface;
