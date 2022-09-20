import { Call }  from "../api/callAPI/Call";
import { CallController } from "./CallCtrlerDummy";
import { CallListener } from '../listeners/CallListener';
import { DoRegister as DoRegisterRL } from '../api/registerAPI/RegisterListener';
import { UnRegister as UnRegisterRL } from '../api/registerAPI/RegisterListener';
import { ExotelVoiceClientListener } from '../listeners/ExotelVoiceClientListener';
import { SessionListener as SessionListenerSL } from '../listeners/SessionListeners';

import { initDiagnostics as initDiagnosticsDL} from '../api/omAPI/DiagnosticsListener';
import { startNetworkDiagnostics as startNetworkDiagnosticsDL} from '../api/omAPI/DiagnosticsListener';
import { stopNetworkDiagnostics as stopNetworkDiagnosticsDL} from '../api/omAPI/DiagnosticsListener';
import { startSpeakerDiagnosticsTest as startSpeakerDiagnosticsTestDL} from '../api/omAPI/DiagnosticsListener';
import { stopSpeakerDiagnosticsTest as stopSpeakerDiagnosticsTestDL} from '../api/omAPI/DiagnosticsListener';
import { startMicDiagnosticsTest as startMicDiagnosticsTestDL} from '../api/omAPI/DiagnosticsListener';
import { stopMicDiagnosticsTest as stopMicDiagnosticsTestDL } from '../api/omAPI/DiagnosticsListener';
import { closeDiagnostics as closeDiagnosticsDL} from '../api/omAPI/DiagnosticsListener';

import { callbacks } from '../listeners/Callback';
import { registerCallback } from '../listeners/Callback';
import { sessionCallback } from '../listeners/Callback';
import { webrtcTroubleshooterEventBus } from "./Callback";

import webrtcSIPPhoneService from '../../webrtc-core-sdk/webrtcSIPPhoneService';
import webrtcSIPPhone from "../../webrtc-core-sdk/webrtcSIPPhone";

import { webrtcLogger } from "../api/omAPI/WebrtcLogger";

var intervalId;
var intervalIDMap = new Map();

var logger = webrtcLogger();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FQDN for fetching IP
 */
function fetchPublicIP(sipAccountInfo) {
    var publicIp = "";
    const pc = new RTCPeerConnection({ iceServers: [ {urls: 'stun:stun.l.google.com:19302'} ] });
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
    this.setTestingMode = function(mode) {
        logger.log("delegationHandler: setTestingMode\n");
    }

    this.onCallStatSipJsSessionEvent = function(ev) {
        logger.log("delegationHandler: onCallStatSipJsSessionEvent\n");
    }

    this.sendWebRTCEventsToFSM = function(eventType, sipMethod) {
        logger.log("delegationHandler: sendWebRTCEventsToFSM\n");
        logger.log("delegationHandler: eventType\n", eventType);
        logger.log("delegationHandler: sipMethod\n", sipMethod);
        if (sipMethod == "CONNECTION") {
            exClient.registerEventCallback(eventType, exClient.userName)
        } else if (sipMethod == "CALL") {
            exClient.callEventCallback(eventType, exClient.userName,exClient.call)
        }
    }

    this.playBeepTone = function() {
        logger.log("delegationHandler: playBeepTone\n");
    }

    this.onStatPeerConnectionIceGatheringStateChange = function(iceGatheringState) {
        logger.log("delegationHandler: onStatPeerConnectionIceGatheringStateChange\n");
    }

    this.onCallStatIceCandidate = function(ev,icestate) {
        logger.log("delegationHandler: onCallStatIceCandidate\n");
    }

    this.onCallStatNegoNeeded = function(icestate) {
        logger.log("delegationHandler: onCallStatNegoNeeded\n");
    }

    this.onCallStatSignalingStateChange = function(cstate) {
        logger.log("delegationHandler: onCallStatSignalingStateChange\n");
    }

    this.onStatPeerConnectionIceConnectionStateChange = function() {
        logger.log("delegationHandler: onStatPeerConnectionIceConnectionStateChange\n");
    }

    this.onStatPeerConnectionConnectionStateChange = function() {
        logger.log("delegationHandler: onStatPeerConnectionConnectionStateChange\n");
    }

    this.onGetUserMediaSuccessCallstatCallback = function() {
        logger.log("delegationHandler: onGetUserMediaSuccessCallstatCallback\n");
    }

    this.onGetUserMediaErrorCallstatCallback = function() {
        logger.log("delegationHandler: onGetUserMediaErrorCallstatCallback\n");
    }

    this.onCallStatAddStream = function() {
        logger.log("delegationHandler: onCallStatAddStream\n");
    }

    this.onCallStatRemoveStream = function() {
        logger.log("delegationHandler: onCallStatRemoveStream\n");
    }

    this.setWebRTCFSMMapper = function(stack) {
        logger.log("delegationHandler: setWebRTCFSMMapper : Initialisation complete \n");
    }

    this.onCallStatSipJsTransportEvent = function() {
        logger.log("delegationHandler: onCallStatSipJsTransportEvent\n");
    }

    this.onCallStatSipSendCallback = function() {
        logger.log("delegationHandler: onCallStatSipSendCallback\n");
    }

    this.onCallStatSipRecvCallback = function() {
        logger.log("delegationHandler: onCallStatSipRecvCallback\n");
    }

    this.stopCallStat = function() {
        logger.log("delegationHandler: stopCallStat\n");
    }

    this.onRecieveInvite = function() {
        logger.log("delegationHandler: onRecieveInvite\n");
    }

    this.onPickCall = function() {
        logger.log("delegationHandler: onPickCall\n");
    }

    this.onRejectCall = function() {
        logger.log("delegationHandler: onRejectCall\n");
    }

    this.onCreaterAnswer = function() {
        logger.log("delegationHandler: onCreaterAnswer\n");
    }

    this.onSettingLocalDesc = function() {
        logger.log("delegationHandler: onSettingLocalDesc\n");
    }

    this.initGetStats = function(pc, callid, username) {
        logger.log("delegationHandler: initGetStats\n");
    }

    this.onRegisterWebRTCSIPEngine = function(engine) {
        logger.log("delegationHandler: onRegisterWebRTCSIPEngine, engine=\n", engine);
    }    
}

export function ExSynchronousHandler() {

    this.onFailure = function() {
        logger.log("synchronousHandler: onFailure, phone is offline.\n");
    }

    this.onResponse = function() {
        logger.log("synchronousHandler: onResponse, phone is connected.\n");
    }
}

export function ExotelWebClient() {



    var ctrlr = null;
    var call = null;
    var eventListener = null;
    var callListener = null;
    /* OLD-Way to be revisited for multile phone support */
    //this.webRTCPhones = {};

    var sipAccountInfo = null;
	console.log(webrtcSIPPhoneService)
    // if (logger) {
    //     webrtcSIPPhoneService.setWebrtcLogger(logger);
    //     console.log("Webrtc Logger")
    // } else {
    //     webrtcSIPPhoneService.setWebrtcLogger(console);
    //     console.log("Console Logger")
    // }

    this.initWebrtc = function(sipAccountInfo_, 
        RegisterEventCallBack, CallListenerCallback, SessionCallback) {

        if (!this.eventListener) {
            this.eventListener = eventListener = new ExotelVoiceClientListener();
        }

        if (!this.callListener) {
            this.callListener = callListener = new CallListener();
        }

        if (!this.ctrlr) {
            this.ctrlr =  ctrlr = new CallController();
        }

        if (!this.call) {
            this.call = call = new Call();
        }

        logger.log("Exotel Client Initialised with " + JSON.stringify(sipAccountInfo_))
        this.sipAccountInfo = sipAccountInfo_;
        if ( !this.sipAccountInfo["userName"] || !this.sipAccountInfo["sipdomain"] || !this.sipAccountInfo["port"]) {
            return false;                
        }
        this.sipAccountInfo["sipUri"] = "wss://" + this.sipAccountInfo["userName"] + "@" + this.sipAccountInfo["sipdomain"] + ":" + this.sipAccountInfo["port"];

        callbacks.initializeCallback(CallListenerCallback);
        registerCallback.initializeRegisterCallback(RegisterEventCallBack);
        logger.log("Initializing session callback")
        sessionCallback.initializeSessionCallback(SessionCallback);
        this.setEventListener(eventListener);
        return true;                
    }

    this.DoRegister = function () {
        DoRegisterRL(this.sipAccountInfo, this)
    }

    this.UnRegister = function () {
        UnRegisterRL(this.sipAccountInfo, this)
    }

    this.initDiagnostics = function (saveDiagnosticsCallback, keyValueSetCallback) {
        initDiagnosticsDL(saveDiagnosticsCallback, keyValueSetCallback)
    }
    
    this.closeDiagnostics = function () {
        closeDiagnosticsDL()
    }


    this.startSpeakerDiagnosticsTest = function () {
        startSpeakerDiagnosticsTestDL()
    }

    this.stopSpeakerDiagnosticsTest = function (speakerTestResponse='none') {
        stopSpeakerDiagnosticsTestDL(speakerTestResponse)
    }

    this.startMicDiagnosticsTest = function () {
        startMicDiagnosticsTestDL()
    }

    this.stopMicDiagnosticsTest = function (micTestResponse='none') {
        stopMicDiagnosticsTestDL(micTestResponse)
    }

    this.startNetworkDiagnostics = function () {
        startNetworkDiagnosticsDL()
        this.DoRegister()
    }

    this.stopNetworkDiagnostics = function () {
        stopNetworkDiagnosticsDL()
    }

    this.SessionListener = function () {
        SessionListenerSL()
    }

    /**
     * function that returns the instance of the call controller object object
     */

    this.getCallController = function() {
        return this.ctrlr;
    }

    this.getCall = function() {
        if (!this.call) {
            this.call = call = new Call();
        }        
        return this.call;
    }

    /**
     * Dummy function to set the event listener object
     */
    this.setEventListener = function(eventListener) {
        this.eventListener = eventListener;
    }


    /**
     * Event listener for registration, any change in registration state will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */

     this.registerEventCallback = function(event, phone, param) {
        
	    logger.log("Dialer: registerEventCallback: Received ---> " + event + 'phone....', phone + 'param....', param)
        if (event === "connected") {
            /**
             * When registration is successful then send the phone number of the same to UI
             */
            eventListener.onInitializationSuccess(phone);
        } else if( event === "failed_to_start" || event === "transport_error"){
            /**
             * If registration fails
             */
            eventListener.onInitializationFailure(phone);
        } else if( event === "sent_request"){
            /**
             * If registration request waiting...
             */
            eventListener.onInitializationWaiting(phone);
        } 
    }
    /**
     * Event listener for calls, any change in sipjsphone will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
    this.callEventCallback = function(event, phone, param) {
	    logger.log("Dialer: callEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
        if (event === "i_new_call") {
            callListener.onIncomingCall(param,phone)
        } else if (event === "connected") {
            callListener.onCallEstablished(param,phone);
        } else if (event === "terminated") {
            callListener.onCallEnded(param,phone);          
        }
    }
    
    /**
     * Event listener for diagnostic tests, any change in diagnostic tests will trigger this callback
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
     this.diagnosticEventCallback = function(event, phone, param) {
        webrtcTroubleshooterEventBus.sendDiagnosticEvent(event, phone, param)
    }
        
    /**
     * Function to unregister a phone
     * @param {*} sipAccountInfo 
     */
    this.unregister = function(sipAccountInfo){
        webrtcSIPPhone.unregister(sipAccountInfo)
    } 


    this.webRTCStatusCallbackHandler = function(msg1, arg1) {
        logger.log("webRTCStatusCallbackHandler: " + msg1 + " " + arg1)
    }

    /**
     * initialize function called when user wants to register client
     */
    this.initialize = function(uiContext, hostName,subscriberName,
            displayName,accountSid,subscriberToken,
            sipAccountInfo){

        let wssPort = sipAccountInfo.port;
        let wsPort = 4442;
        this.sipAccntInfo = {
        'userName':'',
        'authUser':'',
        'domain':'',
        'sipdomain':'',
        'displayname':'',
        'accountSid':'',
        'secret':'',	
        'sipUri':'',
        'security':'',
        'port':'',
        'contactHost':''
        }
                        
        logger.log('Sending register for the number..', subscriberName);

        fetchPublicIP(sipAccountInfo);

        /* Temporary till we figure out the arguments - Start */
        this.domain = this.hostName = sipAccountInfo.domain;
        this.sipdomain = sipAccountInfo.sipdomain;
        this.accountName = this.userName = sipAccountInfo.userName;
        this.authUser = this.subscriberName = sipAccountInfo.authUser;
        this.displayName = sipAccountInfo.displayName;
        this.accountSid = 'exotelt1';
        this.subscriberToken = sipAccountInfo.secret;
        this.secret = this.password = sipAccountInfo.secret;
        this.security = sipAccountInfo.security;
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
        this.sipAccntInfo['authUser'] = this.subscriberName;
        this.sipAccntInfo['domain'] = this.hostName;
        this.sipAccntInfo['sipdomain'] = this.sipdomain;
        this.sipAccntInfo['accountName'] = this.userName;
        this.sipAccntInfo['secret'] = this.password;
        this.sipAccntInfo['sipuri'] = this.sipuri;
        this.sipAccntInfo['security'] = this.security;
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
        //this.webRTCPhones[this.userName] = webRTC;

        /* New-Way  */
        webrtcSIPPhoneService.init("sipjs", this,
        this.webRTCStatusCallbackHandler, delegationHandler, synchronousHandler);

         /**
          * Store the intervalID against a map
          */
         intervalIDMap.set(userName, intervalId);
    };
      
}
