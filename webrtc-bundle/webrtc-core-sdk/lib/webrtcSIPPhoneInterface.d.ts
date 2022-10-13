export namespace webrtcSIPPhoneInterface {
    function isConnected(): boolean;
    function sendDTMFWebRTC(dtmfValue: any): void;
    function webRTCMuteUnmute(isMuted: any): void;
    function pickCall(): void;
    function rejectCall(): void;
    function playBeepTone(): void;
    function getSpeakerTestTone(): HTMLAudioElement | undefined;
    function callHold(): void;
    function holdAction(bHold: any): void;
    function muteAction(bHold: any): void;
    function getWSSURL(): any;
}
export default webrtcSIPPhoneInterface;
//# sourceMappingURL=webrtcSIPPhoneInterface.d.ts.map