export namespace webrtcSIPPhone {
    function isConnected(): boolean;
    function sendDTMFWebRTC(dtmfValue: any): void;
    function registerWebRTCClient(sipAccountInfo: any, handler: any): void;
    function configureWebRTCClientDevice(handler: any): void;
    function setAuthenticatorServerURL(serverURL: any): void;
    function setAuthenticatorServerURL(serverURL: any): void;
    function toggleSipRegister(): void;
    function webRTCMuteUnmute(isMuted: any): void;
    function getMuteStatus(): any;
    function muteAction(bMute: any): void;
    function holdAction(bHold: any): void;
    function holdCall(): void;
    function pickCall(): void;
    function rejectCall(): void;
    function reRegisterWebRTCPhone(): void;
    function playBeepTone(): void;
    function sipUnRegisterWebRTC(): void;
    function startWSNetworkTest(): void;
    function stopWSNetworkTest(): void;
    function registerPhone(engine: any, delegate: any): void;
    function getWebRTCStatus(): any;
    function disconnect(): void;
    function connect(): void;
    function getSIPAccountInfo(): {};
    function getSIPAccountInfo(): {};
    function getWebRTCSIPEngine(): any;
    function getWebRTCSIPEngine(): any;
    function getSpeakerTestTone(): HTMLAudioElement | undefined;
    function getSpeakerTestTone(): HTMLAudioElement | undefined;
    function getWSSUrl(): any;
    function getWSSUrl(): any;
}
export default webrtcSIPPhone;
//# sourceMappingURL=webrtcSIPPhone.d.ts.map