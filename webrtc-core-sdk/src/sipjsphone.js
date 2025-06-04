const SIP = require("./sip-0.20.0.js");      // keep CommonJS
import { audioDeviceManager as globalADM }  from "./audioDeviceManager.js";
import coreSDKLogger                        from "./coreSDKLogger.js";
import webrtcSIPPhoneEventDelegate          from "./webrtcSIPPhoneEventDelegate";

/* ── SipJsPhone class ─────────────────────────────────────────── */
export class SipJsPhone extends EventTarget {
  /* prefer injecting a fresh audioDeviceManager, but fall back to singleton */
  constructor({ logger = coreSDKLogger,
                callbacks = {},
                audioDeviceManager = globalADM } = {}) {
    super();
    /* public-facing fields (kept for back-compat) */
    this.audioInputDeviceChangeCallback  = null;
    this.audioOutputDeviceChangeCallback = null;
    this.onDeviceChangeCallback          = null;

    /* private fields */
    this._logger     = logger;
    this._cb         = callbacks;               // { onResponse }
    this._adm        = audioDeviceManager;
    this._accountCfg = null;                    // sipAccountInfo
    this._ua         = null;                    // SIP.UserAgent
    this._registerer = null;
    this._ctx        = null;                    // replaces old ctxSip literal
    this._status     = "offline";               // offline | ready | busy
    this._flags      = { mic:true, hold:false, registered:false };
    this._last       = { transport:"", registerer:"" };

    var beeptone = document.createElement("audio");
    beeptone.src = require("./static/beep.wav");
    var ringtone = document.createElement("audio");
    ringtone.src = require("./static/ringtone.wav");
    var ringbacktone = document.createElement("audio");
    ringbacktone.src = require("./static/ringbacktone.wav");
    var dtmftone = document.createElement("audio");
    dtmftone.src = require("./static/dtmf.wav");
    
    /* audio elements */
    this._audio = {
      remote   : document.createElement("audio"),
      beep     : beeptone,
      ringtone : ringtone,
      ringback : ringbacktone,
      dtmf     : dtmftone
    };

    this._preferredCodec = null;  // instance-local, static getter below

    this._initialiseDeviceChangeListener();     // once per tab
  }

  /* ── INITIALISATION SEQUENCE (public) ───────────────────────── */
  init(done = () => {}) {
    const wait = setInterval(() => {
      if (document.readyState === "complete") {
        clearInterval(wait);
        this._postInit();
        done();
      }
    }, 100);
  }

  loadCredentials(sipAccountInfo) {
    this._accountCfg = { ...sipAccountInfo };   // clone
    if (this._ctx) { this._sipRegister(); }     // already initialised
    else {
      const timer = setInterval(() => {
        if (this._ctx) { clearInterval(timer); this._sipRegister(); }
      }, 200);
    }
  }

  getStatus() { return this._status; }
  registerCallBacks(cbHandler) { this._cb = cbHandler; }

  /* ── MAIN PUBLIC OPERATIONS (kept API) ─────────────────────── */
  sipToggleRegister() {
    if (!this._registerer) return;
    if (this._flags.registered) {
      this._registerer.unregister({});
      this._flags.registered = false;
      this._status           = "offline";
      this._notify("error");
    } else {
      this._registerer.register({});
    }
  }

  sipSendDTMF(digit)      { this._ctx?.sipSendDTMF?.(digit); }
  sipToggleMic()          { this._ctx?.phoneMuteButtonPressed?.(this._ctx.callActiveID); }
  sipMute(b)              { this._ctx?.phoneMute?.(this._ctx.callActiveID, b); }
  holdCall()              { this._ctx?.phoneHoldButtonPressed?.(this._ctx.callActiveID); }
  sipHold(b)              { this._ctx?.phoneHold?.(this._ctx.callActiveID, b); }
  pickPhoneCall()         { this._pickPhoneCall(); }
  sipHangUp()             { this._ctx?.sipHangUp?.(this._ctx.callActiveID); }
  playBeep()              { this._audio.beep.play().catch(()=>{}); }
  connect()               { this._sipRegister(); }
  disconnect()            { this._disconnect(); }
  sipUnRegister()         { this._unregisterAndDisconnect(); }
  reRegister()            { this._registerer?.register({}); }
  getMicMuteStatus()      { return this._flags.mic; }
  setPreferredCodec(name) { this._setPreferredCodec(name); }

  /* audio device APIs */
  changeAudioInputDevice(id, ok, err)  {
    this._changeAudioInputDevice(id, ok, err);
  }
  changeAudioOutputDevice(id, ok, err) {
    this._changeAudioOutputDevice(id, ok, err);
  }

  getSpeakerTestTone()  { return this._audio.ringtone; }
  getWSSUrl()           { return this._computeWebsocketUrl(); }
  getTransportState()   { return this._last.transport; }
  getRegistrationState(){ return this._last.registerer; }

  registerLogger(customLogger) { this._logger = customLogger; }
  registerAudioDeviceChangeCallback(inCb, outCb, onCb) {
    this.audioInputDeviceChangeCallback  = inCb;
    this.audioOutputDeviceChangeCallback = outCb;
    this.onDeviceChangeCallback          = onCb;
  }

  /* ── static per-class codec holder (shared by all instances) ── */
  static preferredCodec = null;

  /* ──────────────────────────────────────────────────────────── *
   *                   P R I V A T E   S T U F F                 *
   *   (everything below this comment is implementation detail)  *
   * ──────────────────────────────────────────────────────────── */

  _postInit() {
    const a = this._audio;
    const l = this._logger;

    /* clone of old ctxSip literal, with arrow funcs binding ➜ _ctx */
    this._ctx = {
      config: {},
      ringtone       : a.ringtone,
      ringbacktone   : a.ringback,
      dtmfTone       : a.dtmf,
      beeptone       : a.beep,
      Sessions       : {},
      callTimers     : {},
      callActiveID   : null,
      callVolume     : 1,
      Stream         : null,
      ringToneIntervalID: 0,
      ringtoneCount  : 30,
      /* method: start/stop ring tones */
      startRingTone : () => {
        let count = 0;
        const play = () => a.ringtone.play().catch(()=>{});
        a.ringtone.load();
        play();
        this._ctx.ringToneIntervalID = setInterval(() => {
          play(); if (++count > this._ctx.ringtoneCount)
            clearInterval(this._ctx.ringToneIntervalID);
        }, 500);
      },
      stopRingTone  : () => {
        try { a.ringtone.pause();
              clearInterval(this._ctx.ringToneIntervalID); }
        catch(e){ l.log("stopRingTone err", e); }
      },
      startRingbackTone: () => a.ringback.play().catch(()=>{}),
      stopRingbackTone : () => { try { a.ringback.pause(); } catch{} },
      /* getUniqueID helper */
      getUniqueID : () => Math.random().toString(36).substr(2,9),
      /* status setters (were DOM-UI, keep noop) */
      setCallSessionStatus: ()=>{},
      setStatus: ()=>{}
    };

    /* delegate for new sessions */
    this._ctx.newSession = (sess) => { this._onNewSession(sess); };

    webrtcSIPPhoneEventDelegate.setWebRTCFSMMapper("sipjs");
    this._logger.log("SipJsPhone:init done");
  }

  /* -- registration ------------------------------------------------------ */
  _sipRegister() {
    if (!this._accountCfg) return;
    const {
      userName,
      authUser,
      domain,
      sipdomain,                 // may be undefined
      secret,
      security = (window.location.protocol==="http:" ? "ws" : "wss")
    } = this._accountCfg;        // ← correct source
  
    const sipRealm = sipdomain || domain;
    const path      = this._accountCfg.endpoint || "ws";
    const websocketURL = `${security}://${domain}/${path}`;   // domain already “host:port”

    this._ctx.config = {
      authorizationPassword: secret,
      authorizationUsername: userName,
      displayName          : userName,
      uri                   : SIP.UserAgent.makeURI(`sip:${authUser}@${sipRealm}`),
      hackWssInTransport   : true,
      allowLegacyNotifications: true,
      contactParams        : { transport:"wss" },
      transportOptions     : { server:websocketURL, traceSip:true,
                               reconnectionAttempts:0 },
      logBuiltinEnabled    : true,
      logConnector         : (...args)=>this._sipLog(...args),
      logLevel             : "log",
      sessionDescriptionHandlerFactoryOptions: {
        constraints:{ audio:true, video:false }
      },
      stunServers          : ["stun:stun.l.google.com:19302"],
      registerOptions      : { expires:60 }
    };

    try {
      this._ua         = new SIP.UserAgent(this._ctx.config);
      this._registerer = new SIP.Registerer(this._ua,
                                            { expires:60, refreshFrequency:80 });
      this._attachUaListeners();
      this._ua.start();
    } catch(e) {
      this._status="offline";
      this._notify("error");
      this._logger.error("SipJsPhone:_sipRegister ERROR", e);
    }
  }

  _attachUaListeners() {
    const ua = this._ua;
    ua.transport.stateChange
       .addListener((state)=>this._onTransportState(state));

    this._registerer.stateChange
        .addListener((s)=>this._onRegistererState(s));
    this._registerer.waitingChange
        .addListener(()=>{ if (this._registerer.state ===
                               SIP.RegistererState.Registered)
                             this._onRegistered(); });

    ua.delegate = {
      onInvite: (incoming) => {
        if (this._ctx.callActiveID == null) {
          incoming.direction = "incoming";
          this._ctx.newSession(incoming);
          webrtcSIPPhoneEventDelegate.onRecieveInvite(incoming);
          webrtcSIPPhoneEventDelegate
              .sendWebRTCEventsToFSM("i_new_call","CALL");
        } else {   // busy – reject
          incoming.reject({statusCode:480, reasonPhrase:"4001"});
        }
      }
    };
  }

  /* -- UA event handlers ------------------------------------------------- */
  _onTransportState(newState){
    this._last.transport = newState;
    switch(newState){
      case SIP.TransportState.Connecting:
        webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent("connecting");
        webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("starting","CONNECTION");
        break;
      case SIP.TransportState.Connected:
        this._onTransportConnected(); break;
      case SIP.TransportState.Disconnected:
        this._onTransportDisconnected(); break;
    }
  }

  _onRegistererState(s){
    this._last.registerer = s;
    if (s === SIP.RegistererState.Unregistered)
      this._onRegistrationFailed();
    else if (s === SIP.RegistererState.Terminated)
      this._onRegistrationTerminated();
  }

  _onTransportConnected(){
    this._status="ready";
    webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent("connected");
    webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("started","CONNECTION");
    this._notify("offline");   // original semantics
    this._registerer.register();
  }

  _onTransportDisconnected(){
    this._status="offline";
    webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent("disconnected");
    webrtcSIPPhoneEventDelegate
        .sendWebRTCEventsToFSM("failed_to_start","CONNECTION");
    this._notify("error");
  }

  _onRegistered(){
    this._flags.registered = true;
    this._status           = "ready";
    webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected","CONNECTION");
    this._notify("ready");
  }

  _onRegistrationFailed(){
    this._flags.registered = false;
    webrtcSIPPhoneEventDelegate
        .sendWebRTCEventsToFSM("terminated","CONNECTION");
    this._notify("error");
  }
  _onRegistrationTerminated(){ this._flags.registered = false; }

  /* -- Session handling -------------------------------------------------- */
  _onNewSession(sess) {
    const ctx = this._ctx;
    const l   = this._logger;

    sess.displayName = sess.remoteIdentity.displayName ||
                       sess.remoteIdentity.uri.user;
    sess.ctxid       = ctx.getUniqueID();
    ctx.callActiveID = sess.ctxid;

    /* stats & peer-connection hooks */
    sess.stateChange.addListener((st)=>{
      if (st === SIP.SessionState.Established)
        this._onInvitationAccepted(sess);
      if (st === SIP.SessionState.Terminated)
        this._onInvitationTerminated();
    });

    sess.delegate       = {};
    sess.delegate.onSessionDescriptionHandler = (sdh)=>{
      try {
        const pc = sdh._peerConnection;
        webrtcSIPPhoneEventDelegate
          .initGetStats(pc, ctx.callActiveID, this._accountCfg.userName);
      } catch(e){ l.log("initGetStats error", e); }
    };

    ctx.Sessions[sess.ctxid] = sess;

    if (sess.direction === "incoming") {
      webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent("incoming");
      ctx.startRingTone();
      setTimeout(()=>this._sipCallFSMTrigger(), 500);
    }
  }

  _onInvitationAccepted(sess){
    this._ctx.Stream = sess.sessionDescriptionHandler.localMediaStream;
    this._assignStream(sess.sessionDescriptionHandler.remoteMediaStream,
                       this._audio.remote);

    webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent("accepted");
    webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected","CALL");

    /* hold previous call if any */
    if (this._ctx.callActiveID &&
        this._ctx.callActiveID !== sess.ctxid)
      this._ctx.phoneHoldButtonPressed(this._ctx.callActiveID);

    this._ctx.stopRingbackTone();
    this._ctx.stopRingTone();
    this._status = "busy";
    this._notify("connected");
  }

  _onInvitationTerminated(){
    SipJsPhone.stopStreamTracks(this._ctx.Stream);
    webrtcSIPPhoneEventDelegate.stopCallStat();
    webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent("terminated");
    this._ctx.stopRingTone();
    this._ctx.stopRingbackTone();
    this._ctx.callActiveID = null;
    webrtcSIPPhoneEventDelegate.playBeepTone();
    webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated","CALL");

    if (this._flags.registered) this._status="ready";
    else this._disconnect(true);
    this._notify("disconnected");
  }

  /* -- helpers ----------------------------------------------------------- */
  _sipCallFSMTrigger(){
    this._logger.log("sipCall → accept_reject");
    webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("accept_reject","CALL");
  }

  _sipLog(level, category, label, content){
    if (content?.startsWith("Sending WebSocket"))
      this._handleWsContent(content,"sent");
    else if (content?.startsWith("Received WebSocket"))
      this._handleWsContent(content,"recv");
    this._logger.log(`sipjslog:${category}`, content);
  }

  _handleWsContent(content, dir){
    const msg = content.split("\n").slice(2).join("\n");
    if (dir === "sent")
      webrtcSIPPhoneEventDelegate.onCallStatSipSendCallback(msg,"sipjs");
    else
      webrtcSIPPhoneEventDelegate.onCallStatSipRecvCallback(msg,"sipjs");
  }

  _assignStream(stream, elem){
    if (this._adm.currentAudioOutputDeviceId !== "default")
      elem.setSinkId(this._adm.currentAudioOutputDeviceId);
    elem.autoplay = true;
    elem.srcObject = stream;
    elem.play().catch(()=>{});
    stream.onaddtrack    = ()=>{ elem.load(); elem.play().catch(()=>{}); };
    stream.onremovetrack = ()=>{ elem.load(); elem.play().catch(()=>{}); };
  }

  _disconnect(full=false){
    try {
      if (this._registerer && full) {
        this._registerer.unregister({});
        this._registerer = null;
      }
      if (this._ua?.transport?.isConnected())
        this._ua.transport.disconnect();
    } catch(e){ this._logger.log("disconnect error",e); }
  }

  _unregisterAndDisconnect(){
    if (this._registerer)
      this._registerer.unregister({}).then(()=>this._disconnect(true));
    else this._disconnect(true);
  }

  _notify(msg){ this._cb?.onResponse?.(msg); }

  /* -- audio-device helpers --------------------------------------------- */
  _changeAudioInputDevice(id, ok, err){
    this._adm.changeAudioInputDevice(id, (stream)=>{
      const changed = this._replaceSenderTrack(stream,id);
      if (changed){
        this._adm.currentAudioInputDeviceId = id;
        ok?.();
      } else err?.("replaceSenderTrack failed");
    }, err);
  }
  _changeAudioOutputDevice(id, ok, err){
    if (!this._ctx.callActiveID)
      this._audio.remote = document.createElement("audio");
    this._adm.changeAudioOutputDevice(this._audio.remote, id, ()=>{
      this._changeAdditionalAudioElementsSink(id);
      ok?.();
    }, err);
  }
  _changeAdditionalAudioElementsSink(id){
    [ this._audio.ringtone, this._audio.beep,
      this._audio.ringback, this._audio.dtmf ].forEach((el)=>{
      try { el.load(); el.setSinkId(id); } catch{}
    });
  }

  /* -- track helpers (static) ------------------------------------------- */
  static stopStreamTracks(stream){
    try { stream?.getTracks().forEach(t=>t.stop()); } catch{}
  }

  _replaceSenderTrack(stream, deviceId){
    if (this._adm.currentAudioInputDeviceId === deviceId){
      SipJsPhone.stopStreamTracks(stream);
      return false;
    }
    if (this._ctx.callActiveID){
      const s  = this._ctx.Sessions[this._ctx.callActiveID];
      const pc = s.sessionDescriptionHandler.peerConnection;
      const [ audioTrack ] = stream.getAudioTracks();
      if (pc?.getSenders){
        try {
          const sender = pc.getSenders().find(
            snd=>snd.track && snd.track.kind === audioTrack.kind);
          sender.track.stop();
          sender.replaceTrack(audioTrack);
        } catch(e){ this._logger.error("replaceSenderTrack",e); }
      }
      this._ctx.Stream = stream;
    } else SipJsPhone.stopStreamTracks(stream);
    return true;
  }

  _setPreferredCodec(codec){
    const codes = {
      opus:{ payloadType:111, rtpMap:"opus/48000/2",
             fmtp:"minptime=10;useinbandfec=1" }
    };
    this._preferredCodec = codes[codec.toLowerCase()] || null;
    SipJsPhone.preferredCodec = this._preferredCodec;  // keep static sync
  }

  /* -- url helper ------------------------------------------------------- */
  _computeWebsocketUrl(){
    if (!this._accountCfg) return "";
    return this._ctx?.config?.transportOptions?.server || "";
  }

  /* -- Pick-call wrapper ------------------------------------------------- */
  _pickPhoneCall(){
    const sess = this._ctx.Sessions[this._ctx.callActiveID];
    if (!sess) return;
    const opts = { sessionDescriptionHandlerModifiers:[this._addPreferredCodec.bind(this)] };
    if (this._adm.currentAudioInputDeviceId !== "default"){
      opts.sessionDescriptionHandlerOptions = {
        constraints:{ audio:{ deviceId:this._adm.currentAudioInputDeviceId },
                      video:false }
      };
    }
    sess.accept(opts).catch(e=>this._onMediaAcceptFailed(e));
  }

  _onMediaAcceptFailed(e){
    if (e.name==="NotAllowedError" || e.name==="NotFoundError"){
      webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("m_permission_refused","CALL");
      webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent("userMediaFailed");
      webrtcSIPPhoneEventDelegate.onGetUserMediaErrorCallstatCallback();
    }
    this._logger.log("media accept failed", e);
  }

  /* -- SDP codec modifier ----------------------------------------------- */
  _addPreferredCodec(desc){
    const pref = this._preferredCodec;
    if (!pref) return Promise.resolve(desc);
    const { payloadType, rtpMap, fmtp } = pref;
    const rtpLine  = `a=rtpmap:${payloadType} ${rtpMap}`;
    const fmtpLine = fmtp ? `a=fmtp:${payloadType} ${fmtp}` : "";

    let lines = desc.sdp.split("\r\n");
    const audioIdx = lines.findIndex(l=>l.startsWith("m=audio"));
    if (audioIdx === -1) return Promise.resolve(desc);

    /* force opus top */
    const opusLineIdx = lines.findIndex(l=>l.includes("opus/48000/2"));
    let audioParts = lines[audioIdx].split(" ");
    const hdr = audioParts.slice(0,3);           // m=audio <port> <proto>
    let codecs = audioParts.slice(3);

    if (opusLineIdx !== -1){
      const opusPT = lines[opusLineIdx].match(/a=rtpmap:(\d+)/)[1];
      codecs = [ opusPT, ...codecs.filter(c=>c!==opusPT) ];
    } else {
      codecs = [ payloadType.toString(), ...codecs ];
      if (!lines.includes(rtpLine))  lines.splice(audioIdx+1,0, rtpLine);
      if (fmtp && !lines.includes(fmtpLine))
        lines.splice(audioIdx+2,0, fmtpLine);
    }
    lines[audioIdx] = `${hdr.join(" ")} ${codecs.join(" ")}`;
    desc.sdp = [...new Set(lines)].join("\r\n");
    return Promise.resolve(desc);
  }

  /* -- device-change listener (once per tab) ---------------------------- */
  _initialiseDeviceChangeListener(){
    if (window.__EXOTEL_DEVICE_CHANGE_LISTENER__) return;
    window.__EXOTEL_DEVICE_CHANGE_LISTENER__ = true;

    navigator.mediaDevices
      .addEventListener("devicechange", (ev)=>{
        /* re-enumerate then notify all instances via their callbacks */
        globalADM.enumerateDevices(()=>{
          /* relay to whichever instance registered callbacks */
          const all = window.__EXOTEL_ALL_PHONES__ || [];
          all.forEach(ph => {
            if (ph.onDeviceChangeCallback) {
              ph.onDeviceChangeCallback(ev); return;
            }
            globalADM.onAudioDeviceChange(ph._audio.remote,
              (stream,id)=>{
                if (ph._replaceSenderTrack(stream,id)){
                  globalADM.currentAudioInputDeviceId=id;
                  ph.audioInputDeviceChangeCallback?.(id);
                }
              },
              (id)=>{
                ph._changeAdditionalAudioElementsSink(id);
                globalADM.currentAudioOutputDeviceId=id;
                ph.audioOutputDeviceChangeCallback?.(id);
              });
          });
        });
      });
    /* keep registry for the callback fan-out */
    if (!window.__EXOTEL_ALL_PHONES__) window.__EXOTEL_ALL_PHONES__ = [];
    window.__EXOTEL_ALL_PHONES__.push(this);
  }
}

/* ------------------------------------------------------------------ *
 * Legacy singleton export (so existing imports keep working)         *
 * ------------------------------------------------------------------ */
export const defaultPhone = new SipJsPhone();
export default defaultPhone;
