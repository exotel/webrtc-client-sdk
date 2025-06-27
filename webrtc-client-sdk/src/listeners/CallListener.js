import { getLogger } from "@exotel-npm-dev/webrtc-core-sdk";

const logger = getLogger();

export class CallListener {
    constructor(callCallback) {
        this.callCallback = callCallback;
    }

    onIncomingCall(call, phone) {
        logger.log("CallListener: onIncomingCall", call, phone);
        this.callCallback.initializeCall(call, phone);
        this.callCallback.triggerCallback("call", call, "incoming", phone);
    }

    onCallEstablished(call, phone) {
        logger.log("CallListener: onCallEstablished", call, phone);
        this.callCallback.triggerCallback("call", call, "connected", phone);
    }

    onCallEnded(call, phone) {
        logger.log("CallListener: onCallEnded", call, phone);
        this.callCallback.triggerCallback("call", call, "callEnded", phone);
    }

    onCallEvent(event) {
        logger.log("CallListener: onCallEvent", event);
        this.callCallback.triggerCallback(event);
    }

    onRinging(call, phone) {
        logger.log("CallListener: onRinging", call, phone);
        this.callCallback.triggerCallback("call", call, "ringing", phone);
    }
}