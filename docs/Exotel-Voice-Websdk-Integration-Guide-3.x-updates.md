# Exotel Voice WebSDK Bundle 3.x — Integration Guide Updates

**Purpose:** Paste these updates into the Integration Guide (PDF / Confluence / Word).  
**Include:** VST-1150 (websocket disconnect), VST-1782 (ringing duration), VST-2016 (ringtone start/stop).  
**Do not include:** VST-1775 (media resilience / ICE restart).

---

## 1. Version history table — add row

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 02-01-2023 | Initial Upload |
| **1.1** | **14-08-2026** | **Configurable ringing duration (`setRingingDuration` / `getRingingDuration`, default 30s). Public ringtone APIs (`startRingTone` / `stopRingTone`). WebSocket disconnect event via SessionCallback (`websocket_disconnected`).** |

---

## 2. Content / TOC — add after 5.19

```
5.19. Disabling Built-in Logging	31
5.20. WebSocket Disconnect Event	32
5.21. Configurable Ringing Duration	32
5.22. Ringtone Start / Stop	33
6. Messages	34
...
```

(Renumber later sections if your page numbers change.)

---

## 3. Section 5.4 — RegisterEventCallBack

Do **not** add `websocket_disconnected` to RegisterEventCallBack. That event is delivered on **SessionCallback** (see §5.20).

---

## 4. New section 5.20 — WebSocket Disconnect Event

### WebSocket Disconnect Event

When the SIP WebSocket transport closes or fails, the SDK notifies the application via `SessionCallback` with state `"websocket_disconnected"`.

| | |
|--|--|
| **API Name** | SessionCallback (event) |
| **Args** | `callState`: `"websocket_disconnected"`<br>`phone`: username<br>`error`: `{ message, code }` — `code` is a number when parsed, otherwise `""` |
| **Exported To** | Application UI |

```javascript
function SessionCallback(callState, phone, error) {
  if (callState === 'websocket_disconnected') {
    console.log('SDK websocket disconnected', phone, error);
    // Update UI; optionally retry DoRegister() if your app uses auto-reconnect
  }
}
```

**Notes:**
- Call `initWebrtc` and register callbacks before `DoRegister` so this event is received.
- For application-driven reconnect after disconnect, see **§5.14 Auto reconnect in case of websocket connection failure**.
- Delivered through **SessionCallback**, not RegisterEventCallBack.
- Also fires on intentional teardown (`UnRegister`); those cases typically have empty `message` and `code`.

---

## 5. New section 5.21 — Configurable Ringing Duration

### Configurable Ringing Duration

By default, the incoming-call ringtone stops automatically after **30 seconds** if the call is not answered or rejected. You can change this duration per `ExotelWebClient` instance.

Call these APIs **after** `initWebrtc` (when the underlying SIP phone exists). Invalid values (`<= 0`, `null`, etc.) are rejected and the previous duration is kept.

| | |
|--|--|
| **API Name** | ExotelWebClient.setRingingDuration |
| **Args** | `seconds` (number) — ringing duration in seconds; must be `> 0` |
| **Returns** | `true` if applied; `false` if invalid or phone not initialized |
| **Exported To** | Application UI |

| | |
|--|--|
| **API Name** | ExotelWebClient.getRingingDuration |
| **Args** | None |
| **Returns** | Current duration in seconds (default **30** if never set / not initialized) |
| **Exported To** | Application UI |

```javascript
// After initWebrtc
exWebClient.setRingingDuration(45);           // ring auto-stops after 45s
const duration = exWebClient.getRingingDuration(); // e.g. 45

// Invalid values are ignored
exWebClient.setRingingDuration(0);   // returns false; duration unchanged
exWebClient.setRingingDuration(-5);  // returns false; duration unchanged
```

**Behavior:**
- Applies to the **incoming ringtone** auto-stop timer (not ringback for outbound calls).
- If duration is changed while a ringtone is already playing, the auto-stop timer is reset using the new value.
- Ringtone also stops early on answer, reject, hangup, or an explicit `stopRingTone()` call (see §5.22).

---

## 6. New section 5.22 — Ringtone Start / Stop

### Ringtone Start / Stop

The SDK starts the ringtone automatically when an incoming SIP INVITE is received. You can also start or stop the ringtone from the application (for example, to align ringing with your own UI or push-notification sync).

| | |
|--|--|
| **API Name** | ExotelWebClient.startRingTone |
| **Args** | None |
| **Exported To** | Application UI |

| | |
|--|--|
| **API Name** | ExotelWebClient.stopRingTone |
| **Args** | None |
| **Exported To** | Application UI |

```javascript
// Audible ringtone requires a registered SIP session (after successful DoRegister)
exWebClient.DoRegister();

// Later — play ringtone under app control
exWebClient.startRingTone();

// Stop early (also clears the auto-stop timer)
exWebClient.stopRingTone();
```

**Behavior:**
- **Auto start:** On incoming call, the SDK still calls `startRingTone()` internally when the INVITE arrives.
- **Auto stop:** Ringtone stops when the call is answered, rejected, ended, or when the configured ringing duration elapses (§5.21).
- **Manual start:** `startRingTone()` plays only when the SIP phone context exists (typically **after** `DoRegister`). Calling it before register is a no-op (no audible ring).
- **Manual stop:** `stopRingTone()` stops audio immediately and clears the duration timer.
- **Volume:** Ringtone level can still be controlled via `ExotelWebClient.setAudioOutputVolume("ringtone", value)` (§5.18).

**Multi-account note (same browser tab):**  
If multiple `ExotelWebClient` instances share one page, the ringtone **audio element is shared**. Calling `stopRingTone()` on one account can silence the audible ring for another account that is still ringing. Prefer stopping from the **same** client instance that is ringing, or design your UI so only one account drives ringtone start/stop.

---

## 7. Optional — small cross-links in existing sections

### Under §5.6 Receive Calls (after incoming event description)

> When `eventType === 'incoming'`, the SDK starts the ringtone automatically. Ringtone duration is configurable (§5.21). Apps may also call `startRingTone()` / `stopRingTone()` (§5.22).

### Under §5.14 Auto reconnect

> When the WebSocket drops, you may also receive `SessionCallback` with `callState === 'websocket_disconnected'` (§5.20). Use that together with your `shouldAutoRetry` logic before calling `DoRegister()` again.

---

## 8. Out of scope (do not add yet)

Do **not** document VST-1775 media resilience in this revision:

- `ice_restart_initiated`
- `media_recovery_*` session events
- Background-tab ICE recovery / media resilience FSM

Existing SessionCallback events already in the guide (`ice_gathering_state_*`, `ice_connection_state_*`, `media_permission_denied`) can stay as-is.
