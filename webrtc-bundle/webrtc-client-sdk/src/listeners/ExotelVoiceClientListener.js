import { registerCallback } from "./Callback";
import { diagnosticsCallback } from "./Callback";

export class ExotelVoiceClientListener{
    onInitializationSuccess(phone) {
        /**
         * Abstract class for Initialization Success
         */
        registerCallback.initializeRegister("registered", phone);
        /**
         * Triggers UI callback to indicate the status of the registered phone
         */
        registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "registered", phone); 
    }
    
    onInitializationFailure(phone){
        /**
         * If register fails send error message to Callback function 
         */
        registerCallback.initializeRegister("unregistered", phone);
        registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "unregistered", phone); 
    }

    onInitializationWaiting(phone){
        /**
         * If register fails send error message to Callback function 
         */
        registerCallback.initializeRegister("sent_request", phone);
        registerCallback.triggerRegisterCallback();
        diagnosticsCallback.triggerKeyValueSetCallback("userReg", "sent_request", phone); 
    }

    onLog(LogLevel, tag, message){
        /**
         * To get SDK logs
         */
    }
    onAuthenticationFailure(){
        /**
         * In case if there is any authentication error in registration, handle here
         */
    }
}