import { getLogger } from "@exotel-npm-dev/webrtc-core-sdk";

const logger = getLogger();

export class CallListener {
    constructor(callCallback) {
        this.callCallback = callCallback;
    }

    onCallEvent(event) {
        logger.log("CallListener: onCallEvent", event);
        this.callCallback.triggerCallback(event);
    }
}