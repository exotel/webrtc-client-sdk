# WebSDK media resilience (3.0.12+)

Public integration notes for release **3.0.12**. For full API details see the Exotel Voice WebSDK integration guides linked from the repository README.

## What changed

The SDK automatically attempts to restore call audio after:

- ICE or connection state blips (`disconnected` → `connected`)
- Inbound RTP byte stalls on an established session
- Browser tab returning to the foreground

Local UI tones (ring, ringback, DTMF, beep) use direct `<audio>` playback to improve reliability in embedded browsers.

## Integrator APIs

### Media recovery events

Subscribe via `SessionCallback`. Event names are prefixed with `media_recovery_`:

| Event | Meaning |
|-------|---------|
| `media_recovery_attempted` | Recovery started |
| `media_recovery_succeeded` | Remote audio play and/or sender restore succeeded |
| `media_recovery_failed` | Retry budget exhausted (default: 3 attempts per 30s window) |
| `media_recovery_degraded` | ICE or connection entered a degraded state |

### UI tones

Call once per session after a user gesture (for example “Go online”):

```javascript
await exWebClient.primeUiTones();
```

Optional test helper: `exWebClient.playTestTone('ringtone' | 'ringbacktone' | 'dtmftone' | 'beeptone')`.

### Incoming ring duration

Controls **local ringtone playback length** only. Set from your application configuration (for example your contact-center ring timeout):

```javascript
exWebClient.setRingingDuration(30);  // seconds; default 30
exWebClient.getRingingDuration();
exWebClient.stopRingTone();          // stop ring early
```

The application should pass the same duration your platform uses for agent ringing. The SDK does not read server-side routing configuration automatically.

## Recommended integration checklist

1. Upgrade **webrtc-core-sdk** and **webrtc-client-sdk** to **3.0.12** or later.
2. Call `primeUiTones()` after `initWebrtc()` on a user click.
3. Call `setRingingDuration(seconds)` after init if your product default is not 30 seconds.
4. Handle `media_recovery_*` session events if you want agent-facing “reconnecting audio” UI.
5. Avoid heavy main-thread work in the host app during active calls.

## Diagnostics (optional)

Set `window.ENABLE_WEBRTC_DIAGNOSTICS = true` before initializing the SDK for additional WebRTC stats logging during troubleshooting. When enabled, the SDK automatically attaches WebRTC stats diagnostics at call start and stops them on session teardown.

## Voice quality integration checklist

All voice-quality features are **opt-in**. Defaults preserve backward-compatible behavior (noise suppression off, browser echo/AGC on, no custom DSP, no codec preference).

### Configuration APIs

```javascript
// Unified browser audio processing (before initWebrtc / register)
exWebClient.setAudioProcessing({
  noiseSuppression: false,   // default false
  echoCancellation: true,    // default true
  autoGainControl: true,     // default true
});

// Or individual setters
exWebClient.setNoiseSuppression(true);
exWebClient.setEchoCancellation(true);
exWebClient.setAutoGainControl(true);

// Codec preference (WebRTC leg only; optional Opus tuning)
exWebClient.setPreferredCodec('opus', {
  maxAverageBitrate: 32000,  // optional
  stereo: false,             // optional
  useDtx: false,             // optional
});

// Custom DSP pipeline (off by default)
exWebClient.setCustomAudioProcessing({
  enabled: true,
  mode: 'light',  // 'off' | 'light' | 'rnnoise'
});

// Device handling
exWebClient.initWebrtc(sipAccountInfo, regCb, callCb, sessionCb, true); // auto device change
exWebClient.changeAudioInputDevice(deviceId, onSuccess, onError);
exWebClient.changeAudioOutputDevice(deviceId, onSuccess, onError);
exWebClient.registerAudioDeviceChangeCallback(inputCb, outputCb, deviceChangeCb);
```

### sipAccountInfo fields (optional)

Pass on `initWebrtc` to apply automatically:

| Field | Type | Description |
|-------|------|-------------|
| `audioProcessing` | `{ noiseSuppression, echoCancellation, autoGainControl }` | Browser mic constraints |
| `preferredCodec` | `'opus'` | Prefer Opus with in-band FEC on all sessions |
| `preferredCodecOptions` | `{ maxAverageBitrate, stereo, useDtx }` | Opus SDP fmtp overrides |
| `customAudioProcessing` | `{ enabled, mode }` | Web Audio send pipeline |
| `autoAudioDeviceChange` | `boolean` | 5th param to `initWebrtc` alternative |

### Recommended integration order

1. Call `setAudioProcessing()` / `setPreferredCodec()` / `setCustomAudioProcessing()` **before** `DoRegister()`, or pass fields on `sipAccountInfo`.
2. Call `primeUiTones()` on user gesture before first registration.
3. Enable `autoAudioDeviceChange` if agents use hot-pluggable headsets.
4. Expose mic/speaker pickers via `changeAudioInputDevice` / `changeAudioOutputDevice`.
5. Run pre-call diagnostics (mic/speaker test) before going online.
6. Handle `media_recovery_*` session events for agent-facing reconnect UI.
7. Set `ENABLE_WEBRTC_DIAGNOSTICS` only for support troubleshooting.

### Constraint consistency

Mic constraints (noise suppression, echo cancellation, AGC) are applied consistently across:

- SIP registration and call accept
- Microphone device change
- Media recovery (`getUserMedia` after network blip)

### PSTN note

Voice quality settings affect only the **agent browser WebRTC leg**. PSTN routing, carrier codecs, and call setup are unchanged. Better agent-side capture may improve what PSTN callers hear on outbound calls.

### Agent environment guidance

- Prefer wired USB headsets over Bluetooth when possible.
- Close CPU-heavy browser tabs during active calls.
- Ensure stable network; media recovery handles brief blips automatically.
