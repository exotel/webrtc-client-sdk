import { Call } from "../api/callAPI/Call";
import { DoRegister as DoRegisterRL, UnRegister as UnRegisterRL } from '../api/registerAPI/RegisterListener';
import { CallListener } from '../listeners/CallListener';
import { ExotelVoiceClientListener } from '../listeners/ExotelVoiceClientListener';
import { SessionListener } from '../listeners/SessionListeners';
import { CallController } from "./CallCtrlerDummy";

import { closeDiagnostics as closeDiagnosticsDL, initDiagnostics as initDiagnosticsDL, startMicDiagnosticsTest as startMicDiagnosticsTestDL, startNetworkDiagnostics as startNetworkDiagnosticsDL, startSpeakerDiagnosticsTest as startSpeakerDiagnosticsTestDL, stopMicDiagnosticsTest as stopMicDiagnosticsTestDL, stopNetworkDiagnostics as stopNetworkDiagnosticsDL, stopSpeakerDiagnosticsTest as stopSpeakerDiagnosticsTestDL } from '../api/omAPI/DiagnosticsListener';

import { Callback, RegisterCallback, SessionCallback } from '../listeners/Callback';
import { webrtcTroubleshooterEventBus } from "./Callback";

import { WebrtcSIPPhone } from "@exotel-npm-dev/webrtc-core-sdk";
import { CallDetails } from "../api/callAPI/CallDetails";
import LogManager from '../api/LogManager.js';
import CoreSDKLogger from "@exotel-npm-dev/webrtc-core-sdk/src/coreSDKLogger.js";
const phonePool = new Map();
var intervalId;
var intervalIDMap = new Map();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FQDN for fetching IP
 */
function fetchPublicIP(sipAccountInfo, logger) {
    return new Promise((resolve) => {
        var publicIp = "";
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer))
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) {
                pc.close();
                resolve();
                return;
            }
            logger.log("iceCandidate =" + ice.candidate.candidate);
            let split = ice.candidate.candidate.split(" ");
            if (split[7] === "host") {
                logger.log(`fetchPublicIP:Local IP : ${split[4]}`);
            } else {
                this.logger.log(`fetchPublicIP:External IP : ${split[4]}`);
                publicIp = `${split[4]}`
                this.logger.log("fetchPublicIP:Public IP :" + publicIp);
                localStorage.setItem("contactHost", publicIp);
                pc.close();
                resolve();
            }
        };
        setTimeout(() => {
            this.logger.log("fetchPublicIP: public ip = ", publicIp)
            if (publicIp == "") {
                sipAccountInfo.contactHost = window.localStorage.getItem('contactHost');
            } else {
                sipAccountInfo.contactHost = publicIp;
            }
            resolve();
        }, 1000);
    });
}

class ExDelegationHandler {
    constructor(exClient) {
        this.exClient = exClient;
        this.sessionCallback = exClient.sessionCallback;
    }
    setTestingMode(mode) {
        this.logger.log("delegationHandler: setTestingMode\n");
    }
    onCallStatSipJsSessionEvent(ev) {
        this.logger.log("delegationHandler: onCallStatSipJsSessionEvent", ev);
    }
    sendWebRTCEventsToFSM(eventType, sipMethod) {
        this.logger.log("delegationHandler: sendWebRTCEventsToFSM\n");
        this.logger.log("delegationHandler: eventType\n", eventType);
        this.logger.log("delegationHandler: sipMethod\n", sipMethod);

        if (sipMethod == "CONNECTION") {
            this.exClient.registerEventCallback(eventType, this.exClient.userName);
        } else if (sipMethod == "CALL") {
            this.exClient.callEventCallback(eventType, this.exClient.callFromNumber, this.exClient.call);
        }
    }
    playBeepTone() {
        this.logger.log("delegationHandler: playBeepTone\n");
    }
    onStatPeerConnectionIceGatheringStateChange(iceGatheringState) {
        this.logger.log("delegationHandler: onStatPeerConnectionIceGatheringStateChange\n");
        this.sessionCallback.initializeSession(`ice_gathering_state_${iceGatheringState}`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onCallStatIceCandidate(ev, icestate) {
        this.logger.log("delegationHandler: onCallStatIceCandidate\n");
    }
    onCallStatNegoNeeded(icestate) {
        this.logger.log("delegationHandler: onCallStatNegoNeeded\n");
    }
    onCallStatSignalingStateChange(cstate) {
        this.logger.log("delegationHandler: onCallStatSignalingStateChange\n");
    }
    onStatPeerConnectionIceConnectionStateChange(iceConnectionState) {
        this.logger.log("delegationHandler: onStatPeerConnectionIceConnectionStateChange\n");
        this.sessionCallback.initializeSession(`ice_connection_state_${iceConnectionState}`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onStatPeerConnectionConnectionStateChange() {
        this.logger.log("delegationHandler: onStatPeerConnectionConnectionStateChange\n");
    }
    onGetUserMediaSuccessCallstatCallback() {
        this.logger.log("delegationHandler: onGetUserMediaSuccessCallstatCallback\n");
    }
    onGetUserMediaErrorCallstatCallback() {
        this.logger.log("delegationHandler: onGetUserMediaErrorCallstatCallback\n");
        this.sessionCallback.initializeSession(`media_permission_denied`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onCallStatAddStream() {
        this.logger.log("delegationHandler: onCallStatAddStream\n");
    }
    onCallStatRemoveStream() {
        this.logger.log("delegationHandler: onCallStatRemoveStream\n");
    }
    setWebRTCFSMMapper(stack) {
        this.logger.log("delegationHandler: setWebRTCFSMMapper : Initialisation complete \n");
    }
    onCallStatSipJsTransportEvent() {
        this.logger.log("delegationHandler: onCallStatSipJsTransportEvent\n");
    }
    onCallStatSipSendCallback() {
        this.logger.log("delegationHandler: onCallStatSipSendCallback\n");
    }
    onCallStatSipRecvCallback() {
        this.logger.log("delegationHandler: onCallStatSipRecvCallback\n");
    }
    stopCallStat() {
        this.logger.log("delegationHandler: stopCallStat\n");
    }
    onRecieveInvite(incomingSession) {
        this.logger.log("delegationHandler: onRecieveInvite\n");
        const obj = incomingSession.incomingInviteRequest.message.headers;
        this.exClient.callFromNumber = incomingSession.incomingInviteRequest.message.from.displayName;
        if (obj.hasOwnProperty("X-Exotel-Callsid")) {
            CallDetails.callSid = obj['X-Exotel-Callsid'][0].raw;
        }
        if (obj.hasOwnProperty("Call-ID")) {
            CallDetails.callId = obj['Call-ID'][0].raw;
        }
        if (obj.hasOwnProperty("LegSid")) {
            CallDetails.legSid = obj['LegSid'][0].raw;
        }
        const result = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key].length == 1) {
                    result[key] = obj[key][0].raw;
                } else if (obj[key].length > 1) {
                    result[key] = obj[key].map(item => item.raw);
                }
            }
        }
        CallDetails.sipHeaders = result;
    }
    onPickCall() {
        this.logger.log("delegationHandler: onPickCall\n");
    }
    onRejectCall() {
        this.logger.log("delegationHandler: onRejectCall\n");
    }
    onCreaterAnswer() {
        this.logger.log("delegationHandler: onCreaterAnswer\n");
    }
    onSettingLocalDesc() {
        this.logger.log("delegationHandler: onSettingLocalDesc\n");
    }
    initGetStats(pc, callid, username) {
        this.logger.log("delegationHandler: initGetStats\n");
    }
    onRegisterWebRTCSIPEngine(engine) {
        this.logger.log("delegationHandler: onRegisterWebRTCSIPEngine, engine=\n", engine);
    }
}

class ExSynchronousHandler {
    onFailure() {
        this.logger.log("synchronousHandler: onFailure, phone is offline.\n");
    }
    onResponse() {
        this.logger.log("synchronousHandler: onResponse, phone is connected.\n");
    }
}

export { ExDelegationHandler, ExSynchronousHandler };

export class ExotelWebClient {
  /**
   * @param {Object} sipAccntInfo 
   */


    ctrlr = null;
    call;
    eventListener = null;
    callListener = null;
    callFromNumber = null;
    shouldAutoRetry = false;
    unregisterInitiated = false;
    registrationInProgress = false;
    isReadyToRegister = true;


    sipAccountInfo = null;
    loggerCallback = null;
    callbacks  = null;
    registerCallback = null;
    sessionCallback = null;
    logger = null;
        
    constructor() {
        this.logger = new CoreSDKLogger();
        // Initialize properties
        this.ctrlr = null;
        this.call = null;
        this.eventListener = null;
        this.callListener = null;
        this.callFromNumber = null;
        this.shouldAutoRetry = false;
        this.unregisterInitiated = false;
        this.registrationInProgress = false;
        this.currentSIPUserName = "";      
        this.isReadyToRegister = true;
        this.sipAccountInfo = null;
        this.clientSDKLoggerCallback = null;
        this.callbacks = new Callback(this.logger);
        this.registerCallback = new RegisterCallback();
        this.sessionCallback = new SessionCallback(this.logger);
        

        // Register this.logger callback
        let exwebClientOb = this;
        this.logger.registerLoggerCallback((type, message, args) => {
            LogManager.onLog(type, message, args);
            if (exwebClientOb.clientSDKLoggerCallback) {
                exwebClientOb.clientSDKLoggerCallback("log", message, args);
            }
        });
    }
    

    initWebrtc = async (sipAccountInfo_,
        RegisterEventCallBack, CallListenerCallback, SessionCallback, enableAutoAudioDeviceChangeHandling=false) => {
        const userName = sipAccountInfo_?.userName;
        if (!userName) return false;

        // --- Duplicate registration guard ---
        if (phonePool.has(userName)) {
            if (this.currentSIPUserName == "" || this.currentSIPUserName !== userName) {
                this.logger.warn(`ExWebClient: initWebrtc: [Dup‑Reg] ${userName} already in use – init rejected`);
                return false;
            }
        }
        this.currentSIPUserName = userName;
        phonePool.set(userName, null); 

        if (!this.eventListener) {
            this.eventListener = new ExotelVoiceClientListener(this.registerCallback);
        }

        if (!this.callListener) {
            this.callListener = new CallListener(this.callbacks);
        }

        if (!this.sessionListener) {
            this.sessionListener = new SessionListener(this.sessionCallback);
        }

        if (!this.ctrlr) {
            this.ctrlr = new CallController();
        }

        sipAccountInfo_.enableAutoAudioDeviceChangeHandling = enableAutoAudioDeviceChangeHandling;
        this.logger.log("ExWebClient: initWebrtc: Exotel Client Initialised with " + JSON.stringify(sipAccountInfo_))
        this.sipAccountInfo = sipAccountInfo_;
        if (!this.sipAccountInfo["userName"] || !this.sipAccountInfo["sipdomain"] || !this.sipAccountInfo["port"]) {
            return false;
        }
        this.sipAccountInfo["sipUri"] = "wss://" + this.sipAccountInfo["userName"] + "@" + this.sipAccountInfo["sipdomain"] + ":" + this.sipAccountInfo["port"];
        
        // Register callbacks using the correct methods
        this.callbacks.registerCallback('call', CallListenerCallback);
        this.registerCallback.initializeRegisterCallback(RegisterEventCallBack);
        this.logger.log("ExWebClient: initWebrtc: Initializing session callback")
        this.sessionCallback.initializeSessionCallback(SessionCallback);
        this.setEventListener(this.eventListener);

        // Wait for public IP before registering
        await fetchPublicIP(this.sipAccountInfo, this.logger);

        // Create phone instance if it wasn't created in constructor
        if (!this.phone) {
            this.userName = this.sipAccountInfo.userName;
            let phone = phonePool.get(this.userName);
            if (!phone) {
                phone = new WebrtcSIPPhone(this.userName, this.logger);
                phonePool.set(this.userName, phone);
            }
            this.phone = phone;
            this.webrtcSIPPhone = this.phone;
        }

        // Initialize the phone with SIP engine
        this.webrtcSIPPhone.registerPhone("sipjs", new ExDelegationHandler(this), this.sipAccountInfo.enableAutoAudioDeviceChangeHandling);

        // Create call instance after phone is initialized
        if (!this.call) {
            this.call = new Call(this.webrtcSIPPhone);
        }

        return true;
    };

    DoRegister = () => {
        this.logger.log("ExWebClient: DoRegister: Entry")
        if (!this.isReadyToRegister) {
            this.logger.warn("ExWebClient: DoRegister: SDK is not ready to register");
            return false;
        }
        DoRegisterRL(this.sipAccountInfo, this);
        return true;
    };

    UnRegister = () => {
        this.logger.log("ExWebClient: UnRegister: Entry")
        UnRegisterRL(this.sipAccountInfo, this)
    };

    initDiagnostics = (saveDiagnosticsCallback, keyValueSetCallback) => {
        initDiagnosticsDL(saveDiagnosticsCallback, keyValueSetCallback)
    };

    closeDiagnostics = () => {
        closeDiagnosticsDL()
    };

    startSpeakerDiagnosticsTest = () => {
        startSpeakerDiagnosticsTestDL(this.webrtcSIPPhone);
    };

    stopSpeakerDiagnosticsTest = (speakerTestResponse = 'none') => {
        stopSpeakerDiagnosticsTestDL(speakerTestResponse, this.webrtcSIPPhone);
    };

    startMicDiagnosticsTest = () => {
        startMicDiagnosticsTestDL()
    };

    stopMicDiagnosticsTest = (micTestResponse = 'none') => {
        stopMicDiagnosticsTestDL(micTestResponse)
    };

    startNetworkDiagnostics = () => {
        startNetworkDiagnosticsDL()
        this.DoRegister()
    };

    stopNetworkDiagnostics = () => {
        stopNetworkDiagnosticsDL()
    };

    SessionListenerMethod = () => {
    };


    getCallController = () => {
        return this.ctrlr;
    };

    getCall = () => {
        if (!this.call) {
            this.call = new Call(this.webrtcSIPPhone);
        }
        return this.call;
    };

   
    setEventListener = (eventListener) => {
        this.eventListener = eventListener;
    };


    /**
     * Event listener for registration, any change in registration state will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */

    registerEventCallback = (event, phone, param) => {
        this.logger.log("ExWebClient: registerEventCallback: Received ---> " +
            event, [phone, param]);

        const lowerCaseEvent = event.toLowerCase();

        if (lowerCaseEvent === "registered") {
            this.registrationInProgress = false;
            this.unregisterInitiated = false;
            this.isReadyToRegister = false;
            this.eventListener.onRegistrationStateChanged("registered", phone);
        } else if (lowerCaseEvent === "unregistered" || lowerCaseEvent === "terminated") {
            this.registrationInProgress = false;
            this.unregisterInitiated = false;
            this.isReadyToRegister = true;
            this.eventListener.onRegistrationStateChanged("unregistered", phone);
        }
    };
    /**
     * Event listener for calls, any change in sipjsphone will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
    callEventCallback = (event, phone, param) => {
        this.logger.log("ExWebClient: callEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
        if (event === "i_new_call") {
            if (!this.call) {
                this.call = new Call(param); // param is the session
            }
            this.callListener.onIncomingCall(param, phone);
        } else if (event === "ringing" || event === "accept_reject") {
            this.callListener.onRinging(param, phone);
        } else if (event === "connected") {
            this.callListener.onCallEstablished(param, phone);
        } else if (event === "terminated") {
            this.callListener.onCallEnded(param, phone);
        }
    };

    /**
     * Event listener for diagnostic tests, any change in diagnostic tests will trigger this callback
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
    diagnosticEventCallback = (event, phone, param) => {
        webrtcTroubleshooterEventBus.sendDiagnosticEvent(event, phone, param)
    };

    /**
     * Function to unregister a phone
     * @param {*} sipAccountInfo 
     */
    unregister = (sipAccountInfo) => {
        this.logger.log("ExWebClient: unregister: Entry");
        this.shouldAutoRetry = false;
        this.unregisterInitiated = true;
        if (!this.registrationInProgress) {
            setTimeout(() => {
                const phone = phonePool[this.userName] || this.webrtcSIPPhone;
                if (phone) {
                  phone.sipUnRegisterWebRTC(); 
                  phone.disconnect?.();
                }
              }, 500);
        }
      };
      

    webRTCStatusCallbackHandler = (msg1, arg1) => {
        this.logger.log("ExWebClient: webRTCStatusCallbackHandler: " + msg1 + " " + arg1)
    };


    initialize = (uiContext, hostName, subscriberName,
        displayName, accountSid, subscriberToken,
        sipAccountInfo) => {
        let wssPort = sipAccountInfo.port;
        let wsPort = 4442;
        this.isReadyToRegister = false;
        this.registrationInProgress = true;
        this.shouldAutoRetry = true;
        this.sipAccntInfo = {
            'userName': '',
            'authUser': '',
            'domain': '',
            'sipdomain': '',
            'displayname': '',
            'accountSid': '',
            'secret': '',
            'sipUri': '',
            'security': '',
            'endpoint': '',
            'port': '',
            'contactHost': ''
        }

        this.logger.log('ExWebClient: initialize: Sending register for the number..', subscriberName);

        fetchPublicIP(sipAccountInfo, this.logger);

        this.domain = hostName = sipAccountInfo.domain;
        this.sipdomain = sipAccountInfo.sipdomain;
        this.accountName = this.userName = sipAccountInfo.userName;
        this.authUser = subscriberName = sipAccountInfo.authUser;
        this.displayName = sipAccountInfo.displayName;
        this.accountSid = 'exotelt1';
        this.subscriberToken = sipAccountInfo.secret;
        this.secret = this.password = sipAccountInfo.secret;
        this.security = sipAccountInfo.security ? sipAccountInfo.security : "wss";
        this.endpoint = sipAccountInfo.endpoint ? sipAccountInfo.endpoint : "wss";
        this.port = sipAccountInfo.port;
        this.contactHost = sipAccountInfo.contactHost;
        this.sipWsPort = 5061;
        this.sipPort = 5061;
        this.sipSecurePort = 5062;

        let webrtcPort = wssPort;

        if (this.security === 'ws') {
            webrtcPort = wsPort;
        }



        this.sipAccntInfo['userName'] = this.userName;
        this.sipAccntInfo['authUser'] = subscriberName;
        this.sipAccntInfo['domain'] = hostName;
        this.sipAccntInfo['sipdomain'] = this.sipdomain;
        this.sipAccntInfo['accountName'] = this.userName;
        this.sipAccntInfo['secret'] = this.password;
        this.sipAccntInfo['sipuri'] = this.sipuri;
        this.sipAccntInfo['security'] = this.security;
        this.sipAccntInfo['endpoint'] = this.endpoint;
        this.sipAccntInfo['port'] = webrtcPort;
        this.sipAccntInfo['contactHost'] = this.contactHost;
        localStorage.setItem('contactHost', this.contactHost);

        
        var synchronousHandler = new ExSynchronousHandler();
        var delegationHandler = new ExDelegationHandler(this);

        var userName = this.userName;


        this.webrtcSIPPhone.registerPhone("sipjs", delegationHandler, this.sipAccountInfo.enableAutoAudioDeviceChangeHandling);
        this.webrtcSIPPhone.registerWebRTCClient(this.sipAccntInfo, synchronousHandler);
        phonePool[this.userName] = this.webrtcSIPPhone;     

        
        intervalIDMap.set(userName, intervalId);
    };

    checkClientStatus = (callback) => {
        var constraints = { audio: true, video: false };
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (mediaStream) {
                var transportState = this.webrtcSIPPhone.getTransportState();
                transportState = transportState.toLowerCase();
                switch (transportState) {
                    case "":
                        callback("not_initialized");
                        break;
                    case "unknown":
                    case "connecting":
                        callback(transportState);
                        break;

                    default:
                        var registerationState = this.webrtcSIPPhone.getRegistrationState();
                        registerationState = registerationState.toLowerCase();
                        switch (registerationState) {
                            case "":
                                callback("websocket_connection_failed");
                                break;
                            case "registered":
                                if (transportState != "connected") {
                                    callback("disconnected");
                                } else {
                                    callback(registerationState);
                                }
                                break;
                            default:
                                callback(registerationState);

                        }


                }
            })
            .catch(function (error) {
                this.logger.log("ExWebClient: checkClientStatus: something went wrong during checkClientStatus ", error);
                callback("media_permission_denied");
            });
    };

    changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
        this.logger.log(`ExWebClient: changeAudioInputDevice: Entry`);
        this.webrtcSIPPhone.changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange);
    }

    changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
        this.logger.log(`ExWebClient: changeAudioOutputDevice: Entry`);
        this.webrtcSIPPhone.changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange);
    }

	downloadLogs() {
        this.logger.log(`ExWebClient: downloadLogs: Entry`);
        LogManager.downloadLogs();
    }

    setPreferredCodec(codecName) {
        this.logger.log("ExWebClient: setPreferredCodec: Entry");
        if (!this.webrtcSIPPhone || !this.webrtcSIPPhone.phone) {
            this.logger.warn("ExWebClient: setPreferredCodec: Phone not initialized");
            return;
        }
        this.webrtcSIPPhone.setPreferredCodec(codecName);
    }

    registerLoggerCallback(callback) {
        this.clientSDKLoggerCallback = callback;
    }

    registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
        this.logger.log("ExWebClient: registerAudioDeviceChangeCallback: Entry");
        if (!this.webrtcSIPPhone) {
            this.logger.warn("ExWebClient: registerAudioDeviceChangeCallback: webrtcSIPPhone not initialized");
            return;
        }
        this.webrtcSIPPhone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
    }

    setEnableConsoleLogging(enable) {
        if (enable) {
            this.logger.log(`ExWebClient: setEnableConsoleLogging: ${enable}`);
        } 

        this.logger.setEnableConsoleLogging(enable);
    }

    setAudioOutputVolume(audioElementName, value) {
        this.logger.log(`ExWebClient: setAudioOutputVolume: Entry`);
        this.webrtcSIPPhone.setAudioOutputVolume(audioElementName, value);
    }

    getAudioOutputVolume(audioElementName) {
        this.logger.log(`ExWebClient: getAudioOutputVolume: Entry`);
        return this.webrtcSIPPhone.getAudioOutputVolume(audioElementName);
    }

}

export default ExotelWebClient;
