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
    }
};



export default audioDeviceManager;