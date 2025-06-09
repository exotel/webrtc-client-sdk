import { webrtcSIPPhone } from "@exotel-npm-dev/webrtc-core-sdk";

var logger = webrtcSIPPhone.getLogger();

export class CallListener {

    callbacks = null;
    constructor(callbacks) {
        this.callbacks = callbacks;
    }

    onIncomingCall = function (call, phone) {
        /**
         * When there is an incoming call, [INVITE is received on SIP] send a call back to the 
         */
        logger.log("CallListener:Initialise call")
        this.callbacks.initializeCall(call, phone)

        /** Triggers the callback on the UI end with message indicating it to be an incoming call */
        logger.log("CallListener:Trigger Incoming")
        this.callbacks.triggerCallback("incoming");
    }
    onCallEstablished = function (call, phone) {
        /**
         * When connection is established [ACK is sent by other party on SIP]
         */
        logger.log("CallListener:Initialise call")
        this.callbacks.initializeCall(call, phone)
        /** Triggers the callback on the UI end with message indicating call has been established*/
        logger.log("CallListener:Trigger Connected")
        this.callbacks.triggerCallback("connected")
    }
    onCallEnded = function (call, phone) {
        /**
         * When other party ends the call [BYE is received and sent by SIP]
         */
        logger.log("CallListener:Initialise call")
        this.callbacks.initializeCall(call, phone)
        /** Triggers the callback on the UI end with message indicating call has ended */
        logger.log("CallListener:Trigger Call Ended")
        this.callbacks.triggerCallback("callEnded")
    }
}