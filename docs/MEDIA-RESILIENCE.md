# WebSDK ICE media resilience (3.0.12+)

Minimal ICE recovery for brief network / tab-background audio loss.

## Behavior

1. On ICE `failed`, SDK sends a SIP re-INVITE with `iceRestart: true` immediately (max 3 attempts per call, reset once ICE reconnects).
2. On ICE `disconnected`, SDK waits 15s (grace period for transient loss); if still not reconnected, it sends the same ICE-restart re-INVITE.

## SessionCallback events

| Event | Meaning |
|-------|---------|
| `ice_connection_state_<state>` | ICE connection state change (`new`, `checking`, `connected`, `completed`, `disconnected`, `failed`, `closed`) |
| `ice_restart_initiated` | ICE restart re-INVITE was started |

Both are delivered via the existing `SessionCallback` path (same as other session events).
