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
        var isMuted = webrtcSIPPhone.getMuteStatus();
        logger.log('Call: Mute: isMuted: ', isMuted);
        if (!isMuted) {
            webrtcSIPPhone.muteAction(true);
        } else {
            logger.log('Call: Mute: Already muted');
        }
    }
    
    this.UnMute = function () {
        /**
         * When agent clicks on unmute
         */
        var isMuted = webrtcSIPPhone.getMuteStatus();
        logger.log('Call: UnMute: isMuted: ', isMuted);
        if (isMuted) {
            webrtcSIPPhone.muteAction(false);
        } else {
            logger.log('Call: UnMute: Already unmuted');
        }
    }

    this.HoldToggle = function () {
        /**
         * When user clicks on hold
         */
        logger.log('Call: HoldToggle')
        webrtcSIPPhone.holdCall();
    }

    this.Hold = function () {
        /**
         * When user clicks on hold
         */
        logger.log('Call: Hold')
        var isOnHold = webrtcSIPPhone.getHoldStatus();
        logger.log('Call: Hold: isOnHold: ', isOnHold);
        if (!isOnHold) {
            webrtcSIPPhone.holdAction(true);
        } else {
            logger.log('Call: Hold: Already on hold');
        }
    }

    this.UnHold = function () {
        /**
         * When user clicks on hold
         */
        logger.log('Call: UnHold')
        var isOnHold = webrtcSIPPhone.getHoldStatus();
        logger.log('Call: UnHold: isOnHold: ', isOnHold);
        if (isOnHold) {
            webrtcSIPPhone.holdAction(false);
        } else {
            logger.log('Call: UnHold: Already on hold');
        }
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
