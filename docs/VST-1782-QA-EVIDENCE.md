# VST-1782 — QA evidence (manual, May 30 2026)

**Jira:** [VST-1782](https://exotel.atlassian.net/browse/VST-1782)  
**SDK:** webrtc-core-sdk & webrtc-client-sdk **3.0.13**  
**Sanitized logs:** [docs/qa/evidence/VST-1782/](./qa/evidence/VST-1782/)  
**Sample app:** demo-non-npm (local HTTPS)

---

## Test matrix

| Test | Procedure | Expected | Actual | Result |
|------|-----------|----------|--------|--------|
| API: setRingingDuration | Set 10, 30, 40, 45 sec | `sipjsphone: setRingingDuration: N sec` | All values accepted | **Pass** |
| Auto-stop 10s | Incoming call after `setRingingDuration(10)` | Ring stops ~10s | `startRingTone` 12:12:28.576 → `auto-stop` 12:12:38.580 (**10.00s**) | **Pass** |
| Manual stopRingTone | Incoming at 30s config | Ring stops on API call | `stopRingTone` at 12:13:00.069 (~0.8s after ring start) | **Pass** |
| Config 30s (Nodeflow default) | `setRingingDuration(30)` | Ring uses 30s timer | `durationSec: 30` logged on incoming | **Pass** |
| Config 40s / 45s | Set duration; incoming call | SDK timer set to N sec | `durationSec: 40/45` logged; call ended at ~30s due to **server/caller hangup** (not SDK 15s cap) | **Pass (SDK config)** |
| Answered call audio | Accept incoming after ring | Two-way audio OK | Calls completed normally when answered | **Pass** |

---

## Key log excerpts

### 10s auto-stop (verified)

```
12:12:28.576  DEBUG: startRingTone called, durationSec: 10
12:12:38.580  sipjsphone: startRingTone: auto-stop after configured duration
```

Delta: **10.004 seconds**

### stopRingTone early stop

```
12:12:59.284  DEBUG: startRingTone called, durationSec: 30
12:13:00.069  stopRingTone called
```

### Platform note (40s / 45s runs)

Call sessions `call-1780143195447` (40s config) and `call-1780143299786` (45s config) ended at **~30s** with `reason=callended` — caller/platform terminated the session before SDK auto-stop fired. SDK had correct `durationSec` configured; no regression to old ~15s SDK cap.

---

## Log files

| File | Description |
|------|-------------|
| `manual_call_test_2026-05-30_12-15-42.txt` | Full capture with UI actions + console |
| `webrtc_sdk_logs_2026-05-30_(4).txt` | SDK-only log extract |

Credentials redacted before commit.

---

## Reproduce

1. Checkout `VST-1782-configurable-ringing-duration`; build both SDKs.
2. demo-non-npm: Go Online → `setRingingDuration(10)` → trigger incoming call.
3. Confirm auto-stop log at ~10s.
4. Repeat with `stopRingTone()` mid-ring.
