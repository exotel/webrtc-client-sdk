# WebSDK Media Resilience — Analysis, Plan & Ownership

**Jira:** [VST-1775](https://exotel.atlassian.net/browse/VST-1775) — *WebSDK: Media resilience — ICE/audio recovery, background tab, inbound RTP watchdog*  
**Related (Done):** [VST-1712](https://exotel.atlassian.net/browse/VST-1712) — DTMF local sidetone fix (3.0.11)  
**Status:** Planning / engineering backlog  
**Last updated:** 2026-05-29  

---

## 1. Problem statement

Enterprise customers (e.g. Zerodha / Giva) report:

- **Voice blank** mid-call or after connect
- **No local ring / DTMF** in iframe/dashboard
- **Missed calls** / SIP 486 on inbound

On the **same network**, **Google Meet** and **Microsoft Teams** (also WebRTC) work, including:

- Minimized / background browser tab
- Temporary ICE disconnects

**Customer constraint:** They will **not** change network topology. PCAP showing temporary ICE disconnect is **not actionable** for customers when other WebRTC apps work.

**Product bar:** Meet/Teams-like **client-side media resilience** in Platform WebSDK — not “fix your network.”

---

## 2. Two separate problem tracks (do not conflate)

| Track | Symptoms | Likely layer |
|-------|----------|--------------|
| **Missed calls / 486** | No popup, `rejecting call from iframe`, `not authorized domain`, SIP 486 | **CRM / Obelix** — iframe allowlist, app reject — **not** ECC RTP |
| **Voice blank / local audio** | Call connects, no hear/beep; or blank mid-call | **Browser WebRTC + CRM app behavior** — not proven ECC RTP stop |

---

## 3. What VST-1712 fixed vs what remains

| Item | VST-1712 (3.0.11, Done) | VST-1775 (new) |
|------|-------------------------|----------------|
| Local DTMF sidetone (`dtmfTone.play()` before SIP INFO) | Yes | — |
| Mid-call audio after ICE blip | No | **Yes** |
| Background tab remote audio | No | **Yes** |
| Inbound RTP byte watchdog + auto-recovery | No | **Yes** |
| Ring/DTMF in suspended `AudioContext` (iframe) | Partial | **Yes** (P1) |
| ICE restart on sustained failure | No | **Yes** |

---

## 4. Evidence / RCA (internal)

### 4.1 Log & export analysis

| Source | Finding |
|--------|---------|
| CCM export (`export_29810835750.txt`) | CallSid correlatable; 200/ACK; RTP/RTCP octets increasing; low loss — **server/media OK** |
| `blankissuerahul.log` | Full success: ICE connected, `assignStream`, 200/ACK; heavy CRM `getCurrentInteraction` + `clearSummary` ~every 2s; many 401s; `initGetStats` empty |
| `VOICEBLANKKIRAN.log` | **652×** `interactionConnected`; ICE **disconnected** → **connected**; `phoneMute`; **no** second `assignStream`/Established in file |
| `JAFARVOICEBLANK.log` | `interactionConnected` spam + 401s; ICE disconnect/reconnect; `onicecandidateerror`; no `assignStream` in capture |

**Conclusion:** For correlatable Rahul-style case, not ECC RTP failure. Fits **ICE reconnect without re-bind** + **CRM main-thread churn**. Cannot prove “bytes stopped in browser” without `getStats` or `chrome://webrtc-internals` unless watchdog is implemented.

### 4.2 Code gaps (webrtcsdk)

| Location | Current behavior | Gap |
|----------|------------------|-----|
| `webrtc-core-sdk/src/sipjsphone.js` (~308–336) | ICE/connection state → delegate callbacks only | **No recovery FSM** on `disconnected` → `connected` |
| `webrtc-core-sdk/src/sipjsphone.js` `assignStream()` (~1138–1172) | One-shot bind at accept; `play().catch` logs error | **No re-bind** on ICE recovery |
| `webrtc-client-sdk/src/listeners/ExWebClient.js` `initGetStats` (~180–182) | Logs `"delegationHandler: initGetStats"` only | **Stub** — no byte-delta polling |
| `webrtc-core-sdk/src/webrtcDiagnostics.js` | Opt-in diagnostics (`ENABLE_WEBRTC_DIAGNOSTICS`); stats interval, visibility | **Not wired** into production recovery path by default |
| Remote call audio | `<audio>` + `srcObject` (not Web Audio graph) | Recovery = ICE + **play()**, not DTMF AudioContext |
| Ring/DTMF | Web Audio via `createMediaElementSource()` since ~3.0.3 | **Suspended AudioContext** in iframe → local tones fail |

### 4.3 Why Meet/Teams survive (and we don’t today)

| Capability | Meet / Teams | Exotel WebSDK today |
|------------|--------------|---------------------|
| ICE blip → recover media | ICE restart, renegotiation, re-bind, watchdogs | ICE state **logged** only |
| Background tab | Keeps capture/play; recovers on visibility | No visibility recovery hook |
| Restrictive NAT | Large TURN footprint | STUN in diagnostics; **TURN usage must be verified** per deployment |
| App not starving WebRTC | Media isolated from UI | CRM polls dashboard every ~2s during call |

**Smoking gun from logs:** `ice_connection_state_disconnected` → `connected` with **no second `assignStream`**.

---

## 5. Ownership split

### 5.1 Platform — **must own** (core + client SDK)

Media recovery so **every integrator** benefits without reimplementing in CRM.

| Item | Repo / layer |
|------|----------------|
| ICE/connection recovery FSM, re-`assignStream`, ICE restart | **webrtc-core-sdk** (`sipjsphone.js`) |
| Inbound RTP byte watchdog | **webrtc-core-sdk** (+ delegate from client) |
| Background tab: visibility → `ensureRemoteAudioPlaying()` | **webrtc-core-sdk** |
| Remote `play()` retry, `media_recovery_*` events | **webrtc-core-sdk** → **webrtc-client-sdk** callbacks |
| TURN/STUN config surface, relay telemetry | **Core** + **ECC/media** |
| Publish release > 3.0.11, changelog, integrator guide | **webrtc-client-sdk** |

**Client SDK rule:** Thin delegation only — **do not duplicate** recovery logic in `ExWebClient.js`.

### 5.2 CRM / Obelix — **parallel, not substitute**

| Item | Owner |
|------|--------|
| Iframe domain allowlist → 486 / missed inbound | CRM |
| `interactionConnected` dedupe (hundreds of fires) | CRM |
| `getCurrentInteraction` + `clearSummary` every ~2s during active call | CRM |
| 401 token / Amplitude retry storms | CRM |
| Reimplementing ICE recovery in CRM | **Do not** |

### 5.3 CCM / ECC — **internal + infra**

| Item | Owner |
|------|--------|
| TURN credentials and relay path | ECC / media |
| Server-side proof when RTP stops on network leg | CCM (internal RCA only — not customer deliverable) |

### 5.4 One-line DRI

- **Platform:** Media works on bad days (ICE/tab/RTP stall).
- **PRET/CRM:** App doesn’t fight the SDK on good days (polling, iframe).

---

## 6. Technical approaches (for eng review)

### Approach 1 — Reactive ICE recovery (P0, recommended)

- On `iceconnectionstatechange` / `connectionstatechange`: when returning to `connected` / `completed`, **re-run `assignStream(remoteMediaStream, audioRemote)`** + `play()` with retry.
- If still silent after N seconds: **ICE restart** via SIP.js `offerOptions.iceRestart` (supported in bundled `sip-0.20.0.js` session description handler).
- Bounded retries (e.g. 3 / 30s) → emit `media_recovery_failed`.

**Pros:** Low risk; matches observed logs.  
**Cons:** May miss playback-only failures without watchdog.

### Approach 2 — Proactive inbound RTP watchdog (P0, complements #1)

- Poll `RTCPeerConnection.getStats()` every ~1s for `inbound-rtp` byte delta.
- If delta = 0 for N seconds while SIP session **Established** → run recovery chain from Approach 1.
- Events: `media_recovery_attempted`, `succeeded`, `failed`, `ice_disconnect_duration_ms`.

**Pros:** Detects “silent but connected”; actionable support data.  
**Cons:** CPU overhead; tune for hold/mute.

**Note:** `webrtcDiagnostics.js` already has `startWebRTCStatsDiagnostics` when diagnostics enabled — production recovery should use similar logic **always** (or behind a feature flag), not only when `ENABLE_WEBRTC_DIAGNOSTICS=true`.

### Approach 3 — Background tab resilience (P1)

- `document.visibilitychange`: do **not** tear down PC when `hidden`.
- On `visible`: resume remote play + `AudioContext.resume()` for UI tones.

**Pros:** Matches minimized-tab behavior.  
**Cons:** Browser throttling limits.

### Approach 4 — Tone path (P1)

- **Option A:** `AudioContext.resume()` before ring/DTMF; retry on visibility.
- **Option B:** Bypass Web Audio graph for tones — direct `<audio>` + `setSinkId` (pre-3.0.3 / v1.0.24 style).

**Pros:** Fixes iframe local sidetone beyond VST-1712.  
**Cons:** Option B needs QA on volume/routing.

### Approach 5 — TURN-first fallback (P2, with ECC)

- Configurable `iceServers`; telemetry % `relay` vs `host`.
- **Pros:** NAT parity with Meet on restrictive networks.  
**Cons:** Infra cost; not SDK-only.

---

## 7. Implementation scope by priority

### P0 — Media recovery FSM (must-have)

1. Connection state machine on active `RTCPeerConnection`.
2. Implement real `initGetStats` (remove client stub; core owns polling).
3. `assignStream` hardening: retry `play()`, log failures, recovery path uses existing `onaddtrack` / `onremovetrack` hooks.

**Primary files:**

- `webrtc-core-sdk/src/sipjsphone.js` — delegates ~308–336, `assignStream` ~1138–1172, `onInvitationSessionAccepted` ~1603+
- `webrtc-core-sdk/src/webrtcSIPPhoneEventDelegate.js` — new recovery delegate methods
- `webrtc-client-sdk/src/listeners/ExWebClient.js` — wire `initGetStats` to core

### P1 — Background tab & browser policy

4. `visibilitychange` + `ensureRemoteAudioPlaying()`.
5. UI tones: AudioContext resume or bypass (Approach 4).

### P2 — Network adaptation

6. TURN/STUN + relay telemetry.
7. ICE gathering timeout / restart on sustained `failed`.

### Target release

**webrtc-core-sdk** + **webrtc-client-sdk** version **> 3.0.11** (e.g. **3.0.12**).

---

## 8. Client SDK (webrtc-client-sdk)

- Expose **SessionCallback** / logger events for recovery lifecycle.
- Wire `initGetStats(pc, callId, username)` to core implementation.
- Changelog + **CRM integration guide**.
- Update sample apps: `exotel-voip-websdk-sampleapp`, `webrtcsdk/sample-react-ui`.

---

## 9. CRM / SDK integrator responsibilities

Integrators **must** (document in release notes):

1. Upgrade to SDK ≥ version with media resilience (3.0.12 when released).
2. Register `SessionCallback` for recovery events; optional UI: “Reconnecting audio…”.
3. **Throttle or pause** `getCurrentInteraction`, `clearSummary` during active WebRTC call.
4. **Dedupe** `interactionConnected` — one handler per `interactionId`.
5. Fix iframe **authorized domain** list (486 track — separate from VST-1775).
6. Avoid main-thread blocking during calls (401 retry storms).

Integrators **should not** reimplement ICE recovery in CRM.

---

## 10. Acceptance criteria

### Lab (QA)

- [ ] ICE disconnect simulation (throttle / offline 5s) → remote audio returns within **≤ 5s** without agent refresh.
- [ ] Tab background **2 min** during established call → audio continues OR recovers on focus.
- [ ] ICE `disconnected` → `connected` → recovery logged (`assignStream` or equivalent).
- [ ] Inbound byte stall → watchdog triggers recovery.
- [ ] Ring + DTMF audible in iframe where browser policy allows.

### Telemetry

- [ ] `media_recovery_*` events in SDK logs with CallSid.
- [ ] Healthy calls show non-zero inbound RTP byte deltas in stats.

### Release

- [ ] Core + client SDK tagged and published.
- [ ] Sample app updated.
- [ ] CRM integration guide published.

---

## 11. Delivery phases

| Phase | Deliverable |
|-------|-------------|
| **S1** | ICE/connection FSM + re-`assignStream` + ICE restart |
| **S1** | Inbound RTP watchdog (`initGetStats`) |
| **S2** | Visibility / background tab recovery |
| **S2** | Tone path (AudioContext resume or bypass) |
| **S3** | TURN telemetry + ECC config review |

---

## 12. Validation (without customer network changes)

1. **Lab:** Chrome network profile / offline 5s → audio returns.
2. **Lab:** Tab background 2 min → audio ok or recovers on focus.
3. **Lab:** Force ICE disconnect via webrtc-internals → recovery within SLA.
4. **Pilot:** 2–3 agents on new SDK vs 3.0.11 — blank rate + log comparison.
5. **Metrics:** `media_recovery_attempted` / `succeeded` / `failed`, `ice_disconnect_duration_ms`, `inbound_bytes_stall_sec`.

---

## 13. What to stop doing (process)

| Stop | Do instead |
|------|------------|
| Closing with “network/ICE disconnect in PCAP” when Meet works | Internal: server RTP ok? → **browser recovery** |
| Only adding console logs | **Automated recovery** + support events with CallSid |
| Waiting for perfect repro | Watchdog + synthetic ICE tests in QA |
| Blaming iframe/486 for **mid-call blank** | Separate tracks: connect vs **media recovery** |

---

## 14. Existing SDK capabilities (today)

**Available:**

- `registerLoggerCallback`, `downloadLogs()` (LogManager)
- `SessionCallback`: `ice_connection_state_*`, `ice_gathering_state_*`
- `callEventCallback`: `connected`, `terminated`, `i_new_call`, etc.
- `onRecieveInvite` → `CallDetails.callSid`, SIP Call-ID, LegSid
- `initGetStats` **called from core** in `onSessionDescriptionHandler` — but client handler is stub
- `Call.Hangup()` logs `call ended` + `console.trace()` (3.0.10+)
- `initDiagnostics()` — pre-call network test
- `webrtcDiagnostics.js` — opt-in stats, visibility, remote play logging (flag-gated)

**Gaps:**

- No production media recovery FSM
- No default inbound byte watchdog
- No page visibility recovery for remote audio
- CRM-only APIs (`getCurrentInteraction`, `clearSummary`) not in WebSDK

---

## 15. Suggested follow-up Jira cards (not VST-1775)

| Card | Owner | Summary |
|------|--------|---------|
| CRM-1 | Obelix | Throttle `getCurrentInteraction` / `clearSummary` during active WebRTC; dedupe `interactionConnected` |
| CRM-2 | Obelix | Iframe authorized-domain allowlist (486 / missed inbound) |
| CCM-1 | ECC | TURN provisioning + relay-candidate telemetry for WebRTC legs |

---

## 16. PM actions (IP Platform)

1. Assign Platform eng DRI on **VST-1775**.
2. Link to WebRTC / voice-quality Epic if applicable.
3. Groom **S1** first (ICE FSM + watchdog).
4. Open parallel CRM tasks — do not block SDK on CRM.
5. Pilot plan on customer agents before broad rollout.
6. Customer comms: fix is **SDK resilience + CRM stability**, not network change.

---

## 17. Repos & references

| Repo | Path |
|------|------|
| Core SDK | `/Users/saurabh.sharma/Desktop/webrtcsdk/webrtc-core-sdk` |
| Client SDK | `/Users/saurabh.sharma/Desktop/webrtcsdk/webrtc-client-sdk` |
| Sample app | `/Users/saurabh.sharma/Desktop/exotel-voip-websdk-sampleapp` |
| Diagnostics module | `webrtc-core-sdk/src/webrtcDiagnostics.js` |
| Spec (not fully implemented) | `Downloads/webrtc_logging_cursor_check.md` |

**Customer context:** Giva / Zerodha-style voice blank threads; spill noted PRET on 1.0.24 vs 3.0.x upgrade debt.

---

## 18. Definition of Done (VST-1775)

- Shipped in tagged **core + client** SDK release (> 3.0.11).
- QA sign-off on matrix in §10.
- CRM integration guide published.
- Pilot metrics show improvement vs 3.0.11 on blank-rate or recovery success rate.
