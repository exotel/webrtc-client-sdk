import coreSDKLogger from "./coreSDKLogger";

const logger = coreSDKLogger;
export const audioDeviceManager = {
    resetInputDevice: false,
    resetOutputDevice: false,
    currentAudioInputDeviceId: "default",
    currentAudioOutputDeviceId: "default",


    // Method to set the resetInputDevice flag
    setResetInputDeviceFlag(value) {
        this.resetInputDevice = value;
    },

    // Method to set the resetOutputDevice flag
    setResetOutputDeviceFlag(value) {
        this.resetOutputDevice = value;
    },

    async changeAudioInputDevice(deviceId, onSuccess, onError) {
        logger.log(`SIPJSPhone:changeAudioInputDevice entry`);
        try {
            if (deviceId == audioDeviceManager.currentAudioInputDeviceId) {
                logger.log(`SIPJSPhone:changeAudioInputDevice current input device is same as ${deviceId}`);
                return;
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputDevice = devices.find(device => device.deviceId === deviceId && device.kind === 'audioinput');
            if (!inputDevice) {
                logger.error("input device id " + deviceId + "not found");
                onError("deviceIdNotFound");
                return;
            }
            logger.log(`SIPJSPhone:changeAudioInputDevice acquiring input device ${deviceId} : ${inputDevice.label}`);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
            onSuccess(stream);
        } catch (error) {
            logger.error('SIPJSPhone:changeAudioInputDevice Error changing input device:', error);
            onError(error);
        }
    },

    async changeAudioOutputDevice(audioRemote, deviceId, onSuccess, onError) {
        logger.log(`audioDeviceManager:changeAudioOutputDevice : entry`);
        if (deviceId == audioDeviceManager.currentAudioOutputDeviceId) {
            logger.log(`SIPJSPhone:changeAudioOutputDevice current output device is same as ${deviceId}`);
            return;
        }
        const audioElement = audioRemote;
        if (typeof audioElement.sinkId !== 'undefined') {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const outputDevice = devices.find(device => device.deviceId === deviceId && device.kind === 'audiooutput');
                if (!outputDevice) {
                    logger.error("audioDeviceManager:changeAudioOutputDevice output device id " + deviceId + "not found");
                    onError("deviceIdNotFound");
                    return;
                }
                logger.log(`SIPJSPhone:changeAudioOutputDevice acquiring output device ${deviceId} : ${outputDevice.label}`);
                await audioElement.setSinkId(deviceId);
                audioDeviceManager.currentAudioOutputDeviceId = deviceId;
                logger.log(`audioDeviceManager:changeAudioOutputDevice Output device changed to: ${deviceId}`);
                if (onSuccess) onSuccess();


            } catch (error) {
                logger.error('audioDeviceManager:changeAudioOutputDevice Error changing output device:', error);
                if (onError) onError(error);
            }
        } else {
            const errorMsg = 'audioDeviceManager:changeAudioOutputDevice Browser does not support output device selection.';
            logger.error(errorMsg);
            if (onError) onError(errorMsg);
        }
    },

    async resetAudioDevice(audioRemote, onInputDeviceChangeCallback, onOutputDeviceChangeCallback) {
        audioDeviceManager._resetAudioDevice(audioRemote, onInputDeviceChangeCallback, onOutputDeviceChangeCallback, audioDeviceManager.resetOutputDevice, audioDeviceManager.resetInputDevice);
    },

    onAudioDeviceChange(audioRemote, onInputDeviceChangeCallback, onOutputDeviceChangeCallback) {
        logger.log("audioDeviceManager:onAudioDeviceChange entry");
        audioDeviceManager._resetAudioDevice(audioRemote, onInputDeviceChangeCallback, onOutputDeviceChangeCallback, true, true);
    },

    async _resetAudioDevice(audioRemote, onInputDeviceChangeCallback, onOutputDeviceChangecallback, resetOutputDevice, resetInputDevice) {
        logger.log("audioDeviceManager:_resetAudioDevice entry");
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            if (resetOutputDevice) {
                const defaultOutputDevice = devices.find(device => device.deviceId === "default" && device.kind === 'audiooutput');
                const outputDevice = devices.find(device => device.groupId == defaultOutputDevice.groupId && device.kind === 'audiooutput' && device.deviceId != 'default');

                audioDeviceManager.changeAudioOutputDevice(audioRemote,
                    outputDevice.deviceId,
                    () => onOutputDeviceChangecallback(outputDevice.deviceId),
                    (error) => logger.log(`audioDeviceManager:_resetAudioDevice Failed to change output device: ${error}`)
                );
            }
            if (resetInputDevice) {
                const defaultInputDevice = devices.find(device => device.deviceId === "default" && device.kind === 'audioinput');
                const inputDevice = devices.find(device => device.groupId == defaultInputDevice.groupId && device.kind === 'audioinput' && device.deviceId != 'default');
                audioDeviceManager.changeAudioInputDevice(
                    inputDevice.deviceId,
                    (stream) => onInputDeviceChangeCallback(stream, inputDevice.deviceId),
                    (error) => logger.log(`audioDeviceManager:_resetAudioDevice Failed to change input device: ${error}`)
                );
            }
        } catch (error) {
            logger.log("audioDeviceManager:_resetAudioDevice something went wrong", error);
        }
    },

};


export default audioDeviceManager;