# WebSDK media resilience (3.0.12+)

Public integration notes for release **3.0.12**. For functional/non-functional requirements and review scope see [VST-1775-FR-NFR.md](./VST-1775-FR-NFR.md).

## What changed

The SDK automatically attempts to restore **call audio** (remote stream + outbound mic) after:

- ICE or connection state blips (`disconnected` → `connected` / `failed`)
- Inbound RTP byte stalls (≥3 seconds) on an established session
- Browser tab returning to the foreground
- Network interface changes (`online`, `offline`, WiFi↔cellular where supported)

## Integrator APIs

### Media recovery events

Subscribe via `SessionCallback`. Event names are prefixed with `media_recovery_`:

| Event | Meaning |
|-------|---------|
| `media_recovery_attempted` | Recovery cycle started (`reason`, `consecutive_failures`, `next_backoff_ms`) |
| `media_recovery_succeeded` | Inbound RTP bytes increased after recovery (`inbound_byte_delta`, optional `rtt_sec`, `jitter_sec`) |
| `media_recovery_degraded` | Media path degraded (`signaling_ok`, `media_ok`, ICE/connection state) |
| `media_recovery_failed` | Cycle failed; SDK schedules retry with exponential backoff (not a permanent give-up) |
| `media_recovery_healthy` | Sustained healthy inbound RTP; backoff counter reset |

Common `reason` values: `ice_reconnected`, `inbound_stall`, `connection_degraded`, `connection_failed`, `visibility_visible`, `network_online`, `network_change`, `network_offline`.

Use `media_recovery_degraded` / `media_recovery_failed` with `signaling_ok: true, media_ok: false` to show “Reconnecting audio…” while hold/DTMF still work.

## Recommended integration checklist

1. Upgrade **webrtc-core-sdk** and **webrtc-client-sdk** to **3.0.12** or later.
2. Handle `media_recovery_*` session events for agent-facing “reconnecting audio” UI.
3. Avoid heavy main-thread work in the host app during active calls.

## Related cards (not in 3.0.12 media-resilience release)

| Feature | Jira |
|---------|------|
| Configurable incoming ring duration | [VST-1782](https://exotel.atlassian.net/browse/VST-1782) |
| UI tone playback (ring/DTMF in iframe) | [VST-1783](https://exotel.atlassian.net/browse/VST-1783) |

## Known limitations

- Recovery retries for the lifetime of the call with exponential backoff (2s → 5s → 12s → 30s → 60s).
- If the network path is fully down for an extended period, recovery may not succeed until connectivity returns. **TURN relay** is not configured in this SDK release; that is an infrastructure follow-up.
- `navigator.connection` change events are not available in all browsers (Safari); `online`/`offline` still apply.

## Agent environment guidance

- Prefer wired USB headsets over Bluetooth when possible.
- Close CPU-heavy browser tabs during active calls.
- Ensure stable network; media recovery handles brief blips automatically.
