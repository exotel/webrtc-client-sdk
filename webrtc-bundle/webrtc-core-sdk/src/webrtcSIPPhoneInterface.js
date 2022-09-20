/*
 * once webrtc sip phone is registered, it will be used to control phone interface
 */
import webrtcSIPPhone from './webrtcSIPPhone';

export const webrtcSIPPhoneInterface = {
    
    isConnected :  () => {
        return webrtcSIPPhone.isConnected();
    },

	sendDTMFWebRTC : (dtmfValue) => {
		webrtcSIPPhone.sendDTMFWebRTC(dtmfValue);
    },
    
    webRTCMuteUnmute : (isMuted) => {
		webrtcSIPPhone.webRTCMuteUnmute(isMuted);
    },
    
    pickCall : () => {
        webrtcSIPPhone.pickCall();
    },

    rejectCall : () => {
        webrtcSIPPhone.rejectCall();
    },

    playBeepTone : () => {
        webrtcSIPPhone.playBeepTone();
    },

    /* New functions added by NL */
    getSpeakerTestTone : () => {
        return webrtcSIPPhone.getSpeakerTestTone()
    },

    callHold : () => {
        webrtcSIPPhone.holdCall();
    },

    holdAction : (bHold) => {
        webrtcSIPPhone.holdCall();
        //webrtcSIPPhone.holdAction(bHold);
    },

    muteAction : (bHold) => {
        webrtcSIPPhone.muteAction(bHold);
    },    
    
    getWSSURL  : () => {
        return webrtcSIPPhone.getWSSUrl();
    }

};

export default webrtcSIPPhoneInterface;
