let testingMode = false;
const delegates = new Set();

/* small helper so we don’t repeat the loop everywhere */
const forEach = fn => delegates.forEach(d => fn(d));

const webrtcSIPPhoneEventDelegate = {
  /* ─ Register / unregister ───────────────────────────────────── */
  registerDelegate (d) { if (d) delegates.add(d); },
  unregisterDelegate(d) { delegates.delete(d); },

  /* ─ Testing flag ────────────────────────────────────────────── */
  setTestingMode(mode){
    testingMode = !!mode;
    forEach(d => d.setTestingMode?.(testingMode));
  },

  /* ─ Generic event fan-outs ──────────────────────────────────── */
  onCallStatSipJsSessionEvent(ev){
    forEach(d => d.onCallStatSipJsSessionEvent?.(ev));
  },

  sendWebRTCEventsToFSM(eventType, sipMethod){
    forEach(d => d.sendWebRTCEventsToFSM?.(eventType, sipMethod));
  },

  playBeepTone(){
    forEach(d => d.playBeepTone?.());
  },

  onStatPeerConnectionIceGatheringStateChange(state){
    forEach(d => d.onStatPeerConnectionIceGatheringStateChange?.(state));
  },

  onCallStatIceCandidate(ev, iceState){
    forEach(d => d.onCallStatIceCandidate?.(ev, iceState));
  },

  onCallStatNegoNeeded(state){
    forEach(d => d.onCallStatNegoNeeded?.(state));
  },

  onCallStatSignalingStateChange(state){
    forEach(d => d.onCallStatSignalingStateChange?.(state));
  },

  onStatPeerConnectionIceConnectionStateChange(){
    forEach(d => d.onStatPeerConnectionIceConnectionStateChange?.());
  },

  onStatPeerConnectionConnectionStateChange(){
    forEach(d => d.onStatPeerConnectionConnectionStateChange?.());
  },

  onGetUserMediaSuccessCallstatCallback(){
    forEach(d => d.onGetUserMediaSuccessCallstatCallback?.());
  },

  onGetUserMediaErrorCallstatCallback(){
    forEach(d => d.onGetUserMediaErrorCallstatCallback?.());
  },

  onCallStatAddStream(){
    forEach(d => d.onCallStatAddStream?.());
  },

  onCallStatRemoveStream(){
    forEach(d => d.onCallStatRemoveStream?.());
  },

  setWebRTCFSMMapper(stack){
    forEach(d => d.setWebRTCFSMMapper?.(stack));
  },

  onCallStatSipJsTransportEvent(ev){
    forEach(d => d.onCallStatSipJsTransportEvent?.(ev));
  },

  onCallStatSipSendCallback(tsipData, sipStack){
    forEach(d => d.onCallStatSipSendCallback?.(tsipData, sipStack));
  },

  onCallStatSipRecvCallback(tsipData, sipStack){
    forEach(d => d.onCallStatSipRecvCallback?.(tsipData, sipStack));
  },

  stopCallStat(){
    forEach(d => d.stopCallStat?.());
  },

  onRecieveInvite(incomingSession){
    forEach(d => d.onRecieveInvite?.(incomingSession));
  },

  onPickCall(){
    forEach(d => d.onPickCall?.());
  },

  onRejectCall(){
    forEach(d => d.onRejectCall?.());
  },

  onCreaterAnswer(){
    forEach(d => d.onCreaterAnswer?.());
  },

  onSettingLocalDesc(){
    forEach(d => d.onSettingLocalDesc?.());
  },

  initGetStats(pc, callid, username){
    forEach(d => d.initGetStats?.(pc, callid, username));
  },

  onRegisterWebRTCSIPEngine(engine){
    forEach(d => d.onRegisterWebRTCSIPEngine?.(engine));
  }
};

export default webrtcSIPPhoneEventDelegate;
