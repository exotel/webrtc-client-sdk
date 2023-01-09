import { webrtcLogger } from "../api/omAPI/WebrtcLogger"

var logger = webrtcLogger()

/**
 * The call backs are called through this function. First initiates the call object and then
 * triggers the callback to indicate the same
 */

/**
 * Initializes call event callbacks and also sends to which phone callback was received
 */
export var callbacks = {
    callback: null,
    call: null,
    phone:'',
    initializeCallback: function(CallListenerCallback){
        this.callback = CallListenerCallback;
    },
    initializeCall: function(call, phone){
        this.call = call;
        this.phone = phone;
    },
    triggerCallback: function(eventType){
        const callbackFunc = this.callback;
        const call = this.call;
        return callbackFunc(call, eventType, this.phone);
    }
};

/**
 * Initializes outbound callback
 */
export var outboundCallbacks = {
    outboundCallBack: null,
    call: null,
    initalizeOutboundCallback: function(outboundEventCallBack){
        this.outboundCallBack = outboundEventCallBack;
    },
    initializeCall: function(call){
        this.call = call;
    },
    triggerCallback: function(eventType){
        const callbackFunc = this.outboundCallBack;
        const call = this.call;
        return callbackFunc(eventType, call);
    }
};

/**
 * Initializes register callback and also sets to which phone registration was renewed
 */
    export var registerCallback = {
        registerCallbackHandler :null,
        registerState: null,
        phone:'',
        initializeRegisterCallback: function(RegisterEventCallBack){
            registerCallback.registerCallbackHandler = RegisterEventCallBack;
        },
        initializeRegister: function(state, phone){
            registerCallback.registerState = state;
            registerCallback.phone = phone;
        },
        triggerRegisterCallback: function(){
            const callbackFunc = registerCallback.registerCallbackHandler;
            const state = registerCallback.registerState
            return callbackFunc(state, registerCallback.phone);
        }
    };
/**
 * Sets all the phone instances
 */
    export var phoneInstance = {
        phones:[],
        addPhone: function(webRTCPhone){
                const { length } = this.phones;
                const id = length + 1;
                const found = this.phones.some(el => el.username === webRTCPhone.username);
                if (!found) this.phones.push(webRTCPhone);
                
        },
        getPhone: function(phone){
           for(var x=0; x<this.phones.length; x++){
               if(this.phones[x].username == phone){
                   logger.log('Username...' + this.phones[x].username);
                   return this.phones[x];
               }
           }
        },
        getPhones: function(){
            return this.phones;
        },
        removePhone: function(phone){
            for(var x=0; x<this.phones.length; x++){
                if(this.phones[x].username == phone){
                    this.phones.splice(x, 1);
                }
            }
        }
    };

    export var sessionCallback = {
        sessioncallback: null,
        callState: null,
        document: null,
        documentCallback: null,
        phone:'',
        initializeSessionCallback: function(SessionCallback) {
            this.sessioncallback = SessionCallback;
        },
        intializeDocumentCallback: function(DocumentCallback){
            this.documentCallback = DocumentCallback;
        },
        initializeSession: function(state, phone){
            this.callState = state;
            this.phone = phone;
        },
        initializeDocument: function(calldocument){
            this.document = calldocument;
        },
        triggerDocumentCallback: function(){
            const documentCallbackFunc = this.documentCallback;
            return documentCallbackFunc(this.document);
        },
        triggerSessionCallback: function() {
            const sessionCallBackFunc = this.sessioncallback;
            if (sessionCallBackFunc) {
                return sessionCallBackFunc(this.callState, this.phone);
            } else {
                logger.log("Session callback is null")
                return;
            }
        }
    }

    export var diagnosticsCallback = {
        saveDiagnosticsCallback: null,
        keyValueSetCallback: null,

        setDiagnosticsReportCallback: function(saveDiagnosticsCallback) {
            window.localStorage.setItem('troubleShootReport', "")
            this.saveDiagnosticsCallback = saveDiagnosticsCallback;
        },
        setKeyValueCallback: function(keyValueSetCallback) {
            this.keyValueSetCallback = keyValueSetCallback;
        },

        triggerDiagnosticsSaveCallback: function(saveStatus, saveDescription){
            this.saveDiagnosticsCallback(saveStatus, saveDescription);
            return true;
        },
        triggerKeyValueSetCallback: function(key, status, value){
            if (this.keyValueSetCallback) {
                this.keyValueSetCallback(key, status, value);
            }
            return true;
        },

    }

    export var  webrtcTroubleshooterEventBus = {

        microphoneTestSuccessEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("mic", 100, "mic ok");},
        microphoneTestFailedEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("mic", 0, "mic failed");},
        microphoneTestDoneEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("mic", 0, "mic done");},
        speakerTestSuccessEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("speaker", true, "speaker ok");},
        speakerTestFailedEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("speaker", false, "speaker failed");},
        speakerTestDoneEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("speaker", false, "speaker done");},
        wsConTestSuccessEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("wss","connected", "ws ok"); },
        wsConTestFailedEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("wss","disconnected", "ws failed"); },
        wsConTestDoneEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("wss","error", "ws done"); },
        userRegTestSuccessEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("userReg","registered", "registered");},
        userRegTestFailedEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("userReg","unregistered", "unregistered");},
        userRegTestDoneEvent: function () {diagnosticsCallback.triggerKeyValueSetCallback("userReg","error", "error done");},
        udpTestCompletedEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("udp", true,"udp ok");},
        tcpTestCompletedEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("tcp",true, "tcp ok"); },
        ipv6TestCompletedEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("ipv6", false, "ipv6 done");},
        hostCandidateTestCompletedEvent: function () { diagnosticsCallback.triggerKeyValueSetCallback("host",true, "host ok");},
        reflexCandidateTestCompletedEvent: function (event, phone, param) { 
            logger.log("diagnosticEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
            diagnosticsCallback.triggerKeyValueSetCallback("srflx",true, "reflex ok");
        }
    }


    export var timerSession = {
        
        callTimer: '',
        getTimer: function(){
            return this.callTimer;
        },
        setCallTimer: function(callTimer){
            this.callTimer = callTimer;
            window.localStorage.setItem('callTimer', callTimer)
        }
    }
