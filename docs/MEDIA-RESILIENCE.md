# WebSDK ICE media resilience (3.0.12+)

Minimal ICE recovery for brief network / tab-background audio loss.

## Behavior

1. On ICE `failed`, SDK sends a SIP re-INVITE with `iceRestart: true`.
2. On tab return to foreground, SDK resumes `AudioContext`, retries remote `play()`, and ICE-restarts if ICE is still `failed` / `disconnected`.

## SessionCallback events

| Event | Meaning |
|-------|---------|
| `ice_connection_state_<state>` | ICE connection state change (`new`, `checking`, `connected`, `completed`, `disconnected`, `failed`, `closed`) |
| `ice_restart_initiated` | ICE restart re-INVITE was started |

Both are delivered via the existing `SessionCallback` path (same as other session events).
