import webrtcSIPPhone from "./webrtcSIPPhone";
export const audioDeviceManager = {
    resetInputDevice: false,
    resetOutputDevice: false,
    currentInputDeviceCallback: null,
    currentOutputDeviceCallback: null,

    // Method to set callbacks for input and output device changes
    setDeviceChangeCallbacks(currentInputDeviceCallback, currentOutputDeviceCallback) {
        this.currentInputDeviceCallback = currentInputDeviceCallback;
        this.currentOutputDeviceCallback = currentOutputDeviceCallback;
    },

    // Method to set the resetInputDevice flag
    setResetInputDeviceFlag(value) {
        this.resetInputDevice = value;
    },

    // Method to set the resetOutputDevice flag
    setResetOutputDeviceFlag(value) {
        this.resetOutputDevice = value;
    },

    // method callback when audio device change at runtime
    onAudioDeviceChange(event) {
        webrtcSIPPhone.onAudioDeviceChange(event);
    }
};

navigator.mediaDevices.addEventListener('devicechange', audioDeviceManager.onAudioDeviceChange);

export default audioDeviceManager;