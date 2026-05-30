# VST-1775 — QA evidence (manual, May 30 2026)

**Jira:** [VST-1775](https://exotel.atlassian.net/browse/VST-1775)  
**SDK:** webrtc-core-sdk & webrtc-client-sdk **3.0.12**  
**Sanitized logs:** [docs/qa/evidence/VST-1775/](./qa/evidence/VST-1775/)

All captures below used the media-resilience build. Credentials redacted in attached log files.

---

## Acceptance criteria matrix

| AC | Test procedure | Expected | Actual | Log source | Result |
|----|----------------|----------|--------|------------|--------|
| ICE disconnect → audio ≤5s | Active call; brief WiFi off/on | `media_recovery_succeeded` with `inbound_byte_delta > 0` | Recovered within backoff window; RTP delta verified | `11-28-53`, `11-19-36` | **Pass** |
| Tab background ~2 min | Tab away during call; return | `visibility_visible` triggers recovery; audio returns | Recovery logged on tab visible | `11-19-36` | **Pass** |
| ICE disconnected → connected | Multiple ICE blips during call | Recovery attempts logged; eventual success | All recoveries showed byte delta | May 30 captures | **Pass** |
| Inbound byte stall → watchdog | Network toggle / stall | `inbound_stall` or `network_change` recovery | Watchdog fired; soft + ICE restart as needed | `11-28-53` | **Pass** |
| `media_recovery_*` telemetry | SDK console logs | attempted / succeeded / degraded / failed / healthy | Events present with structured fields | `webrtc_sdk_logs_2026-05-30 (3).txt` | **Pass** |
| Hold / mute during blip | Hold call; network blip | Watchdog skipped; signaling OK | No false recovery on hold | Manual runs | **Pass** |
| Extended WiFi off (>2 min) | WiFi off for extended period | Backoff retries; may fail without TURN | `media_recovery_failed` with retry scheduled | `11-25-17` | **Pass (expected limit)** |
| Ring + DTMF in iframe | — | — | Out of VST-1775 scope | — | **N/A → VST-1783** |

---

## Best runs (zero hard failures)

| Capture | Notes |
|---------|-------|
| `manual_call_test_2026-05-30_11-28-53.txt` | 0 `media_recovery_failed`; all successes had RTP delta > 0 |
| `manual_call_test_2026-05-30_11-19-36.txt` | Tab visibility recovery; multiple blips recovered |

---

## Regression checks

| Check | Result |
|-------|--------|
| Answer incoming call — remote audio | Pass |
| Outbound call — two-way audio | Pass |
| Hold / unhold | Pass (signaling + audio) |
| Mute / unmute | Pass |
| DTMF (signaling) | Pass |

---

## How to reproduce (QA)

1. Build SDK 3.0.12 from branch `VST-1775-WebSDK-Media-resilience`.
2. Use `exotel-voip-websdk-sampleapp/demo-non-npm` (`make deps`).
3. Go online; place or receive a call.
4. During active call: toggle WiFi off 2–5s, or background tab 1–2 min.
5. Confirm console: `media_recovery_succeeded` with `inbound_byte_delta > 0`.
6. Confirm agent hears remote party without manual refresh.

---

## Known test limits

- No TURN in test environment — extended blackout (>2 min) may not recover (documented limitation).
- Ring duration and iframe tone tests belong to VST-1782 / VST-1783.
