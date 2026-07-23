import coreSDKLogger from "./coreSDKLogger";

const logger = coreSDKLogger;
const AudioManagerCtx = typeof window !== "undefined"
    ? (window.AudioContext || window.webkitAudioContext)
    : null;

export const audioDeviceManager = {
    resetInputDevice: false,
    resetOutputDevice: false,
    currentAudioInputDeviceId: "default",
    currentAudioOutputDeviceId: "default",
    mediaDevices: [],
    enableAutoAudioDeviceChangeHandling: false,
    webAudioCtx: AudioManagerCtx ? new AudioManagerCtx() : null,
    uiToneElements: {},
    uiToneVolumes: {},

    setResetInputDeviceFlag(value) {
        this.resetInputDevice = value;
    },

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

    registerUiTone(elementName, audioElement) {
        logger.log("audioDeviceManager:registerUiTone entry for", elementName);
        this.uiToneElements[elementName] = audioElement;
        this.uiToneVolumes[elementName] = 1;
        audioElement.volume = 1;
        return true;
    },

    setUiToneVolume(elementName, value) {
        const volume = Math.max(0, Math.min(1, value));
        this.uiToneVolumes[elementName] = volume;
        const element = this.uiToneElements[elementName];
        if (element) {
            element.volume = volume;
        }
        return volume;
    },

    getUiToneVolume(elementName) {
        if (this.uiToneVolumes.hasOwnProperty(elementName)) {
            return this.uiToneVolumes[elementName];
        }
        return 1;
    },

    async ensureAudioContextRunning() {
        if (!this.webAudioCtx) {
            return false;
        }
        if (this.webAudioCtx.state === "suspended") {
            try {
                await this.webAudioCtx.resume();
                logger.log("audioDeviceManager:ensureAudioContextRunning: resumed, state=", this.webAudioCtx.state);
            } catch (e) {
                logger.log("audioDeviceManager:ensureAudioContextRunning: resume failed", e);
            }
        }
        return this.webAudioCtx.state === "running";
    },

    async applyUiToneOutputRouting(audioElement) {
        if (!audioElement || typeof audioElement.setSinkId === "undefined") {
            return;
        }
        if (this.currentAudioOutputDeviceId && this.currentAudioOutputDeviceId !== "default") {
            try {
                await audioElement.setSinkId(this.currentAudioOutputDeviceId);
            } catch (e) {
                logger.log("audioDeviceManager:applyUiToneOutputRouting: setSinkId failed", e);
            }
        }
    },

    async primeUiTones() {
        await this.ensureAudioContextRunning();
        const primed = [];
        for (const [elementName, audioElement] of Object.entries(this.uiToneElements)) {
            if (!audioElement) {
                continue;
            }
            try {
                await this.applyUiToneOutputRouting(audioElement);
                if (audioElement.readyState < 2) {
                    audioElement.load();
                }
                const previousVolume = audioElement.volume;
                audioElement.volume = 0.001;
                await audioElement.play();
                audioElement.pause();
                audioElement.currentTime = 0;
                audioElement.volume = this.getUiToneVolume(elementName) || previousVolume;
                primed.push(elementName);
            } catch (error) {
                logger.log(`audioDeviceManager:primeUiTones: ${elementName} failed`, error?.name, error?.message);
            }
        }
        logger.log("audioDeviceManager:primeUiTones: primed tones", primed.join(", ") || "none");
        return primed;
    },

    async playUiTone(audioElement, elementName, options = {}) {
        const { resetTime = true, loadBeforePlay = true } = options;
        if (!audioElement) {
            logger.log("audioDeviceManager:playUiTone: missing audio element for", elementName);
            return false;
        }

        await this.ensureAudioContextRunning();
        const volume = this.getUiToneVolume(elementName);
        audioElement.volume = volume;
        await this.applyUiToneOutputRouting(audioElement);

        if (resetTime) {
            audioElement.currentTime = 0;
        }
        if (loadBeforePlay && audioElement.readyState < 2) {
            audioElement.load();
        }

        const retryDelaysMs = [0, 250, 500];
        for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
            if (retryDelaysMs[attempt] > 0) {
                await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
            }
            try {
                logger.log(`audioDeviceManager:playUiTone: ${elementName} attempt ${attempt + 1}`);
                await audioElement.play();
                logger.log(`audioDeviceManager:playUiTone: ${elementName} playing`);
                return true;
            } catch (error) {
                logger.log(`audioDeviceManager:playUiTone: ${elementName} attempt ${attempt + 1} failed`, error?.name, error?.message);
                if (error?.name === "NotAllowedError") {
                    logger.log(`audioDeviceManager:playUiTone: ${elementName} blocked by autoplay policy; prior user gesture may be required`);
                }
            }
        }
        return false;
    },

    stopUiTone(elementName) {
        const audioElement = this.uiToneElements[elementName];
        if (!audioElement) {
            return false;
        }
        try {
            audioElement.pause();
            audioElement.currentTime = 0;
            return true;
        } catch (error) {
            logger.log(`audioDeviceManager:stopUiTone: ${elementName} failed`, error?.name, error?.message);
            return false;
        }
    },

    stopAllUiTones() {
        Object.keys(this.uiToneElements).forEach((elementName) => {
            this.stopUiTone(elementName);
        });
    },

    configureAudioGainNode(sourceNode) {
        logger.log("audioDeviceManager:configureAudioGainNode entry");
        let gainNode = this.webAudioCtx.createGain();
        sourceNode.connect(gainNode).connect(this.webAudioCtx.destination);
        return gainNode;
    },

    createAndConfigureAudioGainNode(audioElement) {
        logger.log("audioDeviceManager:createAndConfigureAudioGainNode entry for audioElement", audioElement);
        let sourceNode = this.webAudioCtx.createMediaElementSource(audioElement);
        let gainNode = this.configureAudioGainNode(sourceNode);
        audioElement.addEventListener("play", () => {
            if (this.webAudioCtx.state === "suspended") {
                this.webAudioCtx.resume();
            }
        });
        return gainNode;
    }
};

export default audioDeviceManager;
