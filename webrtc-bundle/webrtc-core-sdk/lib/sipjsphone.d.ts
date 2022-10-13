export function getLogger(): any;
export default SIPJSPhone;
declare namespace SIPJSPhone {
    function init(): void;
    function loadCredentials(sipAccountInfo: any): void;
    function getStatus(): string;
    function registerCallBacks(handler: any): void;
    function sipSendDTMF(c: any): void;
    function sipToggleRegister(): void;
    function reRegister(): void;
    function sipToggleMic(): void;
    function sipMute(bMute: any): void;
    function holdCall(): void;
    function sipHold(bHold: any): void;
    function getMicMuteStatus(): boolean;
    function pickPhoneCall(): void;
    function sipHangUp(): void;
    function playBeep(): void;
    function sipUnRegister(): void;
    function connect(): void;
    function disconnect(): void;
    function getSpeakerTestTone(): HTMLAudioElement;
    function getWSSUrl(): any;
}
//# sourceMappingURL=sipjsphone.d.ts.map