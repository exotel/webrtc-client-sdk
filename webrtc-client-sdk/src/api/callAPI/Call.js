import { CallDetails } from "./CallDetails";
import { webrtcLogger } from "../omAPI/WebrtcLogger"

import { webrtcSIPPhone } from '@exotel-npm-dev/webrtc-core-sdk';
var logger = webrtcLogger()

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
        webrtcSIPPhone.holdCall();
    }

    this.Hold = function() {
        /**
         * When user clicks on hold
         */
        logger.log('hold clicked')
        let dummyFlag = true;
        webrtcSIPPhone.holdCall();
    }

    this.UnHold = function() {
        /**
         * When user clicks on hold
         */
         logger.log('unhold clicked')
         let dummyFlag = true;
         webrtcSIPPhone.holdCall();
    }

    this.callDetails = function() {
        /**
         * return call details object here
         */
        return CallDetails.getCallDetails();
    }

    this.makeCall = function(to, from, virtual, token) {
        try {
            var toNum = "+91" + to
            var myHeaders = new Headers();
            myHeaders.append("Access-Control-Allow-Origin", "*");
            myHeaders.append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            myHeaders.append(
                'Authorization',
                token);

            var requestOptions = {
                method: 'POST',
                headers: myHeaders,
                redirect: 'follow',
            };

            fetch(
                `/v1/Accounts/ccplexopoc1m/Calls/connect.json?CallerId=${virtual}&From=${from}&To=${toNum}`,
                requestOptions
            )
            .then((response) => console.log("Response App" + response.json()))
            .then((result) => console.log("Result App" + result))
            .catch((error) => console.log('Error app', error));
        } catch (e) {
            console.log('inside exception', e);
        }
    }
}
