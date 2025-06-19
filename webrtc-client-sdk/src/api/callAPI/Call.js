import { CallDetails } from "./CallDetails";
import { getLogger } from '@exotel-npm-dev/webrtc-core-sdk';

const logger = getLogger();

export function Call(webrtcSIPPhone) {
    if (!webrtcSIPPhone) {
        throw new Error("webrtcSIPPhone is required for Call");
    }

    this.Answer = function () {
        /**
         * When agent accepts phone, add appropriate msg to be sent to webclient
         */
        logger.log('Call answered')
        webrtcSIPPhone.pickCall();
    }

    this.Hangup = function () {
        /**
         * When call is terminated
         */
        logger.log('call ended')
        webrtcSIPPhone.rejectCall();
    }

    this.MuteToggle = function () {
        /**
         * When agent clicks on mute
         */
        logger.log('Call: MuteToggle');
        webrtcSIPPhone.webRTCMuteUnmute();
    }

    this.Mute = function () {
        /**
         * When agent clicks on mute
         */
        var isMicEnabled = webrtcSIPPhone.getMuteStatus();
        logger.log('Call: Mute: isMicEnabled: ', isMicEnabled);
        if (isMicEnabled) {
            webrtcSIPPhone.muteAction(true);
        } else {
            logger.log('Call: Mute:  Already muted');
        }
    }
    
    this.UnMute = function () {
        /**
         * When agent clicks on mute
         */
        var isMicEnabled = webrtcSIPPhone.getMuteStatus();
        logger.log('Call: UnMute: isMicEnabled: ', isMicEnabled);
        if (isMicEnabled) {
            logger.log('Call: Unmute: Already unmuted');
        } else {
            webrtcSIPPhone.muteAction(false);
        }
    }

    this.HoldToggle = function () {
        /**
         * When user clicks on hold
         */
        logger.log('Hold toggle clicked')
        webrtcSIPPhone.holdCall();
    }

    this.Hold = function () {
        /**
         * When user clicks on hold
         */
        logger.log('hold clicked')
        let dummyFlag = true;
        webrtcSIPPhone.holdCall();
    }

    this.UnHold = function () {
        /**
         * When user clicks on hold
         */
        logger.log('unhold clicked')
        let dummyFlag = true;
        webrtcSIPPhone.holdCall();
    }

    this.callDetails = function () {
        /**
         * return call details object here
         */
        return CallDetails.getCallDetails();
    }

    this.sendDTMF = function (digit) {
        /**
         * sends dtmf digit as SIP info over websocket 
         */
        logger.log("trying to send dtmf " + digit);
        webrtcSIPPhone.sendDTMFWebRTC(digit);
    }
}
