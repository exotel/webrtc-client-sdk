import coreSDKLogger from "./coreSDKLogger";

const defaultLogger = coreSDKLogger;

/* ── AudioDeviceManager class ─────────────────────────────────── */
class AudioDeviceManager {
  constructor(logger = defaultLogger) {
    this.logger = logger;

    /* per-instance mutable state */
    this.resetInputDevice  = false;
    this.resetOutputDevice = false;
    this.currentAudioInputDeviceId  = "default";
    this.currentAudioOutputDeviceId = "default";
    this.mediaDevices = [];

    /* prime device list */
    this.enumerateDevices();
  }

  /* flag setters (public) */
  setResetInputDeviceFlag(v)  { this.resetInputDevice  = v; }
  setResetOutputDeviceFlag(v) { this.resetOutputDevice = v; }

  /* ── change INPUT device ───────────────────────────────────── */
  async changeAudioInputDevice(deviceId, onSuccess, onError) {
    const L = this.logger;
    L.log("audioDeviceManager:changeAudioInputDevice entry");
    try {
      if (deviceId === this.currentAudioInputDeviceId) {
        L.log(`audioDeviceManager:changeAudioInputDevice current input device is already ${deviceId}`);
        onError?.(`current input device is same as ${deviceId}`);
        return;
      }
      const input = this.mediaDevices.find(
        d => d.deviceId === deviceId && d.kind === "audioinput");
      if (!input) {
        L.error(`audioDeviceManager:changeAudioInputDevice input device ${deviceId} not found`);
        onError?.("deviceIdNotFound");
        return;
      }
      L.log(`audioDeviceManager:changeAudioInputDevice acquiring ${deviceId} : ${input.label}`);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      onSuccess?.(stream);
    } catch (e) {
      L.error("audioDeviceManager:changeAudioInputDevice error", e);
      onError?.(e);
    }
  }

  /* ── change OUTPUT device ──────────────────────────────────── */
  async changeAudioOutputDevice(audioRemote, deviceId, onSuccess, onError) {
    const L = this.logger;
    L.log("audioDeviceManager:changeAudioOutputDevice entry");
    if (deviceId === this.currentAudioOutputDeviceId) {
      L.log(`audioDeviceManager:changeAudioOutputDevice current output device is already ${deviceId}`);
      onError?.(`current output device is same as ${deviceId}`);
      return;
    }
    const el = audioRemote;
    if (typeof el.sinkId === "undefined") {
      const msg = "audioDeviceManager:changeAudioOutputDevice browser does not support sink selection";
      L.error(msg);
      onError?.(msg);
      return;
    }
    try {
      if (!this.mediaDevices.length) {
        L.error("audioDeviceManager:changeAudioOutputDevice mediaDevice list empty");
        onError?.(`${deviceId} not found in mediaDevice list`);
        return;
      }
      const output = this.mediaDevices.find(
        d => d.deviceId === deviceId && d.kind === "audiooutput");
      if (!output) {
        L.error(`audioDeviceManager:changeAudioOutputDevice output device ${deviceId} not found`);
        onError?.("deviceIdNotFound");
        return;
      }
      L.log(`audioDeviceManager:changeAudioOutputDevice acquiring ${deviceId} : ${output.label}`);
      await el.setSinkId(deviceId);
      this.currentAudioOutputDeviceId = deviceId;
      L.log(`audioDeviceManager:changeAudioOutputDevice switched to ${deviceId}`);
      onSuccess?.();
    } catch (e) {
      L.error("audioDeviceManager:changeAudioOutputDevice error", e);
      onError?.(e);
    }
  }

  /* ── convenience helpers ───────────────────────────────────── */
  async resetAudioDevice(audioRemote,
                         onInputCb,
                         onOutputCb) {
    this._resetAudioDevice(audioRemote, onInputCb, onOutputCb,
                           this.resetOutputDevice, this.resetInputDevice);
  }

  onAudioDeviceChange(audioRemote,
                      onInputCb,
                      onOutputCb) {
    this.logger.log("audioDeviceManager:onAudioDeviceChange entry");
    this._resetAudioDevice(audioRemote, onInputCb, onOutputCb, true, true);
  }

  async _resetAudioDevice(audioRemote,
                          onInputCb,
                          onOutputCb,
                          resetOut, resetIn) {
    const L = this.logger;
    L.log("audioDeviceManager:_resetAudioDevice entry");
    try {
      if (resetOut) {
        const defOut = this.mediaDevices.find(
          d => d.deviceId === "default" && d.kind === "audiooutput");
        const out = this.mediaDevices.find(
          d => d.kind === "audiooutput" &&
               d.groupId === defOut.groupId &&
               d.deviceId !== "default");
        if (out) {
          await this.changeAudioOutputDevice(
            audioRemote,
            out.deviceId,
            () => onOutputCb?.(out.deviceId),
            err => L.error("audioDeviceManager:_resetAudioDevice output fail", err)
          );
        }
      }
      if (resetIn) {
        const defIn = this.mediaDevices.find(
          d => d.deviceId === "default" && d.kind === "audioinput");
        const inp = this.mediaDevices.find(
          d => d.kind === "audioinput" &&
               d.groupId === defIn.groupId &&
               d.deviceId !== "default");
        if (inp) {
          await this.changeAudioInputDevice(
            inp.deviceId,
            stream => onInputCb?.(stream, inp.deviceId),
            err => L.error("audioDeviceManager:_resetAudioDevice input fail", err)
          );
        }
      }
    } catch (e) {
      L.error("audioDeviceManager:_resetAudioDevice error", e);
    }
  }

  /* ── enumerate devices ─────────────────────────────────────── */
  async enumerateDevices(callback) {
    this.logger.log("audioDeviceManager:enumerateDevices entry");
    try {
      this.mediaDevices = await navigator.mediaDevices.enumerateDevices();
    } catch (e) {
      this.logger.log("audioDeviceManager:enumerateDevices failed", e);
    }
    callback?.();
  }
}

/* ── factory + legacy singleton exports ─────────────────────── */
export function createAudioDeviceManager(logger = defaultLogger) {
  return new AudioDeviceManager(logger);
}

export const audioDeviceManager = createAudioDeviceManager();  // legacy
export default audioDeviceManager;