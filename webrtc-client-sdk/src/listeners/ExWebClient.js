import { Call } from "../api/callAPI/Call";
import { DoRegister as DoRegisterRL, UnRegister as UnRegisterRL } from '../api/registerAPI/RegisterListener';
import { CallListener } from '../listeners/CallListener';
import { ExotelVoiceClientListener } from '../listeners/ExotelVoiceClientListener';
import { SessionListener } from '../listeners/SessionListeners';
import { CallController } from "./CallCtrlerDummy";

import { closeDiagnostics as closeDiagnosticsDL, initDiagnostics as initDiagnosticsDL, startMicDiagnosticsTest as startMicDiagnosticsTestDL, startNetworkDiagnostics as startNetworkDiagnosticsDL, startSpeakerDiagnosticsTest as startSpeakerDiagnosticsTestDL, stopMicDiagnosticsTest as stopMicDiagnosticsTestDL, stopNetworkDiagnostics as stopNetworkDiagnosticsDL, stopSpeakerDiagnosticsTest as stopSpeakerDiagnosticsTestDL } from '../api/omAPI/DiagnosticsListener';

import { Callback, RegisterCallback, SessionCallback } from '../listeners/Callback';
import { webrtcTroubleshooterEventBus } from "./Callback";

import { WebrtcSIPPhone, getLogger, EventShipper, EVENT_TYPES } from "@exotel-npm-dev/webrtc-core-sdk";
import { CallDetails } from "../api/callAPI/CallDetails";
import LogManager from '../api/LogManager.js';
const phonePool = new Map();
var intervalId;
var intervalIDMap = new Map();
const logger = getLogger();   

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * FQDN for fetching IP
 */
function fetchPublicIP(sipAccountInfo) {
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
                logger.log(`fetchPublicIP:External IP : ${split[4]}`);
                publicIp = `${split[4]}`
                logger.log("fetchPublicIP:Public IP :" + publicIp);
                localStorage.setItem("contactHost", publicIp);
                pc.close();
                resolve();
            }
        };
        setTimeout(() => {
            logger.log("fetchPublicIP: public ip = ", publicIp)
            if (publicIp == "") {
                sipAccountInfo.contactHost = window.localStorage.getItem('contactHost');
            } else {
                sipAccountInfo.contactHost = publicIp;
            }
            resolve();
        }, 1000);
    });
}

// dump call stats in logs . 
function dumpStats(pc, qosCallback, eventShipper = null, session = null) {
    if(pc && pc.connectionState !== 'closed') {
        pc.getStats().then((stats) => {
            let allowedReportTypeFields = {
                'inbound-rtp':{
                    preprocessor : (report) => {
                        if (report['jitterBufferEmittedCount'] > 0) {
                            report.currentJitterBufferDelay = report['jitterBufferDelay'] / report['jitterBufferEmittedCount'];
                        } else {
                            report.currentJitterBufferDelay = 0;
                        }
                        return report;
                    },
                    params:['bytesReceived','jitter','packetsLost','packetsReceived','jitterBufferDelay','jitterBufferEmittedCount','currentJitterBufferDelay']
                },
                'outbound-rtp':{params:['bytesSent','packetsSent']},
                'candidate-pair':{params : ['currentRoundTripTime']},
                'media-playout':{
                    preprocessor : (report) => {     
                        if (report['totalSamplesCount'] > 0) {
                            report.currentPlayoutDelay = report['totalPlayoutDelay'] / report['totalSamplesCount'];
                        } else {
                            report.currentPlayoutDelay = 0;
                        }
                        return report;
                    },
                    params : ['totalPlayoutDelay','totalSamplesCount','currentPlayoutDelay']
                }
            };

            let statsJson = {
                timestamp: Date.now(),
                reports: []
            };

            // Variables for metrics tracking
            let rtt = null;
            let jitter = null;
            let packetsLost = null;
            let packetsReceived = null;

            stats.forEach((report) => {
                if(allowedReportTypeFields.hasOwnProperty(report.type)) {
                    let reportmeta = allowedReportTypeFields[report.type];
                    if(reportmeta.hasOwnProperty("preprocessor")) {
                        report = reportmeta.preprocessor(report);
                    }
                    let fields = allowedReportTypeFields[report.type]['params'];
                    let stat = {
                        type: report.type,
                        timestamp: report.timestamp
                    };
                    fields.forEach((field) => {
                        stat[field] = report[field];
                    });
                    console.log("callstat : " +  report.type + " : " + JSON.stringify(stat));
                    statsJson.reports.push(stat);

                    // Extract metrics for tracking
                    if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
                        rtt = report.currentRoundTripTime;
                    }
                    if (report.type === 'inbound-rtp') {
                        if (report.jitter !== undefined) jitter = report.jitter;
                        if (report.packetsLost !== undefined) packetsLost = report.packetsLost;
                        if (report.packetsReceived !== undefined) packetsReceived = report.packetsReceived;
                    }
                }
            });
            
            // Add peer connection states (iceConnectionState and dtlsState)
            if (pc.iceConnectionState !== undefined) {
                let connectionState = {
                    type: 'peer-connection-state',
                    timestamp: Date.now(),
                    iceConnectionState: pc.iceConnectionState,
                    dtlsState: pc.dtlsState || null
                };
                console.log("callstat : peer-connection-state : " + JSON.stringify(connectionState));
                statsJson.reports.push(connectionState);

                // Track WebRTC connection state
                if (eventShipper && eventShipper.isInitialized) {
                    eventShipper.eventCollector.trackWebRTCConnection({
                        ice_connection_state: pc.iceConnectionState,
                        dtls_state: pc.dtlsState || null
                    }, session); // Pass session for call info extraction
                }
            }

            // Track RTP stats
            if (eventShipper && eventShipper.isInitialized && (rtt !== null || jitter !== null)) {
                let packetLossPercentage = null;
                if (packetsLost !== null && packetsReceived !== null && (packetsLost + packetsReceived) > 0) {
                    packetLossPercentage = (packetsLost / (packetsReceived + packetsLost)) * 100;
                }

                eventShipper.eventCollector.trackRTPStats({
                    rtt: rtt,
                    jitter: jitter,
                    packetLossPercentage: packetLossPercentage,
                    callId: CallDetails.callId,
                    callSid: CallDetails.callSid
                }, session); // Pass session for call info extraction
            }
            
            // If callback is provided, send stats as JSON object to the app
            if (qosCallback && typeof qosCallback === 'function') {
                qosCallback(statsJson);
            }
        }).catch((error) => {
            // Silently handle errors if peer connection is closed
            logger.log("dumpStats: Error getting stats:", error);
        });
    }
}

class ExDelegationHandler {
    constructor(exClient) {
        this.exClient = exClient;
        this.sessionCallback = exClient.sessionCallback;
    }
    setTestingMode(mode) {
        logger.log("delegationHandler: setTestingMode\n");
    }
    onCallStatSipJsSessionEvent(ev) {
        logger.log("delegationHandler: onCallStatSipJsSessionEvent", ev);
    }
    sendWebRTCEventsToFSM(eventType, sipMethod) {
        logger.log("delegationHandler: sendWebRTCEventsToFSM\n");
        logger.log("delegationHandler: eventType\n", eventType);
        logger.log("delegationHandler: sipMethod\n", sipMethod);

        if (sipMethod == "CONNECTION") {
            this.exClient.registerEventCallback(eventType, this.exClient.userName);
        } else if (sipMethod == "CALL") {
            this.exClient.callEventCallback(eventType, this.exClient.callFromNumber, this.exClient.call);
        }
    }
    playBeepTone() {
        logger.log("delegationHandler: playBeepTone\n");
    }
    onStatPeerConnectionIceGatheringStateChange(iceGatheringState) {
        logger.log("delegationHandler: onStatPeerConnectionIceGatheringStateChange\n");
        this.sessionCallback.initializeSession(`ice_gathering_state_${iceGatheringState}`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onCallStatIceCandidate(ev, icestate) {
        logger.log("delegationHandler: onCallStatIceCandidate\n");
    }
    onCallStatNegoNeeded(icestate) {
        logger.log("delegationHandler: onCallStatNegoNeeded\n");
    }
    onCallStatSignalingStateChange(cstate) {
        logger.log("delegationHandler: onCallStatSignalingStateChange\n");
    }
    onStatPeerConnectionIceConnectionStateChange(iceConnectionState) {
        logger.log("delegationHandler: onStatPeerConnectionIceConnectionStateChange\n");
        this.sessionCallback.initializeSession(`ice_connection_state_${iceConnectionState}`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onStatPeerConnectionConnectionStateChange() {
        logger.log("delegationHandler: onStatPeerConnectionConnectionStateChange\n");
    }
    onGetUserMediaSuccessCallstatCallback() {
        logger.log("delegationHandler: onGetUserMediaSuccessCallstatCallback\n");
    }
    onGetUserMediaErrorCallstatCallback() {
        logger.log("delegationHandler: onGetUserMediaErrorCallstatCallback\n");
        this.sessionCallback.initializeSession(`media_permission_denied`, this.exClient.callFromNumber);
        this.sessionCallback.triggerSessionCallback();
    }
    onCallStatAddStream() {
        logger.log("delegationHandler: onCallStatAddStream\n");
    }
    onCallStatRemoveStream() {
        logger.log("delegationHandler: onCallStatRemoveStream\n");
    }
    setWebRTCFSMMapper(stack) {
        logger.log("delegationHandler: setWebRTCFSMMapper : Initialisation complete \n");
    }
    onCallStatSipJsTransportEvent(ev) {
        logger.log("delegationHandler: onCallStatSipJsTransportEvent\n", ev);
        
        // Track WebSocket events
        if (this.exClient.eventShipper && this.exClient.eventShipper.isInitialized) {
            if (ev === 'connected' || ev === 'Connected') {
                this.exClient.eventShipper.eventCollector.trackWebSocket('connected');
            } else if (ev === 'disconnected' || ev === 'Disconnected' || ev === 'error') {
                this.exClient.eventShipper.eventCollector.trackWebSocket('failure', {
                    reason: ev
                });
            }
        }
    }
    onCallStatSipSendCallback() {
        logger.log("delegationHandler: onCallStatSipSendCallback\n");
    }
    onCallStatSipRecvCallback() {
        logger.log("delegationHandler: onCallStatSipRecvCallback\n");
    }
    stopCallStat() {
        logger.log("delegationHandler: stopCallStat\n");
    }
    onRecieveInvite(incomingSession) {
        logger.log("delegationHandler: onRecieveInvite\n");
        const obj = incomingSession.incomingInviteRequest.message.headers;
        this.exClient.callFromNumber = incomingSession.incomingInviteRequest.message.from.displayName;
        
        let callSid = '';
        let callId = '';
        let legSid = '';
        
        if (obj.hasOwnProperty("X-Exotel-Callsid")) {
            callSid = obj['X-Exotel-Callsid'][0].raw;
            CallDetails.callSid = callSid;
        }
        if (obj.hasOwnProperty("Call-ID")) {
            callId = obj['Call-ID'][0].raw;
            CallDetails.callId = callId;
        }
        if (obj.hasOwnProperty("LegSid")) {
            legSid = obj['LegSid'][0].raw;
            CallDetails.legSid = legSid;
        }
        
        // Store call info in EventShipper immediately when we receive the invite
        // This ensures call_id/call_sid are available even before i_new_call fires
        if (this.exClient.eventShipper && this.exClient.eventShipper.isInitialized) {
            this.exClient.eventShipper.setCurrentCallInfo({
                call_id: callId,
                call_sid: callSid,
                leg_sid: legSid
            });
            console.log('ExWebClient: onRecieveInvite - Stored call info in EventShipper:', {
                call_id: callId,
                call_sid: callSid,
                leg_sid: legSid
            });
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
        logger.log("delegationHandler: onPickCall\n");
    }
    onRejectCall() {
        logger.log("delegationHandler: onRejectCall\n");
    }
    onCreaterAnswer() {
        logger.log("delegationHandler: onCreaterAnswer\n");
    }
    onSettingLocalDesc() {
        logger.log("delegationHandler: onSettingLocalDesc\n");
    }
    initGetStats(pc, callid, username) {
        logger.log("delegationHandler: initGetStats\n");
        if (this.exClient && pc) {
            // Clear any existing interval before starting a new one
            if (this.exClient.dumpStatInterval) {
                clearInterval(this.exClient.dumpStatInterval);
                this.exClient.dumpStatInterval = null;
            }
            // Store peer connection reference
            this.exClient.currentPeerConnection = pc;
            // Note: session is not directly available here, but EventShipper has stored call info from call start
            this.exClient.dumpStatInterval = setInterval(() => {
                // Use stored peer connection and check if it's still valid
                if (this.exClient.currentPeerConnection && this.exClient.currentPeerConnection.connectionState !== 'closed') {
                    // Pass current session if available, otherwise EventShipper will use stored call info
                    dumpStats(this.exClient.currentPeerConnection, this.exClient.qosCallback, this.exClient.eventShipper, this.exClient.currentSession);
                }
            }, 2000);
        }
    }
    onRegisterWebRTCSIPEngine(engine) {
        logger.log("delegationHandler: onRegisterWebRTCSIPEngine, engine=\n", engine);
    }
}

class ExSynchronousHandler {
    onFailure() {
        logger.log("synchronousHandler: onFailure, phone is offline.\n");
    }
    onResponse() {
        logger.log("synchronousHandler: onResponse, phone is connected.\n");
    }
}


class ExotelWebClient {
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
    clientSDKLoggerCallback = null;
    callbacks  = null;
    registerCallback = null;
    sessionCallback = null;
    logger = getLogger();
    static clientSDKLoggerCallback = null;
    dumpStatInterval = null;
    qosCallback = null;
    currentPeerConnection = null;
    currentSession = null;  // Store current SIP session for call info extraction
    eventShipper = null;
    registrationStartTime = null;
    callStartTime = null;
    performanceMetricsInterval = null;
        
        
    constructor() {
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
        this.callbacks = new Callback();
        this.registerCallback = new RegisterCallback();
        this.sessionCallback = new SessionCallback();
        
        
        
    }
    

    initWebrtc = async (sipAccountInfo_,
        RegisterEventCallBack, CallListenerCallback, SessionCallback, enableAutoAudioDeviceChangeHandling=false) => {
        const userName = sipAccountInfo_?.userName;
        if (!userName) return false;

        // --- Duplicate registration guard ---
        if (phonePool.has(userName)) {
            if (this.currentSIPUserName == "" || this.currentSIPUserName !== userName) {
                logger.warn(`ExWebClient: initWebrtc: [Dup‑Reg] ${userName} already in use – init rejected`);
                return false;
            }
        }
        this.currentSIPUserName = userName;
        phonePool.set(userName, null); 

        // Initialize EventShipper for metrics collection
        if (!this.eventShipper) {
            this.eventShipper = new EventShipper();
            await this.eventShipper.init(sipAccountInfo_);
        } 

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
        logger.log("ExWebClient: initWebrtc: Exotel Client Initialised with " + JSON.stringify(sipAccountInfo_))
        this.sipAccountInfo = sipAccountInfo_;
        if (!this.sipAccountInfo["userName"] || !this.sipAccountInfo["sipdomain"] || !this.sipAccountInfo["port"]) {
            return false;
        }
        this.sipAccountInfo["sipUri"] = "wss://" + this.sipAccountInfo["userName"] + "@" + this.sipAccountInfo["sipdomain"] + ":" + this.sipAccountInfo["port"];
        
        // Register callbacks using the correct methods
        this.callbacks.registerCallback('call', CallListenerCallback);
        this.registerCallback.initializeRegisterCallback(RegisterEventCallBack);
        logger.log("ExWebClient: initWebrtc: Initializing session callback")
        this.sessionCallback.initializeSessionCallback(SessionCallback);
        this.setEventListener(this.eventListener);

        // Wait for public IP before registering
        await fetchPublicIP(this.sipAccountInfo);

        // Create phone instance if it wasn't created in constructor
        if (!this.phone) {
            this.userName = this.sipAccountInfo.userName;
            let phone = phonePool.get(this.userName);
            if (!phone) {
                phone = new WebrtcSIPPhone(this.userName);
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

        // Start performance metrics collection
        this.startPerformanceMetricsCollection();

        return true;
    };

    DoRegister = () => {
        logger.log("ExWebClient: DoRegister: Entry")
        if (!this.isReadyToRegister) {
            logger.warn("ExWebClient: DoRegister: SDK is not ready to register");
            return false;
        }
        // Track registration start time
        this.registrationStartTime = performance.now();
        DoRegisterRL(this.sipAccountInfo, this);
        return true;
    };

    UnRegister = () => {
        logger.log("ExWebClient: UnRegister: Entry")
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
        logger.log("ExWebClient: registerEventCallback: Received ---> " +
            event, [phone, param]);

        const lowerCaseEvent = event.toLowerCase();

        if (lowerCaseEvent === "registered") {
            this.registrationInProgress = false;
            this.unregisterInitiated = false;
            this.isReadyToRegister = false;
            this.eventListener.onRegistrationStateChanged("registered", phone);
            
            // Track registration success
            if (this.eventShipper && this.eventShipper.isInitialized) {
                const duration = this.registrationStartTime ? 
                    Math.round(performance.now() - this.registrationStartTime) : undefined;
                this.eventShipper.eventCollector.trackRegistration('success', { duration });
                this.registrationStartTime = null;
            }
        } else if (lowerCaseEvent === "unregistered" || lowerCaseEvent === "terminated") {
            this.registrationInProgress = false;
            this.unregisterInitiated = false;
            this.isReadyToRegister = true;
            this.eventListener.onRegistrationStateChanged("unregistered", phone);
            
            // Track registration failure
            if (this.eventShipper && this.eventShipper.isInitialized) {
                const duration = this.registrationStartTime ? 
                    Math.round(performance.now() - this.registrationStartTime) : undefined;
                this.eventShipper.eventCollector.trackRegistration('failure', { 
                    reason: param || 'Unknown',
                    duration 
                });
                this.registrationStartTime = null;
            }
        }
    };
    /**
     * Event listener for calls, any change in sipjsphone will trigger the callback here
     * @param {*} event 
     * @param {*} phone 
     * @param {*} param 
     */
    callEventCallback = (event, phone, param) => {
        logger.log("ExWebClient: callEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
        if (event === "i_new_call") {
            if (!this.call) {
                this.call = new Call(param); // param is the session
            }
            this.currentSession = param; // Store session for call info extraction
            this.callStartTime = performance.now();
            this.callListener.onIncomingCall(param, phone);
            
            // Extract call_id and call_sid from session and CallDetails
            if (this.eventShipper && this.eventShipper.isInitialized && param) {
                // Try to extract from session first
                const callInfo = this.eventShipper.extractCallInfoFromSession(param);
                
                // Use CallDetails if available (populated by onRecieveInvite), otherwise use extracted info
                // Also check stored call info from EventShipper (populated by onRecieveInvite)
                const storedCallInfo = this.eventShipper.getCurrentCallInfo();
                const callId = CallDetails.callId || callInfo.call_id || storedCallInfo.call_id || null;
                const callSid = CallDetails.callSid || callInfo.call_sid || storedCallInfo.call_sid || null;
                const legSid = CallDetails.legSid || callInfo.leg_sid || storedCallInfo.leg_sid || null;
                
                // Log for debugging
                if (!callId || !callSid) {
                    console.log('ExWebClient: call_start - CallDetails:', {
                        callId: CallDetails.callId,
                        callSid: CallDetails.callSid,
                        legSid: CallDetails.legSid
                    });
                    console.log('ExWebClient: call_start - Extracted from session:', callInfo);
                    console.log('ExWebClient: call_start - Stored in EventShipper:', storedCallInfo);
                    console.log('ExWebClient: call_start - Session structure:', {
                        hasIncomingInviteRequest: !!param.incomingInviteRequest,
                        hasRequest: !!param.request,
                        hasInviteRequest: !!param.inviteRequest,
                        sessionKeys: Object.keys(param || {})
                    });
                }
                
                // Store in EventShipper for use in RTP stats and WebRTC connection state (only if we have values)
                if (callId || callSid || legSid) {
                    this.eventShipper.setCurrentCallInfo({ call_id: callId, call_sid: callSid, leg_sid: legSid });
                }
                
                // Track call start (only pass non-empty values)
                const callStartData = {};
                if (callId) callStartData.call_id = callId;
                if (callSid) callStartData.call_sid = callSid;
                if (legSid) callStartData.leg_sid = legSid;
                
                this.eventShipper.eventCollector.trackCall('start', callStartData, param); // Pass session for additional extraction
            }
        } else if (event === "ringing" || event === "accept_reject") {
            this.callListener.onRinging(param, phone);
        } else if (event === "connected") {
            this.callListener.onCallEstablished(param, phone);
            
            // Track call connected
            if (this.eventShipper && this.eventShipper.isInitialized && this.callStartTime) {
                // Re-extract call info from session (headers might be available now for outgoing calls)
                if (this.currentSession) {
                    const callInfo = this.eventShipper.extractCallInfoFromSession(this.currentSession);
                    // Update stored call info if we found new values
                    if (callInfo.call_id || callInfo.call_sid) {
                        const currentCallInfo = this.eventShipper.getCurrentCallInfo();
                        this.eventShipper.setCurrentCallInfo({
                            call_id: callInfo.call_id || currentCallInfo.call_id || CallDetails.callId || '',
                            call_sid: callInfo.call_sid || currentCallInfo.call_sid || CallDetails.callSid || '',
                            leg_sid: callInfo.leg_sid || currentCallInfo.leg_sid || CallDetails.legSid || ''
                        });
                    }
                }
                
                const callSetupTime = Math.round(performance.now() - this.callStartTime);
                const callAnswerDelay = callSetupTime; // Simplified, can be calculated more accurately
                const currentCallInfo = this.eventShipper.getCurrentCallInfo();
                
                // Build call connected data (only include non-empty call info)
                const callConnectedData = {
                    call_setup_time: callSetupTime,
                    call_answer_delay: callAnswerDelay
                };
                const finalCallId = currentCallInfo.call_id || CallDetails.callId;
                const finalCallSid = currentCallInfo.call_sid || CallDetails.callSid;
                const finalLegSid = currentCallInfo.leg_sid || CallDetails.legSid;
                
                if (finalCallId) callConnectedData.call_id = finalCallId;
                if (finalCallSid) callConnectedData.call_sid = finalCallSid;
                if (finalLegSid) callConnectedData.leg_sid = finalLegSid;
                
                this.eventShipper.eventCollector.trackCall('connected', callConnectedData, this.currentSession); // Pass session for call info extraction
            }
        } else if (event === "terminated") {
            this.callListener.onCallEnded(param, phone);
            
            // Track call ended
            if (this.eventShipper && this.eventShipper.isInitialized) {
                const currentCallInfo = this.eventShipper.getCurrentCallInfo();
                const callEndedData = {
                    call_failure_reason: CallDetails.callEndReason || param || 'Unknown'
                };
                
                // Include call info if available
                const finalCallId = currentCallInfo.call_id || CallDetails.callId;
                const finalCallSid = currentCallInfo.call_sid || CallDetails.callSid;
                const finalLegSid = currentCallInfo.leg_sid || CallDetails.legSid;
                
                if (finalCallId) callEndedData.call_id = finalCallId;
                if (finalCallSid) callEndedData.call_sid = finalCallSid;
                if (finalLegSid) callEndedData.leg_sid = finalLegSid;
                
                this.eventShipper.eventCollector.trackCall('ended', callEndedData, this.currentSession); // Pass session for call info extraction
            }
            
            // Clear any existing interval
            if(this.dumpStatInterval) {
                clearInterval(this.dumpStatInterval);
                this.dumpStatInterval = null;
            }
            this.currentPeerConnection = null;
            this.currentSession = null; // Clear session reference
            this.callStartTime = null;
            // Clear metrics from UI by sending empty state
            if(this.qosCallback && typeof this.qosCallback === 'function') {
                this.qosCallback({
                    timestamp: Date.now(),
                    reports: [],
                    callEnded: true
                });
            }
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
        logger.log("ExWebClient: unregister: Entry");
        this.shouldAutoRetry = false;
        this.unregisterInitiated = true;
        
        // Stop performance metrics collection
        this.stopPerformanceMetricsCollection();
        
        // Stop event dispatcher
        if (this.eventShipper) {
            this.eventShipper.stopDispatcher();
        }
        
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
        logger.log("ExWebClient: webRTCStatusCallbackHandler: " + msg1 + " " + arg1)
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

        logger.log('ExWebClient: initialize: Sending register for the number..', subscriberName);

        fetchPublicIP(sipAccountInfo);

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
                logger.log("ExWebClient: checkClientStatus: something went wrong during checkClientStatus ", error);
                callback("media_permission_denied");
            });
    };

    changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
        logger.log(`ExWebClient: changeAudioInputDevice: Entry`);
        this.webrtcSIPPhone.changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange);
    }

    changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
        logger.log(`ExWebClient: changeAudioOutputDevice: Entry`);
        this.webrtcSIPPhone.changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange);
    }

	downloadLogs() {
        logger.log(`ExWebClient: downloadLogs: Entry`);
        LogManager.downloadLogs();
    }

    setPreferredCodec(codecName) {
        logger.log("ExWebClient: setPreferredCodec: Entry");
        if (!this.webrtcSIPPhone || !this.webrtcSIPPhone.phone) {
            logger.warn("ExWebClient: setPreferredCodec: Phone not initialized");
            return;
        }
        this.webrtcSIPPhone.setPreferredCodec(codecName);
    }

    static registerLoggerCallback(callback) {
        logger.log("ExWebClient: registerLoggerCallback: Entry");
        ExotelWebClient.clientSDKLoggerCallback = callback;
    }

    registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
        logger.log("ExWebClient: registerAudioDeviceChangeCallback: Entry");
        if (!this.webrtcSIPPhone) {
            logger.warn("ExWebClient: registerAudioDeviceChangeCallback: webrtcSIPPhone not initialized");
            return;
        }
        this.webrtcSIPPhone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
    }

    static setEnableConsoleLogging(enable) {
        if (enable) {
            logger.log("ExWebClient: setEnableConsoleLogging: Entry, enable: " + enable);
        }
        logger.setEnableConsoleLogging(enable);
    }

    static setAudioOutputVolume(audioElementName, value) {
        logger.log(`ExWebClient: setAudioOutputVolume: Entry, audioElementName: ${audioElementName}, value: ${value}`);
        WebrtcSIPPhone.setAudioOutputVolume(audioElementName, value);
    }

    static getAudioOutputVolume(audioElementName) {
        logger.log(`ExWebClient: getAudioOutputVolume: Entry, audioElementName: ${audioElementName}`);
        return WebrtcSIPPhone.getAudioOutputVolume(audioElementName);
    }

    setCallAudioOutputVolume(value) {
        logger.log(`ExWebClient: setCallAudioOutputVolume: Entry, value: ${value}`);
        this.webrtcSIPPhone.setCallAudioOutputVolume(value);
    }

    getCallAudioOutputVolume() {
        logger.log(`ExWebClient: getCallAudioOutputVolume: Entry`);
        return this.webrtcSIPPhone.getCallAudioOutputVolume();
    }

    setNoiseSuppression(enabled = false) {
        logger.log(`ExWebClient: setNoiseSuppression: ${enabled}`);
        this.webrtcSIPPhone.setNoiseSuppression(enabled);
    }

    registerQoSCallback(callback) {
        logger.log(`ExWebClient: registerQoSCallback: Entry`);
        this.qosCallback = callback;
    }

    /**
     * Start performance metrics collection
     */
    startPerformanceMetricsCollection() {
        if (this.performanceMetricsInterval) {
            return; // Already started
        }

        this.performanceMetricsInterval = setInterval(() => {
            if (this.eventShipper && this.eventShipper.isInitialized) {
                // Collect memory usage
                let memoryUsage = null;
                if (performance.memory && performance.memory.usedJSHeapSize) {
                    memoryUsage = performance.memory.usedJSHeapSize;
                }

                // Estimate CPU usage (simplified - using performance timing)
                let cpuUsage = null;
                // Note: Actual CPU usage per tab is difficult to measure in browser
                // This is a placeholder for future implementation

                if (memoryUsage !== null || cpuUsage !== null) {
                    this.eventShipper.eventCollector.trackPerformance({
                        memory_usage: memoryUsage,
                        cpu_usage: cpuUsage
                    });
                }
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stop performance metrics collection
     */
    stopPerformanceMetricsCollection() {
        if (this.performanceMetricsInterval) {
            clearInterval(this.performanceMetricsInterval);
            this.performanceMetricsInterval = null;
        }
    }

}


logger.registerLoggerCallback((type, message, args) => {
    LogManager.onLog(type, message, args);
    if (ExotelWebClient.clientSDKLoggerCallback) {
        ExotelWebClient.clientSDKLoggerCallback("log", message, args);
    }
});


export { ExDelegationHandler, ExSynchronousHandler, ExotelWebClient };

export default ExotelWebClient;
