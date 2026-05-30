# VST-1783 — UI Tone Playback Reliability (FR / NFR)

**Jira:** [VST-1783](https://exotel.atlassian.net/browse/VST-1783)  
**Release:** webrtc-core-sdk & webrtc-client-sdk **3.0.14**  
**Branch:** `VST-1783-ui-tone-playback-reliability`

---

## Problem statement

Agents in CRM / Obelix iframe environments reported **silent local ring, ringback, or DTMF sidetone** while call signaling worked. Web Audio `GainNode` graphs and browser autoplay policy block tones without a prior user gesture.

---

## Solution summary

| Layer | Change |
|-------|--------|
| Core | Bundle WAV via webpack; direct `<audio>` playback; `registerUiTone`, `playUiTone`, `primeUiTones` |
| Client | `ExWebClient.primeUiTones()`, `playTestTone()` |
| Integrator | Call `primeUiTones()` once after user click (Go Online) |

---

## Functional requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| FR-1 | Ring, ringback, DTMF, beep use bundled WAV + direct `<audio>` | Webpack + `sipjsphone` tone paths |
| FR-2 | `primeUiTones()` after user gesture satisfies autoplay | Silent play/pause priming |
| FR-3 | `playTestTone(name)` for QA | `ExWebClient.playTestTone` |
| FR-4 | Speaker routing via `setSinkId` when configured | `applyUiToneOutputRouting` |

---

## Out of scope

- Call media recovery → [VST-1775](https://exotel.atlassian.net/browse/VST-1775)
- Ring duration config → [VST-1782](https://exotel.atlassian.net/browse/VST-1782)

---

## Integration

```javascript
// After user clicks Go Online:
await exWebClient.primeUiTones();
```

---

## Files in this branch

| File | Purpose |
|------|---------|
| `webrtc-core-sdk/src/audioDeviceManager.js` | UI tone registration and playback |
| `webrtc-core-sdk/src/sipjsphone.js` | Tone path refactor |
| `webrtc-core-sdk/webpack.config.js` | WAV bundling |
| `webrtc-client-sdk/webpack.config.js` | WAV bundling |
| `webrtc-client-sdk/src/listeners/ExWebClient.js` | Public APIs |
