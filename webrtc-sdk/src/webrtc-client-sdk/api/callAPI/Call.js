import { CallDetails } from "./CallDetails";
import webrtcSIPPhoneInterface from '../../../webrtc-core-sdk/webrtcSIPPhoneInterface';
import { webrtcLogger } from "../omAPI/WebrtcLogger"

var logger = webrtcLogger()

export function Call()  {
    this.Answer = function() {
        /**
         * When agent accepts phone, add appropriate msg to be sent to webclient
         */
        logger.log('Call answered')
        webrtcSIPPhoneInterface.pickCall();
    }

    this.Hangup = function() {
        /**
         * When call is terminated
         */
        logger.log('call ended')
        webrtcSIPPhoneInterface.rejectCall();
    }

    this.MuteToggle = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute toggle clicked')
        let dummyFlag = null;
        webrtcSIPPhoneInterface.webRTCMuteUnmute(null);
    }

    this.Mute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute clicked')
        let dummyFlag = true;
        webrtcSIPPhoneInterface.webRTCMuteUnmute(dummyFlag);
    }

    this.UnMute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('unmute clicked')
        let dummyFlag = false;
        webrtcSIPPhoneInterface.webRTCMuteUnmute(dummyFlag);
    }

    this.HoldToggle = function() {
        /**
         * When user clicks on hold
         */
        logger.log('Hold toggle clicked')
        webrtcSIPPhoneInterface.callHold();
    }

    this.Hold = function() {
        /**
         * When user clicks on hold
         */
        logger.log('hold clicked')
        let dummyFlag = true;
        webrtcSIPPhoneInterface.holdAction(dummyFlag);
    }

    this.UnHold = function() {
        /**
         * When user clicks on hold
         */
         logger.log('unhold clicked')
         let dummyFlag = true;
         webrtcSIPPhoneInterface.holdAction(dummyFlag);
    }

    this.callDetails = function() {
        /**
         * return call details object here
         */
        return CallDetails.getCallDetails();
    }
}
