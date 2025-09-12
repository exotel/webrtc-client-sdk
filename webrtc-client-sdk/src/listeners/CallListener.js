

export class CallListener {
    constructor(callCallback, logger) {
        this.callCallback = callCallback;
        this.logger = logger;
    }

    onIncomingCall(call, phone) {
        this.logger.log("CallListener: onIncomingCall", call, phone);
        this.callCallback.initializeCall(call, phone);
        this.callCallback.triggerCallback("call", call, "incoming", phone);
    }

    onCallEstablished(call, phone) {
        this.logger.log("CallListener: onCallEstablished", call, phone);
        this.callCallback.triggerCallback("call", call, "connected", phone);
    }

    onCallEnded(call, phone) {
        this.logger.log("CallListener: onCallEnded", call, phone);
        this.callCallback.triggerCallback("call", call, "callEnded", phone);
    }

    onCallEvent(event) {
        this.logger.log("CallListener: onCallEvent", event);
        this.callCallback.triggerCallback(event);
    }

    onRinging(call, phone) {
        this.logger.log("CallListener: onRinging", call, phone);
        this.callCallback.triggerCallback("call", call, "ringing", phone);
    }
}