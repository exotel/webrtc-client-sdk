# VST-1775 PR2 — deferred scope (UI tones and ring duration)

PR1 delivers **media recovery only**. The following changes were removed from PR1 to reduce review surface and will land in a follow-up PR.

## Planned PR2 changes

### UI tone reliability

- Refactor ring, ringback, DTMF, and beep playback to bypass the Web Audio gain graph where needed for iframe/embedded browser autoplay
- `audioDeviceManager`: `registerUiTone`, `playUiTone`, `primeUiTones`, output routing helpers
- `sipjsphone.js`: route tone playback through `audioDeviceManager.playUiTone`
- Public APIs: `primeUiTones()`, `playTestTone(toneName)` on client SDK

### Configurable incoming ring duration

- Replace hardcoded ring interval cap with configurable duration (default 30s)
- Public APIs: `setRingingDuration(seconds)`, `getRingingDuration()`, `stopRingTone()`

### Build / assets (if required by tone changes)

- Webpack `audio/` asset path and `publicPath: 'auto'` in core and client bundles

### Optional diagnostics (PR3 or later)

- Wire `webrtcDiagnostics` into session/peer-connection lifecycle **only when** `window.ENABLE_WEBRTC_DIAGNOSTICS === true`
- Do not ship diagnostics module until it is integrated; avoid dead exports

## Branch reference

The pre-split implementation lived on `VST-1775-media-resilience` before PR1 scope reduction. Use `git log` / `git show` on that branch history to recover PR2 patches if needed.
