# WebSDK media resilience (3.0.12+)

Public integration notes for release **3.0.12** (PR1: media recovery only). For full API details see the Exotel Voice WebSDK integration guides linked from the repository README.

## What changed

The SDK automatically attempts to restore call audio after:

- ICE or connection state blips (`disconnected` → `connected`)
- Inbound RTP byte stalls on an established session
- Browser tab returning to the foreground

Recovery also attempts to restore outbound microphone tracks after network blips when the call is not on hold or muted.

## Integrator APIs

### Media recovery events

Subscribe via `SessionCallback`. Event names are prefixed with `media_recovery_`:

| Event | Meaning |
|-------|---------|
| `media_recovery_attempted` | Recovery started |
| `media_recovery_succeeded` | Remote audio play and/or sender restore succeeded |
| `media_recovery_failed` | Retry budget exhausted (default: 3 attempts per 30s window) |
| `media_recovery_degraded` | ICE or connection entered a degraded state |

Example handler:

```javascript
function sessionCallback(eventName, callFromNumber) {
  if (eventName.startsWith('media_recovery_')) {
    // Show agent-facing "reconnecting audio" UI if desired
    console.log(eventName, callFromNumber);
  }
}
```

## Recommended integration checklist

1. Upgrade **webrtc-core-sdk** and **webrtc-client-sdk** to **3.0.12** or later together.
2. Handle `media_recovery_*` session events if you want agent-facing reconnect UI.
3. Avoid heavy main-thread work in the host app during active calls.

## Manual test plan

See [MEDIA-RESILIENCE-TEST-PLAN.md](MEDIA-RESILIENCE-TEST-PLAN.md) for the reviewer test matrix.

## Follow-up (separate PR)

UI tone reliability (`primeUiTones`), configurable ring duration, and optional WebRTC diagnostics are deferred to a follow-up PR. See [VST-1775-PR2-SCOPE.md](VST-1775-PR2-SCOPE.md).
