import { getLogger } from "@exotel-npm-dev/webrtc-core-sdk";
import { CallDetails } from "../api/callAPI/CallDetails";

const logger = getLogger();

export class CallListener {
    constructor(callCallback) {
        this.callCallback = callCallback;
    }

    /**
     * Stamps the event fields onto CallDetails, copies a snapshot of the details onto the
     * call object, then fires the consumer callback. Copying the details onto the call
     * object is what makes them visible to JSON.stringify(callObj) -- Call only carries
     * methods, so without this the consumer sees {}. callObj.callDetails() is unaffected:
     * none of the snapshot keys collide with a method name.
     */
    publishCallEvent(call, phone, eventType) {
        CallDetails.eventType = eventType;
        CallDetails.callState = eventType;
        CallDetails.phone = phone || CallDetails.remoteId || '';
        if (call) {
            Object.assign(call, CallDetails.getCallDetails());
        }
        this.callCallback.triggerCallback("call", call, eventType, phone);
    }

    onIncomingCall(call, phone) {
        logger.log("CallListener: onIncomingCall", call, phone);
        this.callCallback.initializeCall(call, phone);
        this.publishCallEvent(call, phone, "incoming");
    }

    onCallEstablished(call, phone) {
        logger.log("CallListener: onCallEstablished", call, phone);
        this.publishCallEvent(call, phone, "connected");
    }

    onCallEnded(call, phone) {
        logger.log("CallListener: onCallEnded", call, phone);
        this.publishCallEvent(call, phone, "callEnded");
    }

    onCallEvent(event) {
        logger.log("CallListener: onCallEvent", event);
        this.callCallback.triggerCallback(event);
    }

    onRinging(call, phone) {
        logger.log("CallListener: onRinging", call, phone);
        this.publishCallEvent(call, phone, "ringing");
    }
}