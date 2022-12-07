import { webrtcLogger } from "../api/omAPI/WebrtcLogger"
import { callbacks } from "./Callback";
import { outboundCallbacks } from "./Callback";

var logger = webrtcLogger()

export function OutBoundCallListener() {
    this.callback = null

    this.initializeCall = function(callback) {
        outboundCallbacks.initalizeOutboundCallback(callback)
    }

    this.callSuccess = function(data){
        //outboundCallbacks.initalizeOutboundCallback(this.callback)
        logger.log("OutBoundCallListener:Initialise call")
        outboundCallbacks.initializeCall(data)

        logger.log("CallListener:Trigger Outgoing call")
        outboundCallbacks.triggerCallback("connected");
    }

    this.callFailure = function(err){
        //outboundCallbacks.initalizeOutboundCallback(this.callback)
        logger.log("OutBoundCallListener:Initialise call")
        outboundCallbacks.initializeCall(err)

        logger.log("CallListener:Trigger Outgoing call")
        outboundCallbacks.triggerCallback("failed");
    }
}

export function CallListener() {
    this.onIncomingCall = function(call,phone){
        /**
         * When there is an incoming call, [INVITE is received on SIP] send a call back to the 
         */
        logger.log("CallListener:Initialise call")
        callbacks.initializeCall(call,phone)

        /** Triggers the callback on the UI end with message indicating it to be an incoming call */
        logger.log("CallListener:Trigger Incoming")
        callbacks.triggerCallback("incoming");
    }
    this.onCallEstablished = function(call,phone){
        /**
         * When connection is established [ACK is sent by other party on SIP]
         */
         logger.log("CallListener:Initialise call")
         callbacks.initializeCall(call,phone)
        /** Triggers the callback on the UI end with message indicating call has been established*/
        logger.log("CallListener:Trigger Connected")
        callbacks.triggerCallback("connected")
    }
    this.onCallEnded = function(call,phone) {
        /**
         * When other party ends the call [BYE is received and sent by SIP]
         */
         logger.log("CallListener:Initialise call")
        callbacks.initializeCall(call,phone)
        /** Triggers the callback on the UI end with message indicating call has ended */
        logger.log("CallListener:Trigger Call Ended")
        callbacks.triggerCallback("callEnded")
    }
}