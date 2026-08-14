# WebSDK configurable ring duration (3.0.13+)

**Jira:** [VST-1782](https://exotel.atlassian.net/browse/VST-1782)

Controls **local incoming ringtone playback length** only. Does not change server-side routing or Nodeflow timeout — your app should pass the same value your platform uses.

## APIs

```javascript
// After initWebrtc(), before or during agent session:
exWebClient.setRingingDuration(30);  // seconds; default 30

exWebClient.getRingingDuration();    // returns current seconds

exWebClient.stopRingTone();          // stop ring early (e.g. agent action)
```

## Integration pattern

1. Read ring timeout from your contact-center config (Nodeflow, campaign settings, etc.).
2. Call `setRingingDuration(seconds)` after `initWebrtc()` on Go Online.
3. Optionally call `stopRingTone()` when your UI dismisses the incoming-call popup.

## Defaults and migration

| Version | Default local ring |
|---------|-------------------|
| Before 3.0.13 | ~15 seconds (30 × 500ms play intervals) |
| 3.0.13+ | **30 seconds** (configurable) |

Apps that relied on the old ~15s cap should call `setRingingDuration(15)` explicitly if needed.

## Related

- Media recovery (call audio): [VST-1775 / MEDIA-RESILIENCE.md](./MEDIA-RESILIENCE.md) — separate release 3.0.12
- UI tone reliability (iframe): [VST-1783](https://exotel.atlassian.net/browse/VST-1783)
