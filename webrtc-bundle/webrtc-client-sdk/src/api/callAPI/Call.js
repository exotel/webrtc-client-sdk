import { CallDetails } from "./CallDetails";
import { webrtcLogger } from "../omAPI/WebrtcLogger"

var logger = webrtcLogger()
var webrtcSDK = require('@exotel/webrtc-sdk-core/bundle/webrtcsdk');
var webrtcSIPPhone = webrtcSDK.webrtcSIPPhone;

export function Call()  {
    this.Answer = function() {
        /**
         * When agent accepts phone, add appropriate msg to be sent to webclient
         */
        logger.log('Call answered')
        webrtcSIPPhone.pickCall();
    }

    this.Hangup = function() {
        /**
         * When call is terminated
         */
        logger.log('call ended')
        webrtcSIPPhone.rejectCall();
    }

    this.MuteToggle = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute toggle clicked')
        let dummyFlag = null;
        webrtcSIPPhone.webRTCMuteUnmute(null);
    }

    this.Mute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute clicked')
        let dummyFlag = true;
        webrtcSIPPhone.webRTCMuteUnmute(dummyFlag);
    }

    this.UnMute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('unmute clicked')
        let dummyFlag = false;
        webrtcSIPPhone.webRTCMuteUnmute(dummyFlag);
    }

    this.HoldToggle = function() {
        /**
         * When user clicks on hold
         */
        logger.log('Hold toggle clicked')
        // webrtcSIPPhoneInterface_.callHold();
        webrtcSIPPhone.holdCall();
    }

    this.Hold = function() {
        /**
         * When user clicks on hold
         */
        logger.log('hold clicked')
        let dummyFlag = true;
        // webrtcSIPPhoneInterface_.holdAction(dummyFlag);
        webrtcSIPPhone.holdCall();
    }

    this.UnHold = function() {
        /**
         * When user clicks on hold
         */
         logger.log('unhold clicked')
         let dummyFlag = true;
        //  webrtcSIPPhoneInterface_.holdAction(dummyFlag);
        webrtcSIPPhone.holdCall();
    }

    this.callDetails = function() {
        /**
         * return call details object here
         */
        return CallDetails.getCallDetails();
    }
}
