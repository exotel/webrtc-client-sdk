import { diagnosticsCallback } from "./Callback";

export class ExotelVoiceClientListener {

    registerCallback  = null;
    constructor(registerCallback) {
        this.registerCallback = registerCallback;

    }
    onInitializationSuccess(phone) {
        /**
         * Abstract class for Initialization Success
         */
        this.registerCallback.initializeRegister("registered", phone);
        /**
         * Triggers UI callback to indicate the status of the registered phone
         */
        this.registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "registered", phone);
    }

    onInitializationFailure(phone) {
        /**
         * If register fails send error message to Callback function 
         */
        this.registerCallback.initializeRegister("unregistered", phone);
        this.registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "unregistered", phone);
    }

    onInitializationWaiting(phone) {
        /**
         * If register fails send error message to Callback function 
         */
        this.registerCallback.initializeRegister("sent_request", phone);
        this.registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "sent_request", phone);
    }

    onLog(LogLevel, tag, message) {
        /**
         * To get SDK logs
         */
    }
    onAuthenticationFailure() {
        /**
         * In case if there is any authentication error in registration, handle here
         */
    }
}