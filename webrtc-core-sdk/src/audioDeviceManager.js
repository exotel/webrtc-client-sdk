export const audioDeviceManager = {
    resetInputDevice: false,
    resetOutputDevice: false,
    currentInputDeviceCallback: null,
    currentOutputDeviceCallback: null,
    onAudioDeviceChangeCallback: null,

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

    // set onAudioDeviceChangeCallback
    setAudioDeviceChangeCallback(callback) {
        this.onAudioDeviceChangeCallback = callback;
    },
    // method callback when audio device change at runtime
    onAudioDeviceChange(event) {
        if (this.onAudioDeviceChangeCallback == null) {
            return;
        }
        this.onAudioDeviceChangeCallback(event);
    }

};

navigator.mediaDevices.addEventListener('devicechange', audioDeviceManager.onAudioDeviceChange);

export default audioDeviceManager;