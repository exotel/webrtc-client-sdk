import coreSDKLogger from "./coreSDKLogger";

const logger = coreSDKLogger;
const AudioManagerCtx = window.AudioContext || window.webkitAudioContext;
export const audioDeviceManager = {
    resetInputDevice: false,
    resetOutputDevice: false,
    currentAudioInputDeviceId: "default",
    currentAudioOutputDeviceId: "default",
    mediaDevices: [],
    enableAutoAudioDeviceChangeHandling: false,
    webAudioCtx : new AudioManagerCtx(),
    // Method to set the resetInputDevice flag
    setResetInputDeviceFlag(value) {
        this.resetInputDevice = value;
    },

    // Method to set the resetOutputDevice flag
    setResetOutputDeviceFlag(value) {
        this.resetOutputDevice = value;
    },

    async changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange) {
        logger.log(`SIPJSPhone:changeAudioInputDevice entry`);
        try {
            if (this.enableAutoAudioDeviceChangeHandling && !forceDeviceChange) {
                if (deviceId == audioDeviceManager.currentAudioInputDeviceId) {
                    logger.log(`SIPJSPhone:changeAudioInputDevice current input device is same as ${deviceId} hence not changing`);
                    if (onError) onError("current input device is same as " + deviceId + " hence not changing");
                    return;
                }
                const inputDevice = audioDeviceManager.mediaDevices.find(device => device.deviceId === deviceId && device.kind === 'audioinput');
                if (!inputDevice) {
                    logger.error("input device id " + deviceId + "not found");
                    if (onError) onError("deviceIdNotFound");
                    return;
                }
                logger.log(`SIPJSPhone:changeAudioInputDevice acquiring input device ${deviceId} : ${inputDevice.label}`);
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
            onSuccess(stream);
        } catch (error) {
            logger.error('SIPJSPhone:changeAudioInputDevice Error changing input device:', error);
            if (onError) onError(error);
        }
    },

    async changeAudioOutputDevice(audioRemote, deviceId, onSuccess, onError, forceDeviceChange) {
        logger.log(`audioDeviceManager:changeAudioOutputDevice : entry`);
        const audioElement = audioRemote;
        if (typeof audioElement.sinkId !== 'undefined') {
            try {
                if (this.enableAutoAudioDeviceChangeHandling && !forceDeviceChange) {
                    if (deviceId == audioDeviceManager.currentAudioOutputDeviceId) {
                        logger.log(`SIPJSPhone:changeAudioOutputDevice current output device is same as ${deviceId}`);
                        if (onError) onError("current output device is same as " + deviceId);
                        return;
                    }
                    if (!audioDeviceManager.mediaDevices || audioDeviceManager.mediaDevices.length == 0) {
                        logger.error("audioDeviceManager:changeAudioOutputDevice mediaDeviceList is empty ");
                        if (onError) onError(deviceId + "not found in mediaDeviceList in audioManager");
                        return;
                    }
                    const outputDevice = audioDeviceManager.mediaDevices.find(device => device.deviceId === deviceId && device.kind === 'audiooutput');
                    if (!outputDevice) {
                        logger.error("audioDeviceManager:changeAudioOutputDevice output device id " + deviceId + "not found");
                        if (onError) onError("deviceIdNotFound");
                        return;
                    }
                    logger.log(`audioDeviceManager:changeAudioOutputDevice acquiring output device ${deviceId} : ${outputDevice.label}`);
                    // audioElement.load();
                }
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

    setEnableAutoAudioDeviceChangeHandling(flag) {
        this.enableAutoAudioDeviceChangeHandling = flag;
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

            if (resetOutputDevice) {
                const defaultOutputDevice = audioDeviceManager.mediaDevices.find(device => device.deviceId === "default" && device.kind === 'audiooutput');
                const outputDevice = audioDeviceManager.mediaDevices.find(device => device.groupId == defaultOutputDevice.groupId && device.kind === 'audiooutput' && device.deviceId != 'default');

                audioDeviceManager.changeAudioOutputDevice(audioRemote,
                    outputDevice.deviceId,
                    () => onOutputDeviceChangecallback(outputDevice.deviceId),
                    (error) => logger.error(`audioDeviceManager:_resetAudioDevice Failed to change output device: ${error}`)
                );
            }
            if (resetInputDevice) {
                const defaultInputDevice = audioDeviceManager.mediaDevices.find(device => device.deviceId === "default" && device.kind === 'audioinput');
                const inputDevice = audioDeviceManager.mediaDevices.find(device => device.groupId == defaultInputDevice.groupId && device.kind === 'audioinput' && device.deviceId != 'default');
                audioDeviceManager.changeAudioInputDevice(
                    inputDevice.deviceId,
                    (stream) => onInputDeviceChangeCallback(stream, inputDevice.deviceId),
                    (error) => logger.log(`audioDeviceManager:_resetAudioDevice Failed to change input device: ${error}`)
                );
            }
        } catch (error) {
            logger.error("audioDeviceManager:_resetAudioDevice reset audio device failed", error);
        }
    },

    async enumerateDevices(callback) {
        logger.log("audioDeviceManager:enumerateDevices entry")
        try {
            audioDeviceManager.mediaDevices = await navigator.mediaDevices.enumerateDevices();
        } catch (e) {
            logger.log("audioDeviceManager:enumerateDevices device enumeration failed", e);
        }
        if (callback) callback();
    },

    configureAudioGainNode(sourceNode) {
        let gainNode = this.webAudioCtx.createGain();
        
        sourceNode.connect(gainNode).connect(this.webAudioCtx.destination);
        return gainNode;
    },
    
    createAndConfigureAudioGainNode(audioElement) {
    
        logger.log("audioDeviceManager:createAndConfigureAudioGainNode entry for audioElement", audioElement);
        // get audio track from audio element
        let sourceNode = this.webAudioCtx.createMediaElementSource(audioElement);
        // Create a GainNode
        let gainNode = this.configureAudioGainNode(sourceNode);

         // resume audio context when audio element is played
         audioElement.addEventListener("play", () => {
            if (this.webAudioCtx.state === "suspended") {
                this.webAudioCtx.resume();
            }
        });
        return gainNode;
        
        
    },

    cleanUpAudioNodes(audioRemoteSourceNode, audioRemoteGainNode) {
        if (audioRemoteSourceNode) {
            audioRemoteSourceNode.disconnect();
        }
        if (audioRemoteGainNode) {
            audioRemoteGainNode.disconnect();
        }
    },

    createAndConfigureAudioGainNodeForSourceNode(sourceNode) {
        return this.configureAudioGainNode(sourceNode);
    },


};

export default audioDeviceManager;