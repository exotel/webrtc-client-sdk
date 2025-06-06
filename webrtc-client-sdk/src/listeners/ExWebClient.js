import { Call }                         from "../api/callAPI/Call";
import { DoRegister as DoRegisterRL,
         UnRegister as UnRegisterRL }   from "../api/registerAPI/RegisterListener";

import { CallListener }                 from "./CallListener";
import { ExotelVoiceClientListener }    from "./ExotelVoiceClientListener";
import { SessionListener as SessionListenerSL } from "./SessionListeners";
import { CallController }               from "./CallCtrlerDummy";

import { closeDiagnostics as closeDiagnosticsDL,
         initDiagnostics as initDiagnosticsDL,
         startMicDiagnosticsTest as startMicDiagnosticsTestDL,
         startNetworkDiagnostics as startNetworkDiagnosticsDL,
         startSpeakerDiagnosticsTest as startSpeakerDiagnosticsTestDL,
         stopMicDiagnosticsTest as stopMicDiagnosticsTestDL,
         stopNetworkDiagnostics as stopNetworkDiagnosticsDL,
         stopSpeakerDiagnosticsTest as stopSpeakerDiagnosticsTestDL
       }                                from "../api/omAPI/DiagnosticsListener";

import { callbacks,
         registerCallback,
         sessionCallback }              from "./Callback";
import { webrtcTroubleshooterEventBus } from "./Callback";
import { createCallbackBundle }        from "./Callback"; 

import { webrtcSIPPhone }               from "@exotel-npm-dev/webrtc-core-sdk";
import { CallDetails }                  from "../api/callAPI/CallDetails";
import LogManager                       from "../api/LogManager.js";

/* ── helpers ───────────────────────────────────────────────────── */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const logger = webrtcSIPPhone.getLogger();
const intervalIDMap = new Map();                // username → timer id

/** build unique registry key */
function accountKey(info) {
  const domain = info.domain || info.host || info.sipdomain || "";
  return `${info.userName}@${domain}`;
}

/** small STUN trick to fetch a public IP (kept from legacy code) */
function fetchPublicIP(sipAccountInfo) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });
  pc.createDataChannel("");
  pc.createOffer()
    .then((offer) => pc.setLocalDescription(offer));
  pc.onicecandidate = (ice) => {
    if (!ice || !ice.candidate || !ice.candidate.candidate) {
      pc.close(); return;
    }
    const parts = ice.candidate.candidate.split(" ");
    if (parts[7] !== "host") {
      localStorage.setItem("contactHost", parts[4]);
      sipAccountInfo.contactHost = parts[4];
    }
    pc.close();
  };
  // fall back after 500 ms
  sleep(500).then(() => {
    sipAccountInfo.contactHost ||= localStorage.getItem("contactHost");
  });
}

/* ───────────────── FULL DELEGATE (no-ops removed) ─────────── */
export function ExDelegationHandler(exClient) {
  /* helper that routes every event to the SDK’s finite-state-machine
     – ‘CONNECTION’ events go to registerEventCallback
     – ‘CALL’       events go to callEventCallback                     */
  this.sendWebRTCEventsToFSM = (eventType, scope /* "CONNECTION" | "CALL" */) => {
    if (scope === "CONNECTION") {
      exClient.registerEventCallback(eventType, exClient.userName);
    } else {
      exClient.callEventCallback(eventType,
                                 exClient.callFromNumber,
                                 exClient.call);
    }
  };

  /* ----------  CONNECTION-level life-cycle ------------------ */
  this.onStart           = () => this.sendWebRTCEventsToFSM("starting",         "CONNECTION");
  this.onConnected       = () => this.sendWebRTCEventsToFSM("connected",        "CONNECTION");
  this.onFailedToStart   = () => this.sendWebRTCEventsToFSM("failed_to_start",  "CONNECTION");
  this.onTransportError  = () => this.sendWebRTCEventsToFSM("transport_error",  "CONNECTION");
  this.onDisconnected    = () => this.sendWebRTCEventsToFSM("disconnected",     "CONNECTION");

  this.onIncomingCall = (session /* SIP.Invitation */) => {
    /* expose the session so demo.js can wrap it with Answer / Hangup … */
    exClient.call = session;
    this.onRecieveInvite(session);               // reuse header extraction
    this.sendWebRTCEventsToFSM("i_new_call", "CALL");
  };

  this.onRinging       = (session) => { exClient.call = session;
                                        this.sendWebRTCEventsToFSM("ringing", "CALL"); };
  this.onAccepted      = (session) => { exClient.call = session;
                                        this.sendWebRTCEventsToFSM("connected", "CALL"); };
  this.onTerminated    = ()            => { this.sendWebRTCEventsToFSM("terminated","CALL");
                                            exClient.call = null; };

  /* ----------  Media helpers (optional for the UI) ---------- */
  this.onHold          = () => this.sendWebRTCEventsToFSM("hold",   "CALL");
  this.onUnHold        = () => this.sendWebRTCEventsToFSM("unhold", "CALL");
  this.onMute          = () => this.sendWebRTCEventsToFSM("mute",   "CALL");
  this.onUnMute        = () => this.sendWebRTCEventsToFSM("unmute", "CALL");

  /* ----------  SIP-JS session event logger ------------------ */
  this.onCallStatSipJsSessionEvent = (ev) =>
    webrtcSIPPhone.getLogger().log("delegate ses-ev", ev);
}

export function ExSynchronousHandler() {
  this.onFailure  = () => logger.log("synchronousHandler: onFailure");
  this.onResponse = () => logger.log("synchronousHandler: onResponse");
}

/* ───────────────────────────────────────────────────────────────
 *             E X O T E L   W E B   C L I E N T
 * ─────────────────────────────────────────────────────────────── */
export class ExotelWebClient {
  /* instance fields (each ExotelWebClient handles ONE account) */

  #cb = createCallbackBundle(); 

  ctrlr            = null;
  call             = null;
  eventListener    = null;
  callListener     = null;
  callFromNumber   = null;
  _phoneHandle     = null;

  /* flags */
  shouldAutoRetry        = false;
  unregisterInitiated    = false;
  registrationInProgress = false;
  isReadyToRegister      = true;

  sipAccountInfo         = null;
  clientSDKLoggerCallback = null;

  constructor() {
    logger.registerLoggerCallback((type, msg, args) => {
      LogManager.onLog(type, msg, args);
      this.clientSDKLoggerCallback?.("log", msg, args);
    });
  }

  /* --------------- SDK INITIALISATION ----------------------- */
  initWebrtc = (
    sipAccountInfo_,
    RegisterEventCallBack,
    CallListenerCallback,
    SessionCallback
  ) => {
    if (!this.eventListener) this.eventListener = new ExotelVoiceClientListener();
    if (!this.callListener)  this.callListener  = new CallListener();
    if (!this.ctrlr)         this.ctrlr         = new CallController();
    if (!this.call)          this.call          = new Call();

    logger.log("ExWebClient:initWebrtc account", JSON.stringify(sipAccountInfo_));

    /* minimal validation */
    if (!sipAccountInfo_.userName || !sipAccountInfo_.sipdomain || !sipAccountInfo_.port) {
      logger.warn("ExWebClient:initWebrtc: missing mandatory fields");
      return false;
    }
    this.sipAccountInfo = { ...sipAccountInfo_ };
    this.sipAccountInfo.sipUri =
      `wss://${sipAccountInfo_.userName}@${sipAccountInfo_.sipdomain}:${sipAccountInfo_.port}`;

    this.#cb.callbacks.initializeCallback       (CallListenerCallback);
    this.#cb.registerCallback.initializeRegisterCallback(RegisterEventCallBack);
    this.#cb.sessionCallback.initializeSessionCallback  (SessionCallback);
    this.setEventListener(this.eventListener);
    return true;
  };

  /* --------------- REGISTER / UNREGISTER -------------------- */
  DoRegister = () => {
    if (!this.isReadyToRegister) { logger.warn("SDK not ready"); return false; }
    this.isReadyToRegister   = false;
    this.registrationInProgress = true;

    webrtcSIPPhone.registerPhone("sipjs", new ExDelegationHandler(this));

    /* ask webrtcSIPPhone to create/register phone */
    webrtcSIPPhone.registerWebRTCClient(
      this.sipAccountInfo,
      new ExSynchronousHandler(this)
    );
        /* store a direct handle so helpers hit *our* phone only */
    this._phoneHandle = webrtcSIPPhone.getPhoneByAccount(
      `${this.sipAccountInfo.userName}@${this.sipAccountInfo.domain}`
    );
    return true;
  };

  UnRegister = () => {
    webrtcSIPPhone.unRegisterAccount(accountKey(this.sipAccountInfo));
  };

  /* -------- diagnostics proxies (unchanged) ----------------- */
  initDiagnostics               = initDiagnosticsDL;
  closeDiagnostics              = closeDiagnosticsDL;
  startSpeakerDiagnosticsTest   = startSpeakerDiagnosticsTestDL;
  stopSpeakerDiagnosticsTest    = stopSpeakerDiagnosticsTestDL;
  startMicDiagnosticsTest       = startMicDiagnosticsTestDL;
  stopMicDiagnosticsTest        = stopMicDiagnosticsTestDL;
  startNetworkDiagnostics       = () => {
    startNetworkDiagnosticsDL();
    this.DoRegister();
  };
  stopNetworkDiagnostics        = stopNetworkDiagnosticsDL;
  SessionListener               = SessionListenerSL;

  /* -------- Call control helpers (unchanged) ---------------- */
  getCallController = () => this.ctrlr;
  getCall           = () => this.call ?? (this.call = new Call());

  setEventListener  = (evListener) => { this.eventListener = evListener; };

  /* -------- Event callbacks (registration & calls) ---------- */
  registerEventCallback = (event, phone) => {
    logger.log("registerEventCallback", event, phone);
    if (event === "connected") {
      this.eventListener.onInitializationSuccess(phone);
      this.registrationInProgress = false;
      this.#cb.registerCallback.fire(event, phone);
      if (this.unregisterInitiated) {
        this.unregisterInitiated = false;
        this.UnRegister();
      }
    } else if (event === "failed_to_start" || event === "transport_error") {
      this.eventListener.onInitializationFailure(phone);
      this.#cb.registerCallback.fire(event, phone);
      if (this.unregisterInitiated) {
        this.shouldAutoRetry       = false;
        this.unregisterInitiated   = false;
        this.isReadyToRegister     = true;
      }
      if (this.shouldAutoRetry) {
        logger.log("autoretrying register in 5 s");
        DoRegisterRL(this.sipAccountInfo, this, 5000);
      }
    } else if (event === "sent_request") {
      this.eventListener.onInitializationWaiting(phone);
      this.#cb.registerCallback.fire(event, phone);
    }
  };

  callEventCallback = (event, phone, param) => {
    logger.log("callEventCallback", event, phone);
    this.#cb.callbacks.fire(event, phone, param);
    if (event === "i_new_call")        this.callListener.onIncomingCall(param, phone);
    else if (event === "connected")    this.callListener.onCallEstablished(param, phone);
    else if (event === "terminated")   this.callListener.onCallEnded(param, phone);
  };

  diagnosticEventCallback = (event, phone, param) => {
    webrtcTroubleshooterEventBus.sendDiagnosticEvent(event, phone, param);
    this.#cb.sessionCallback.fire(event, phone, param);
  };

  /* -------- unregister flow -------------------------------- */
  unregister = () => {
    this.shouldAutoRetry    = false;
    this.unregisterInitiated = true;
    if (!this.registrationInProgress) {
      setTimeout(() => this.UnRegister(), 500);
    }
  };

  /* -------- utilities -------------------------------------- */
   changeAudioInputDevice(deviceId, onSuccess, onError) {
       logger.log("ExWebClient: changeAudioInputDevice");
       this._phoneHandle
         ? this._phoneHandle.changeAudioInputDevice(deviceId, onSuccess, onError)
         : webrtcSIPPhone.changeAudioInputDevice(deviceId, onSuccess, onError);
     }  
      changeAudioOutputDevice(deviceId, onSuccess, onError) {
           logger.log("ExWebClient: changeAudioOutputDevice");
           this._phoneHandle
             ? this._phoneHandle.changeAudioOutputDevice(deviceId, onSuccess, onError)
             : webrtcSIPPhone.changeAudioOutputDevice(deviceId, onSuccess, onError);
         }
          setPreferredCodec(codecName) {
               logger.log("ExWebClient: setPreferredCodec", codecName);
               this._phoneHandle
                 ? this._phoneHandle.setPreferredCodec(codecName)
                 : webrtcSIPPhone.setPreferredCodec(codecName);
             }


     webRTCMuteUnmute() {
       logger.log("ExWebClient: webRTCMuteUnmute");
       this._phoneHandle
         ? this._phoneHandle.sipToggleMic()
         : webrtcSIPPhone.webRTCMuteUnmute();
     }
    

     muteAction(bMute) {
       logger.log("ExWebClient: muteAction", bMute);
       this._phoneHandle
         ? this._phoneHandle.sipMute(bMute)
         : webrtcSIPPhone.muteAction(bMute);
     }
    

     holdAction(bHold) {
       logger.log("ExWebClient: holdAction", bHold);
       this._phoneHandle
         ? this._phoneHandle.sipHold(bHold)
         : webrtcSIPPhone.holdAction(bHold);
     }
    

     holdCall() {
       logger.log("ExWebClient: holdCall");
       this._phoneHandle
         ? this._phoneHandle.holdCall()
         : webrtcSIPPhone.holdCall();
     }
    

     getMuteStatus() {
       return this._phoneHandle
         ? this._phoneHandle.getMicMuteStatus()
         : webrtcSIPPhone.getMuteStatus();
     }

    registerAudioDeviceChangeCallback = (...args) =>
    webrtcSIPPhone.registerAudioDeviceChangeCallback(...args);

  checkClientStatus = (callback) => {
    navigator.mediaDevices.getUserMedia({ audio:true, video:false })
      .then(() => {
        const t = webrtcSIPPhone.getTransportState().toLowerCase();
        if (t === ""               )           callback("not_initialized");
        else if (t === "unknown" ||
                 t === "connecting")           callback(t);
        else {
          const r = webrtcSIPPhone.getRegistrationState().toLowerCase();
          if (r === "")                       callback("websocket_connection_failed");
          else if (r === "registered" && t!=="connected")
                                                callback("disconnected");
          else                                 callback(r);
        }
      })
      .catch(() => callback("media_permission_denied"));
  };

  downloadLogs()         { LogManager.downloadLogs(); }
  registerLoggerCallback(cb) { this.clientSDKLoggerCallback = cb; }

  /* -------- High-level bootstrap (legacy) ------------------ */
  initialize = (
    uiContext, hostName, subscriberName,
    displayName, accountSid, subscriberToken,
    sipAccountInfo
  ) => {
    fetchPublicIP(sipAccountInfo);           // may fill contactHost later
    this.userName = sipAccountInfo.userName;

    /* Build full sipAccountInfo the way old code did */
    const info = {
      ...sipAccountInfo,
      security : sipAccountInfo.security || "wss",
      endpoint : sipAccountInfo.endpoint || "wss",
      port     : sipAccountInfo.port,
      contactHost: sipAccountInfo.contactHost || localStorage.getItem("contactHost")
    };
    this.sipAccountInfo = info;

    /* Register through webrtcSIPPhone */
    webrtcSIPPhone.registerPhone("sipjs", new ExDelegationHandler(this));
    webrtcSIPPhone.registerWebRTCClient(info, new ExSynchronousHandler(this));

    /* keep the intervalId map as was */
    intervalIDMap.set(this.userName, /* intervalId placeholder */ null);
  };
}

export default ExotelWebClient;
