import coreSDKLogger from "./coreSDKLogger";
import { SipJsPhone } from "./sipjsphone";                    // class export
import {
  createAudioDeviceManager,
  audioDeviceManager as legacyADM
} from "./audioDeviceManager";
import webrtcSIPPhoneEventDelegate from "./webrtcSIPPhoneEventDelegate";

const logger = coreSDKLogger;

/* ── internal registry: key = "user@domain" → phone instance ── */
const phoneRegistry = new Map();

/* always keep a reference to the *last* phone for back-compat helpers */
let   currentPhone         = null;
let   currentSIPAccount    = null;   // the sipAccountInfo that owns currentPhone
let   webrtcSIPEngine      = null;   // "sipjs" etc.

/* helper to build unique key */
function accountKey(info) {
  const domain = info.domain || info.host || info.hostNameWithPort || "";
  return `${info.userName}@${domain}`;
}

/* helper to send FSM events */
function sendWebRTCEventsToFSM(eventType, sipMethod) {
  logger.log("webrtcSIPPhone: sendWebRTCEventsToFSM :", eventType, sipMethod);
  webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM(eventType, sipMethod);
}

/* ────────────────────────────────────────────────────────────── */
/*                 P U B L I C   A P I   O B J E C T             */
/* ────────────────────────────────────────────────────────────── */
export const webrtcSIPPhone = {
  /* -------- registration / connection ---------------------- */
  registerWebRTCClient(sipAccountInfo, handler = {}) {
    logger.log("webrtcSIPPhone: registerWebRTCClient :", sipAccountInfo);

    const key = accountKey(sipAccountInfo);
    if (phoneRegistry.has(key)) {
      logger.warn(`webrtcSIPPhone: duplicate init blocked for ${key}`);
      handler.onFailure?.("duplicateInit");      // new error reason
      return;
    }

    /* create per-account AudioDeviceManager */
    const adm   = createAudioDeviceManager();
    const phone = new SipJsPhone({
      callbacks         : handler,
      audioDeviceManager: adm
    });

    /* start initialisation */
    phone.init(() => {
      phone.loadCredentials(sipAccountInfo);

      /* report success/failure just like before */
      if (webrtcSIPPhone.getWebRTCStatus(phone) === "offline") {
        handler.onFailure?.();
      } else {
        handler.onResponse?.();
      }
    });

    /* store in registry & set as current */
    phoneRegistry.set(key, phone);
    currentPhone      = phone;
    currentSIPAccount = sipAccountInfo;
  },

  configureWebRTCClientDevice(handler) {
    logger.log("webrtcSIPPhone: configureWebRTCClientDevice :", handler);
    currentPhone?.registerCallBacks(handler);
  },

  /* -------- engine plumbing (kept for legacy) --------------- */
  registerPhone(engine = "sipjs", delegate) {
    logger.log("webrtcSIPPhone: registerPhone :", engine);
    webrtcSIPEngine = engine;
    if (delegate) webrtcSIPPhoneEventDelegate.registerDelegate(delegate);
    webrtcSIPPhoneEventDelegate.onRegisterWebRTCSIPEngine(engine);
  },

  /* -------- connection helpers ------------------------------ */
  isConnected()          { return this.getWebRTCStatus() !== "offline"; },
  toggleSipRegister()    { currentPhone?.sipToggleRegister(); },
  connect()              { currentPhone?.connect(); },
  disconnect()           { currentPhone?.disconnect(); },
  reRegisterWebRTCPhone(){ currentPhone?.reRegister(); },

  /* -------- audio & call control ---------------------------- */
  webRTCMuteUnmute() { currentPhone?.sipToggleMic(); },
  muteAction(b)      { currentPhone?.sipMute(b); },
  getMuteStatus()    { return currentPhone?.getMicMuteStatus(); },
  holdAction(b)      { currentPhone?.sipHold(b); },
  holdCall()         { currentPhone?.holdCall(); },
  pickCall() {
    currentPhone?.pickPhoneCall();
    webrtcSIPPhoneEventDelegate.onPickCall();
  },
  rejectCall() {
    currentPhone?.sipHangUp();
    webrtcSIPPhoneEventDelegate.onRejectCall();
  },
  sendDTMFWebRTC(d) { currentPhone?.sipSendDTMF(d); },
  playBeepTone()    { currentPhone?.playBeep(); },

  /* -------- codec & device APIs ----------------------------- */
  setPreferredCodec(c) {
    logger.log("webrtcSIPPhone: setPreferredCodec :", c);
    currentPhone?.setPreferredCodec(c);
  },
  changeAudioInputDevice(id, ok, err)  {
    currentPhone?.changeAudioInputDevice(id, ok, err);
  },
  changeAudioOutputDevice(id, ok, err) {
    currentPhone?.changeAudioOutputDevice(id, ok, err);
  },
  registerAudioDeviceChangeCallback(inCb, outCb, onCb){
    currentPhone?.registerAudioDeviceChangeCallback(inCb, outCb, onCb);
  },

  /* -------- diagnostics helpers ----------------------------- */
  getSpeakerTestTone()   { return currentPhone?.getSpeakerTestTone(); },
  getWSSUrl()            { return currentPhone?.getWSSUrl(); },
  getTransportState()    { return currentPhone?.getTransportState() ?? "unknown"; },
  getRegistrationState() { return currentPhone?.getRegistrationState() ?? "unknown"; },

  /* -------- status & meta ----------------------------------- */
  getWebRTCStatus(phone = currentPhone) {
    logger.log("webrtcSIPPhone: getWebRTCStatus entry");
    return phone?.getStatus() ?? "offline";
  },
  getSIPAccountInfo()   { return currentSIPAccount; },
  getWebRTCSIPEngine()  { return webrtcSIPEngine; },
  getLogger()           { return coreSDKLogger; },

  /* -------- registry helpers (new) -------------------------- */
  /**
   * Returns the phone instance for a given user@domain key
   * or `null` if not registered.
   */
  getPhoneByAccount(userAtDomain) {
    return phoneRegistry.get(userAtDomain) ?? null;
  },

  /**
   * Lists all active registrations as an array of keys "user@domain".
   */
  listActiveAccounts()   { return Array.from(phoneRegistry.keys()); },

  /**
   * Unregister & remove a specific account (used by UI logout flows)
   */
  unRegisterAccount(userAtDomain) {
    const ph = phoneRegistry.get(userAtDomain);
    if (ph) {
      ph.sipUnRegister();
      phoneRegistry.delete(userAtDomain);
      if (currentPhone === ph) {
        currentPhone      = null;
        currentSIPAccount = null;
      }
    }
  }
};

export default webrtcSIPPhone;