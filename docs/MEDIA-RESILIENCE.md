# WebSDK media resilience (3.0.12+)

Public integration notes for release **3.0.12**. For full API details see the Exotel Voice WebSDK integration guides linked from the repository README.

## What changed

The SDK automatically attempts to restore call audio after:

- ICE or connection state blips (`disconnected` → `connected`)
- Inbound RTP byte stalls on an established session
- Browser tab returning to the foreground

Local UI tones (ring, ringback, DTMF, beep) use direct `<audio>` playback to improve reliability in embedded browsers.

## Integrator APIs

### Media recovery events

Subscribe via `SessionCallback`. Event names are prefixed with `media_recovery_`:

| Event | Meaning |
|-------|---------|
| `media_recovery_attempted` | Recovery started |
| `media_recovery_succeeded` | Remote audio play and/or sender restore succeeded |
| `media_recovery_failed` | Retry budget exhausted (default: 3 attempts per 30s window) |
| `media_recovery_degraded` | ICE or connection entered a degraded state |

### UI tones

Call once per session after a user gesture (for example “Go online”):

```javascript
await exWebClient.primeUiTones();
```

Optional test helper: `exWebClient.playTestTone('ringtone' | 'ringbacktone' | 'dtmftone' | 'beeptone')`.

### Incoming ring duration

Controls **local ringtone playback length** only. Set from your application configuration (for example your contact-center ring timeout):

```javascript
exWebClient.setRingingDuration(30);  // seconds; default 30
exWebClient.getRingingDuration();
exWebClient.stopRingTone();          // stop ring early
```

The application should pass the same duration your platform uses for agent ringing. The SDK does not read server-side routing configuration automatically.

## Recommended integration checklist

1. Upgrade **webrtc-core-sdk** and **webrtc-client-sdk** to **3.0.12** or later.
2. Call `primeUiTones()` after `initWebrtc()` on a user click.
3. Call `setRingingDuration(seconds)` after init if your product default is not 30 seconds.
4. Handle `media_recovery_*` session events if you want agent-facing “reconnecting audio” UI.
5. Avoid heavy main-thread work in the host app during active calls.

## Diagnostics (optional)

Set `window.ENABLE_WEBRTC_DIAGNOSTICS = true` before initializing the SDK for additional WebRTC stats logging during troubleshooting.
