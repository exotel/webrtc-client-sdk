import { Call } from "../api/callAPI/Call";
import { DoRegister as DoRegisterRL, UnRegister as UnRegisterRL } from '../api/registerAPI/RegisterListener';
import { CallListener } from '../listeners/CallListener';
import { ExotelVoiceClientListener } from '../listeners/ExotelVoiceClientListener';
import { SessionListener as SessionListenerSL } from '../listeners/SessionListeners';
import { CallController } from "./CallCtrlerDummy";

import { closeDiagnostics as closeDiagnosticsDL, initDiagnostics as initDiagnosticsDL, startMicDiagnosticsTest as startMicDiagnosticsTestDL, startNetworkDiagnostics as startNetworkDiagnosticsDL, startSpeakerDiagnosticsTest as startSpeakerDiagnosticsTestDL, stopMicDiagnosticsTest as stopMicDiagnosticsTestDL, stopNetworkDiagnostics as stopNetworkDiagnosticsDL, stopSpeakerDiagnosticsTest as stopSpeakerDiagnosticsTestDL } from '../api/omAPI/DiagnosticsListener';

import { callbacks, registerCallback, sessionCallback } from '../listeners/Callback';
import { webrtcTroubleshooterEventBus } from "./Callback";

import { webrtcSIPPhone } from '@exotel-npm-dev/webrtc-core-sdk';
import { CallDetails } from "../api/callAPI/CallDetails";

var intervalId;
var intervalIDMap = new Map();

var logger = webrtcSIPPhone.getLogger();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FQDN for fetching IP
 */
function fetchPublicIP(sipAccountInfo) {
    var publicIp = "";
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer))
    pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
            logger.log("all done.");
            pc.close();
            return "";
        }
        logger.log("iceCandidate =" + ice.candidate.candidate);
        let split = ice.candidate.candidate.split(" ");
        if (split[7] === "host") {
            logger.log(`fetchPublicIP:Local IP : ${split[4]}`);
        } else {
            logger.log(`fetchPublicIP:External IP : ${split[4]}`);
            publicIp = `${split[4]}`
            logger.log("fetchPublicIP:Public IP :" + publicIp);
            localStorage.setItem("contactHost", publicIp);
            pc.close();
        }
    };
    sleep(500).then(function () {
        logger.log("fetchPublicIP: public ip = ", publicIp)
        if (publicIp == "") {
            sipAccountInfo.contactHost = window.localStorage.getItem('contactHost');
        } else {
            sipAccountInfo.contactHost = publicIp;
        }
    });
    return;
};


export function ExDelegationHandler(exClient_) {
    var exClient = exClient_;
    this.setTestingMode = function (mode) {
        logger.log("delegationHandler: setTestingMode\n");
    }

    this.onCallStatSipJsSessionEvent = function (ev) {
        logger.log("delegationHandler: onCallStatSipJsSessionEvent\n");
    }

    this.sendWebRTCEventsToFSM = function (eventType, sipMethod) {
        logger.log("delegationHandler: sendWebRTCEventsToFSM\n");
        logger.log("delegationHandler: eventType\n", eventType);
        logger.log("delegationHandler: sipMethod\n", sipMethod);
        if (sipMethod == "CONNECTION") {
            exClient.registerEventCallback(eventType, exClient.userName)
        } else if (sipMethod == "CALL") {
            exClient.callEventCallback(eventType, exClient.callFromNumber, exClient.call)
        }
    }

    this.playBeepTone = function () {
        logger.log("delegationHandler: playBeepTone\n");
    }

    this.onStatPeerConnectionIceGatheringStateChange = function (iceGatheringState) {
        logger.log("delegationHandler: onStatPeerConnectionIceGatheringStateChange\n");
    }

    this.onCallStatIceCandidate = function (ev, icestate) {
        logger.log("delegationHandler: onCallStatIceCandidate\n");
    }

    this.onCallStatNegoNeeded = function (icestate) {
        logger.log("delegationHandler: onCallStatNegoNeeded\n");
    }

    this.onCallStatSignalingStateChange = function (cstate) {
        logger.log("delegationHandler: onCallStatSignalingStateChange\n");
    }

    this.onStatPeerConnectionIceConnectionStateChange = function () {
        logger.log("delegationHandler: onStatPeerConnectionIceConnectionStateChange\n");
    }

    this.onStatPeerConnectionConnectionStateChange = function () {
        logger.log("delegationHandler: onStatPeerConnectionConnectionStateChange\n");
    }

    this.onGetUserMediaSuccessCallstatCallback = function () {
        logger.log("delegationHandler: onGetUserMediaSuccessCallstatCallback\n");
    }

    this.onGetUserMediaErrorCallstatCallback = function () {
        logger.log("delegationHandler: onGetUserMediaErrorCallstatCallback\n");
    }

    this.onCallStatAddStream = function () {
        logger.log("delegationHandler: onCallStatAddStream\n");
    }

    this.onCallStatRemoveStream = function () {
        logger.log("delegationHandler: onCallStatRemoveStream\n");
    }

    this.setWebRTCFSMMapper = function (stack) {
        logger.log("delegationHandler: setWebRTCFSMMapper : Initialisation complete \n");
    }

    this.onCallStatSipJsTransportEvent = function () {
        logger.log("delegationHandler: onCallStatSipJsTransportEvent\n");
    }

    this.onCallStatSipSendCallback = function () {
        logger.log("delegationHandler: onCallStatSipSendCallback\n");
    }

    this.onCallStatSipRecvCallback = function () {
        logger.log("delegationHandler: onCallStatSipRecvCallback\n");
    }

    this.stopCallStat = function () {
        logger.log("delegationHandler: stopCallStat\n");
    }

    this.onRecieveInvite = function (incomingSession) {
        logger.log("delegationHandler: onRecieveInvite\n");
        exClient.callFromNumber = incomingSession.incomingInviteRequest.message.from.displayName;
        CallDetails.callSid = incomingSession.incomingInviteRequest.message.headers['X-Exotel-Callsid'][0].raw;
        CallDetails.callId = incomingSession.incomingInviteRequest.message.headers['Call-ID'][0].raw;
        const result = {};
        const obj = incomingSession.incomingInviteRequest.message.headers;
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

    this.onPickCall = function () {
        logger.log("delegationHandler: onPickCall\n");
    }

    this.onRejectCall = function () {
        logger.log("delegationHandler: onRejectCall\n");
    }

    this.onCreaterAnswer = function () {
        logger.log("delegationHandler: onCreaterAnswer\n");
    }

    this.onSettingLocalDesc = function () {
        logger.log("delegationHandler: onSettingLocalDesc\n");
    }

    this.initGetStats = function (pc, callid, username) {
        logger.log("delegationHandler: initGetStats\n");
    }

    this.onRegisterWebRTCSIPEngine = function (engine) {
        logger.log("delegationHandler: onRegisterWebRTCSIPEngine, engine=\n", engine);
    }
}

export function ExSynchronousHandler() {

    this.onFailure = function () {
        logger.log("synchronousHandler: onFailure, phone is offline.\n");
    }

    this.onResponse = function () {
        logger.log("synchronousHandler: onResponse, phone is connected.\n");
    }
}

export class ExotelWebClient {



    ctrlr = null;
    call;
    eventListener = null;
    callListener = null;
    callFromNumber = null;
    shouldAutoRetry = false;
    unregisterInitiated = false;
    registrationInProgress = false;
    isReadyToRegister = true;
    /* OLD-Way to be revisited for multile phone support */
    //this.webRTCPhones = {};

    sipAccountInfo = null;

    initWebrtc = (sipAccountInfo_,
        RegisterEventCallBack, CallListenerCallback, SessionCallback) => {

        if (!this.eventListener) {
            this.eventListener = new ExotelVoiceClientListener();
        }

        if (!this.callListener) {
            this.callListener = new CallListener();
        }

        if (!this.ctrlr) {
            this.ctrlr = new CallController();
        }

        if (!this.call) {
            this.call = new Call();
        }

        logger.log("Exotel Client Initialised with " + JSON.stringify(sipAccountInfo_))
        this.sipAccountInfo = sipAccountInfo_;
        if (!this.sipAccountInfo["userName"] || !this.sipAccountInfo["sipdomain"] || !this.sipAccountInfo["port"]) {
            return false;
        }
        this.sipAccountInfo["sipUri"] = "wss://" + this.sipAccountInfo["userName"] + "@" + this.sipAccountInfo["sipdomain"] + ":" + this.sipAccountInfo["port"];

        callbacks.initializeCallback(CallListenerCallback);
        registerCallback.initializeRegisterCallback(RegisterEventCallBack);
        logger.log("Initializing session callback")
        sessionCallback.initializeSessionCallback(SessionCallback);
        this.setEventListener(this.eventListener);
        return true;
    };

    DoRegister = () => {
        logger.log("ExWebClient:DoRegister Entry")
        if (!this.isReadyToRegister){
            logger.warn("ExWebClient:DoRegister SDK is not ready to register");
            return false;
        }
        DoRegisterRL(this.sipAccountInfo, this);
        return true;
    };

    UnRegister = () => {
        logger.log("ExWebClient:UnRegister Entry")
        UnRegisterRL(this.sipAccountInfo, this)
    };

    initDiagnostics = (saveDiagnosticsCallback, keyValueSetCallback) => {
        initDiagnosticsDL(saveDiagnosticsCallback, keyValueSetCallback)
    };

    closeDiagnostics = () => {
        closeDiagnosticsDL()
    };

    startSpeakerDiagnosticsTest = () => {
        startSpeakerDiagnosticsTestDL()
    };

    stopSpeakerDiagnosticsTest = (speakerTestResponse = 'none') => {
        stopSpeakerDiagnosticsTestDL(speakerTestResponse)
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

    SessionListener = () => {
        SessionListenerSL()
    };

    /**
     * function that returns the instance of the call controller object object
     */

    getCallController = () => {
        return this.ctrlr;
    };

    getCall = () => {
        if (!this.call) {
            this.call = call = new Call();
        }
        return this.call;
    };

    /**
     * Dummy function to set the event listener object
     */
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

        logger.log("Dialer: registerEventCallback: Received ---> " + event + 'phone....', phone + 'param....', param)
        if (event === "connected") {
            /**
             * When registration is successful then send the phone number of the same to UI
             */
            this.eventListener.onInitializationSuccess(phone);
            this.registrationInProgress = false;
            if (this.unregisterInitiated) {
                logger.log("ExWebClient:registerEventCallback unregistering due to unregisterInitiated");
                this.unregisterInitiated = false;
                this.unregister();
            }
        } else if (event === "failed_to_start" || event === "transport_error") {
            /**
             * If registration fails
             */
            this.eventListener.onInitializationFailure(phone);
            if (this.unregisterInitiated) {
                this.shouldAutoRetry = false;
                this.unregisterInitiated = false;
                this.isReadyToRegister = true;
            }
            if (this.shouldAutoRetry) {
                logger.log("ExWebClient:registerEventCallback Autoretrying");
                DoRegisterRL(this.sipAccountInfo, this);
            }
        } else if (event === "sent_request") {
            /**
             * If registration request waiting...
             */
            this.eventListener.onInitializationWaiting(phone);
        }
    };
    /**
     * Event listener for calls, any change in sipjsphone will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
    callEventCallback = (event, phone, param) => {
        logger.log("Dialer: callEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
        if (event === "i_new_call") {
            this.callListener.onIncomingCall(param, phone)
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
        logger.log("ExWebClient:unregister Entry");
        this.shouldAutoRetry = false;
        this.unregisterInitiated = true;
        if (!this.registrationInProgress) {
            setTimeout(function() {
                webrtcSIPPhone.sipUnRegisterWebRTC();
            }, 500);
        }
    };


    webRTCStatusCallbackHandler = (msg1, arg1) => {
        logger.log("webRTCStatusCallbackHandler: " + msg1 + " " + arg1)
    };

    /**
     * initialize function called when user wants to register client
     */
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

        logger.log('Sending register for the number..', subscriberName);

        fetchPublicIP(sipAccountInfo);

        /* Temporary till we figure out the arguments - Start */
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
        /* Temporary till we figure out the arguments - End */

        /* This is permanent -Start */
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
        /* This is permanent -End */

        /**
         * Call the webclient function inside this and pass register and call callbacks as arg
         */
        var synchronousHandler = new ExSynchronousHandler(this);
        var delegationHandler = new ExDelegationHandler(this);

        var userName = this.userName;
        /* OLD-Way to be revisited for multile phone support */
        //webRTCPhones[userName] = webRTC;

        /* New-Way  */
        webrtcSIPPhone.registerPhone("sipjs", delegationHandler);
        webrtcSIPPhone.registerWebRTCClient(this.sipAccntInfo, synchronousHandler);

        /**
         * Store the intervalID against a map
         */
        intervalIDMap.set(userName, intervalId);
    };

    checkClientStatus = (callback) => {
        // using this function , first it will check mic permission is given or not
        // then it will check if transport is intialize or not
        // then it will check if user is registered or not
        // based on this we can evaludate SDK is ready for call
        var constraints = { audio: true, video: false };
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (mediaStream) {
                var transportState = webrtcSIPPhone.getTransportState();
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
                        var registerationState = webrtcSIPPhone.getRegistrationState();
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
                logger.log("something went wrong during checkClientStatus ", error);
                callback("media_permission_denied");
            });
    };

    changeAudioInputDevice(deviceId, onSuccess, onError) {
        logger.log(`in changeAudioInputDevice() of ExWebClient.js`);
        webrtcSIPPhone.changeAudioInputDevice(deviceId, onSuccess, onError);
    }

    changeAudioOutputDevice(deviceId, onSuccess, onError) {
        logger.log(`in changeAudioOutputDevice() of ExWebClient.js`);
        webrtcSIPPhone.changeAudioOutputDevice(deviceId, onSuccess, onError);
    }

    registerLoggerCallback(callback) {
        logger.registerLoggerCallback(callback);
    }

    registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
        webrtcSIPPhone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
    }
}

export default ExotelWebClient;
