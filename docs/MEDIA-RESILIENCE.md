# 3.0.12 — Media resilience

Upgrade **webrtc-core-sdk** and **webrtc-client-sdk** to **3.0.12** together.

## What you get

Call audio is restored automatically when:

- Network drops briefly and reconnects
- Inbound audio stops on an active call
- The agent returns to the browser tab

No code changes are required for basic recovery.

## Optional: reconnect UI

If you use `SessionCallback`, you can show a “reconnecting audio” message:

| SessionCallback event | Meaning |
|-----------------------|---------|
| `media_recovery_attempted` | Recovery started |
| `media_recovery_succeeded` | Audio restored |
| `media_recovery_failed` | Recovery gave up (call may still be up) |
| `media_recovery_degraded` | Connection is unstable |

```javascript
function sessionCallback(eventName, callFromNumber) {
  if (eventName === 'media_recovery_attempted') {
    showMessage('Reconnecting audio…');
  }
  if (eventName === 'media_recovery_succeeded') {
    hideMessage();
  }
}
```

Recovery is skipped while the call is on hold or muted.
