# VST-1782 — Configurable Ringing Duration (FR / NFR)

**Jira:** [VST-1782](https://exotel.atlassian.net/browse/VST-1782)  
**Release:** webrtc-core-sdk & webrtc-client-sdk **3.0.13**  
**Branch:** `VST-1782-configurable-ringing-duration`  
**Integrator guide:** [RING-DURATION.md](./RING-DURATION.md)

---

## Problem statement

Nodeflow and contact-center platforms configure agent ring timeout (typically **30 seconds**). The WebSDK hard-capped local ring playback at ~**15 seconds** (`ringtoneCount: 30` × 500ms interval), causing agents to miss calls when the platform still considered the call ringing.

---

## Solution summary

| Layer | Change |
|-------|--------|
| Core | `setRingingDuration`, `getRingingDuration`, `stopRingTone`; timer-based auto-stop (default 30s) |
| Client | Public APIs on `ExotelWebClient` |
| App | Reads platform config and calls `setRingingDuration(seconds)` after init |

---

## Functional requirements

| ID | Requirement | Implementation |
|----|-------------|----------------|
| FR-1 | Default ring playback **30 seconds** | `DEFAULT_RINGING_DURATION_SEC = 30` |
| FR-2 | App sets duration from platform config | `ExWebClient.setRingingDuration(seconds)` |
| FR-3 | App can stop ring early | `ExWebClient.stopRingTone()` |
| FR-4 | Duration persists across engine re-init | `existingRingingDuration` restore in `webrtcSIPPhone` |
| FR-5 | Invalid duration rejected | Returns `false` for non-positive / NaN |

---

## Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | No change to call audio path (remote stream) |
| NFR-2 | Backward compatible: apps omitting API get 30s default (was ~15s) |
| NFR-3 | SDK does not read Nodeflow/server routing — app responsibility |

---

## Out of scope

- UI tone autoplay / iframe reliability → [VST-1783](https://exotel.atlassian.net/browse/VST-1783)
- Media recovery → [VST-1775](https://exotel.atlassian.net/browse/VST-1775)

---

## Manual test (demo-non-npm) — **Pass (May 30 2026)**

See [VST-1782-QA-EVIDENCE.md](./VST-1782-QA-EVIDENCE.md) and `docs/qa/evidence/VST-1782/`.

| Check | Result |
|-------|--------|
| `setRingingDuration(10/30/40/45)` | Pass |
| 10s auto-stop | Pass (10.00s in logs) |
| `stopRingTone()` early | Pass |
| No ~15s SDK cap regression | Pass |

---

## Files in this branch

| File | Purpose |
|------|---------|
| `webrtc-core-sdk/src/sipjsphone.js` | Ring timer refactor |
| `webrtc-core-sdk/src/webrtcSIPPhone.js` | Delegates |
| `webrtc-client-sdk/src/listeners/ExWebClient.js` | Public APIs |
| `*/Changelog`, `*/package.json` | 3.0.13 |
| `docs/VST-1782-FR-NFR.md` | This document |
| `docs/VST-1782-QA-EVIDENCE.md` | Manual QA matrix |
| `docs/qa/evidence/VST-1782/` | Sanitized test logs |
