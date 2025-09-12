import { CallDetails } from "./CallDetails";
import { getLogger } from '@exotel-npm-dev/webrtc-core-sdk';


export function Call(webrtcSIPPhone) {



    this.logger = webrtcSIPPhone.logger;

    if (!webrtcSIPPhone) {
        throw new Error("webrtcSIPPhone is required for Call");
    }

    this.Answer = function () {
        /**
         * When agent accepts phone, add appropriate msg to be sent to webclient
         */
        this.logger.log('Call answered')
        webrtcSIPPhone.pickCall();
    }

    this.Hangup = function () {
        /**
         * When call is terminated
         */
        this.logger.log('call ended')
        webrtcSIPPhone.rejectCall();
    }

    this.MuteToggle = function () {
        /**
         * When agent clicks on mute
         */
        this.logger.log('Call: MuteToggle');
        webrtcSIPPhone.webRTCMuteUnmute();
    }

    this.Mute = function () {
        /**
         * When agent clicks on mute
         */
        var isMuted = webrtcSIPPhone.getMuteStatus();
        this.logger.log('Call: Mute: isMuted: ', isMuted);
        if (!isMuted) {
            webrtcSIPPhone.muteAction(true);
        } else {
            this.logger.log('Call: Mute: Already muted');
        }
    }
    
    this.UnMute = function () {
        /**
         * When agent clicks on unmute
         */
        var isMuted = webrtcSIPPhone.getMuteStatus();
        this.logger.log('Call: UnMute: isMuted: ', isMuted);
        if (isMuted) {
            webrtcSIPPhone.muteAction(false);
        } else {
            this.logger.log('Call: UnMute: Already unmuted');
        }
    }

    this.HoldToggle = function () {
        /**
         * When user clicks on hold
         */
        this.logger.log('Hold toggle clicked')
        webrtcSIPPhone.holdCall();
    }

    this.Hold = function () {
        /**
         * When user clicks on hold
         */
        this.logger.log('hold clicked')
        let dummyFlag = true;
        webrtcSIPPhone.holdCall();
    }

    this.UnHold = function () {
        /**
         * When user clicks on hold
         */
        this.logger.log('unhold clicked')
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
        this.logger.log("trying to send dtmf " + digit);
        webrtcSIPPhone.sendDTMFWebRTC(digit);
    }
}
