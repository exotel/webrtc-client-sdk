export default webrtcSIPPhoneEventDelegate;
declare namespace webrtcSIPPhoneEventDelegate {
    function registerDelegate(webrtcDelegate: any): void;
    function setTestingMode(mode: any): void;
    function onCallStatSipJsSessionEvent(ev: any): void;
    function sendWebRTCEventsToFSM(eventType: any, sipMethod: any): void;
    function playBeepTone(): void;
    function onStatPeerConnectionIceGatheringStateChange(iceGatheringState: any): void;
    function onCallStatIceCandidate(ev: any, icestate: any): void;
    function onCallStatNegoNeeded(icestate: any): void;
    function onCallStatSignalingStateChange(cstate: any): void;
    function onStatPeerConnectionIceConnectionStateChange(): void;
    function onStatPeerConnectionConnectionStateChange(): void;
    function onGetUserMediaSuccessCallstatCallback(): void;
    function onGetUserMediaErrorCallstatCallback(): void;
    function onCallStatAddStream(): void;
    function onCallStatRemoveStream(): void;
    function setWebRTCFSMMapper(): void;
    function onCallStatSipJsTransportEvent(): void;
    function onCallStatSipSendCallback(tsipData: any, sipStack: any): void;
    function onCallStatSipRecvCallback(tsipData: any, sipStack: any): void;
    function stopCallStat(): void;
    function onRecieveInvite(): void;
    function onPickCall(): void;
    function onRejectCall(): void;
    function onCreaterAnswer(): void;
    function onSettingLocalDesc(): void;
    function initGetStats(pc: any, callid: any, username: any): void;
    function onRegisterWebRTCSIPEngine(engine: any): void;
}
//# sourceMappingURL=webrtcSIPPhoneEventDelegate.d.ts.map