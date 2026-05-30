# VST-1775 media resilience — manual test plan

Use this matrix when reviewing PR1 (media recovery only). Test with **webrtc-core-sdk 3.0.12** and **webrtc-client-sdk 3.0.12** built together.

## Prerequisites

- Two test agents or one agent + one PSTN/mobile callee
- Chrome (primary) and one alternate browser (Firefox or Edge)
- Ability to throttle or disable network briefly (OS network off/on, DevTools offline, or VPN toggle)
- `SessionCallback` logging `media_recovery_*` events enabled in the host app

## Test cases

| # | Scenario | Steps | Expected result |
|---|----------|-------|-----------------|
| 1 | **Baseline call** | Place or accept a call; speak both ways for 30s | Audio works both directions; no spurious `media_recovery_*` events |
| 2 | **ICE blip** | During established call, disable network 3–5s, re-enable | `media_recovery_attempted` fires; remote audio returns; `media_recovery_succeeded` or recovery completes without hangup |
| 3 | **Inbound RTP stall** | During call, simulate stall (e.g. background tab 10s+ on callee side, or network flap) | Watchdog detects stall; recovery attempted; remote audio resumes |
| 4 | **Tab background / foreground** | Establish call; switch away from tab 15s; return | On visibility visible, remote `<audio>` replay attempted; audio resumes if it had dropped |
| 5 | **Hold skips recovery** | Put call on hold; trigger network blip; release hold | No mic restore while held; after unhold, agent can speak normally |
| 6 | **Mute skips outbound restore** | Mute agent; trigger network blip; unmute | Outbound restore skipped while muted; after unmute, agent audio works |
| 7 | **Recovery budget exhausted** | Repeatedly flap network (>3 times in 30s) | `media_recovery_failed` emitted after retry budget; call may stay up but logs show exhausted attempts |
| 8 | **Outbound mic after blip** | During call, remote party confirms they hear you; flap network; speak again | Remote party hears agent after recovery (sender track / replaceTrack path) |
| 9 | **Call teardown** | End call after recovery cycle | No console errors; recovery timers/listeners cleaned up (no leaks on second call) |
| 10 | **Second call** | Complete test 2, hang up, place new call | New call works; recovery attaches fresh per session |

## Logging to capture for failures

- All `media_recovery_*` session callback events with timestamps
- Browser console logs prefixed with `mediaRecovery:`
- ICE / connection state transitions during the blip
- Whether call was hold/mute at time of blip

## Out of scope for PR1

Do **not** block PR1 on these (deferred to PR2):

- Ringtone duration / `setRingingDuration`
- `primeUiTones` / iframe autoplay for UI tones
- `ENABLE_WEBRTC_DIAGNOSTICS` tooling

See [VST-1775-PR2-SCOPE.md](VST-1775-PR2-SCOPE.md).
