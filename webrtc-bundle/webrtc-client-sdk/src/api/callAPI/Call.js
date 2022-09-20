import { CallDetails } from "./CallDetails";
//import webrtcSIPPhoneInterface from '../../../webrtc-sdk-core/webrtcSIPPhoneInterface'
import { webrtcLogger } from "../omAPI/WebrtcLogger"

var logger = webrtcLogger()
var webrtcSDK = require('../../webrtc-sdk-core/webrtcsdk');
var webrtcSIPPhoneInterface_ =  webrtcSDK.webrtcSIPPhoneInterface;
// var webrtcSIPPhoneInterface_ =  require('../../../webrtc-sdk-core/webrtcSIPPhoneInterface');
//var webrtcSIPPhoneInterface_ =  new webrtcSIPPhoneInterface()

export function Call()  {
    this.Answer = function() {
        /**
         * When agent accepts phone, add appropriate msg to be sent to webclient
         */
        logger.log('Call answered')
        webrtcSIPPhoneInterface_.pickCall();
    }

    this.Hangup = function() {
        /**
         * When call is terminated
         */
        logger.log('call ended')
        webrtcSIPPhoneInterface_.rejectCall();
    }

    this.MuteToggle = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute toggle clicked')
        let dummyFlag = null;
        webrtcSIPPhoneInterface_.webRTCMuteUnmute(null);
    }

    this.Mute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('mute clicked')
        let dummyFlag = true;
        webrtcSIPPhoneInterface_.webRTCMuteUnmute(dummyFlag);
    }

    this.UnMute = function() {
        /**
         * When agent clicks on mute
         */
        logger.log('unmute clicked')
        let dummyFlag = false;
        webrtcSIPPhoneInterface_.webRTCMuteUnmute(dummyFlag);
    }

    this.HoldToggle = function() {
        /**
         * When user clicks on hold
         */
        logger.log('Hold toggle clicked')
        webrtcSIPPhoneInterface_.callHold();
    }

    this.Hold = function() {
        /**
         * When user clicks on hold
         */
        logger.log('hold clicked')
        let dummyFlag = true;
        webrtcSIPPhoneInterface_.holdAction(dummyFlag);
    }

    this.UnHold = function() {
        /**
         * When user clicks on hold
         */
         logger.log('unhold clicked')
         let dummyFlag = true;
         webrtcSIPPhoneInterface_.holdAction(dummyFlag);
    }

    this.callDetails = function() {
        /**
         * return call details object here
         */
        return CallDetails.getCallDetails();
    }
}
