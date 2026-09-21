# Exotel Voice WebSDK — Bundle (non-npm) Integration Guide

This is the integration guide and API reference for the **bundled** Exotel Voice WebSDK — the
`exotelsdk.js` build you drop into a page with a `<script>` tag, no npm required. It doubles as
the README for the `demo-non-npm` sample app in this directory.

Using npm instead? See [`../demo-npm/README.md`](../demo-npm/README.md).

**Currently bundled: client-sdk v3.0.16 / core-sdk v3.0.14.**

---

## Contents

1. [Introduction](#1-introduction)
2. [Licensing](#2-licensing)
3. [Glossary](#3-glossary)
4. [Getting started](#4-getting-started)
5. [Running the sample app](#5-running-the-sample-app)
6. [Web Client SDK APIs](#6-web-client-sdk-apis)
   - [6.1 Initialize the library](#61-initialize-the-library)
   - [6.2 Opus codec preference](#62-opus-codec-preference--optional)
   - [6.3 Download logs](#63-download-logs--optional)
   - [6.4 Register the SIP phone](#64-register-the-sip-phone)
   - [6.5 Unregister the SIP phone](#65-unregister-the-sip-phone)
   - [6.6 Receive calls](#66-receive-calls)
   - [6.7 Accept calls](#67-accept-calls)
   - [6.8 Hangup / reject calls](#68-hangup--reject-calls)
   - [6.9 Mute / unmute](#69-mute--unmute)
   - [6.10 Hold / resume](#610-hold--resume)
   - [6.11 Send DTMF](#611-send-dtmf)
   - [6.12 Multitab scenarios](#612-multitab-scenarios)
   - [6.13 Device and network diagnostics](#613-device-and-network-diagnostics)
   - [6.14 Auto retry](#614-auto-retry)
   - [6.15 Check SDK readiness](#615-check-sdk-readiness)
   - [6.16 Audio device selection](#616-audio-device-selection)
   - [6.17 Noise suppression](#617-noise-suppression)
   - [6.18 Logger callback](#618-logger-callback)
   - [6.19 Audio volume control](#619-audio-volume-control)
   - [6.20 WebSocket disconnect event](#620-websocket-disconnect-event)
   - [6.21 Ring tone control](#621-ring-tone-control)
   - [6.22 Disabling built-in logging](#622-disabling-built-in-logging)
7. [Messages — sipAccountInfo reference](#7-messages--sipaccountinfo-reference)
8. [Integration with Exotel APIs](#8-integration-with-exotel-apis)
9. [Support](#9-support)

---

## 1. Introduction

The Exotel WebRTC SDK lets you add VOIP calling to a web app. The package is layered:

- **webrtc-core-sdk** — the SIP protocol stack and state machine (built on SIP.js).
- **webrtc-client-sdk** — the app-facing `ExotelWebClient` API and callbacks.

This document covers the client SDK, which is what your application talks to.

## 2. Licensing

You need an Exotel account to use VOIP calling with this SDK. Contact Exotel support for a demo
and account creation.

## 3. Glossary

| Term | Description |
| --- | --- |
| App | Web application |
| VOIP | Voice over IP |
| Client | User / subscriber signing up to use the web app |
| Customer | Exotel's customer licensing the SDK |

## 4. Getting started

### 4.1 Software package

- `exotelsdk.js` bundle plus its media files
- This integration guide
- The `demo-non-npm` sample application in this directory

### 4.2 Add the SDK to your project

1. Download the SDK tarball from [releases](https://github.com/exotel/webrtc-client-sdk/releases),
   or use `SDK/exotelsdk-3.0.16.tar.gz` from this repo.
2. Extract it and place the `dist` folder in your app.
3. Load it before your own scripts:

```html
<script type="text/javascript" src="./dist/exotelsdk.js"></script>
```

This defines the `exotelSDK` global.

> **Keep the `.wav` files that ship next to `exotelsdk.js`.** The bundle loads `ringtone.wav`,
> `ringbacktone.wav`, `beep.wav` and `dtmf.wav` by name, relative to itself. Delete them and the
> SDK runs silent with no error.

### 4.3 Supported browsers

Verified on Chrome, Firefox, Safari (> v11) and Edge, on Windows, Linux and macOS. Safari on
Linux is not applicable.

## 5. Running the sample app

### 5.1 Configure the SIP account

An Exotel SIP account is required. `phone.js` is a committed **placeholder** — this is a public
repository, so do not put real credentials in it. Copy it to `phone.local.js` and fill in your
values there. `phone.local.js` is gitignored, and `index.html` loads it after `phone.js`, so it
takes precedence:

```shell
cp phone.js phone.local.js   # then edit phone.local.js
```

The config shape, in either file:

```js
phone = '[
    {
        "Username":"<VOIP Username>",
        "DisplayName":"<Display Name>",
        "HostServer":"<VOIP Proxy Address>",
        "Domain":"<VOIP Domain Address>",
        "Port":443,
        "Password":"<VOIP Password>",
        "CallTimeout":1000,
        "Security": "wss",
        "EndPoint": "wss",
        "AccountSID":"<Your Account SID>",
        "AccountNo":"<VOIP Username>",
        "AutoRegistration": true
    }
]';
```

`index.html` can load a second account via `phone2.js` / `demo2.js`.

### 5.2 Serve it

WebRTC requires a secure context, so plain `http://` will not work. Generate a self-signed cert
and serve over HTTPS:

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
http-server -S -C cert.pem -K key.pem -p 8080 -c-1
```

`-c-1` disables caching — without it the browser will keep serving a stale `exotelsdk.js` after
you refresh the bundle.

Then open `https://localhost:8080/index.html`. The demo provides register, accept, reject, mute
and hold via a simple interface.

## 6. Web Client SDK APIs

### 6.1 Initialize the library

```js
const exWebClient = new exotelSDK.ExotelWebClient();

const sipAccountInfo = {
  'userName':    'Username',
  'authUser':    'Username',
  'sipdomain':   'Domain',
  'domain':      'HostServer' + ':' + Port,
  'displayname': 'DisplayName',
  'secret':      'Password',
  'port':        'Port',
  'security':    'wss',
};

exWebClient.initWebrtc(sipAccountInfo,
                       RegisterEventCallBack,
                       CallListenerCallback,
                       SessionCallback);
```

`initWebrtc` takes the SIP account details (see [§7](#7-messages--sipaccountinfo-reference)) and
three callbacks:

- **RegisterEventCallBack** — registration state changes
- **CallListenerCallback** — call events
- **SessionCallback** — multi-tab session notifications

An optional 5th argument enables automatic audio device change handling — see
[§6.16](#616-audio-device-selection).

### 6.2 Opus codec preference — optional

Opus must first be enabled on your Exotel VOIP domain (raise a request to hello@exotel.com). If
the browser does not then prefer Opus in the SIP 200 OK, force it:

```js
exWebClient.setPreferredCodec('opus');
```

### 6.3 Download logs — optional

Downloads a `.txt` file (e.g. `webrtc_sdk_logs_2025-04-03.txt`) containing the last 1000 logs
held in the browser's localStorage. Useful when sharing logs with support.

```js
exWebClient.downloadLogs();
```

### 6.4 Register the SIP phone

A phone must be registered before making or receiving calls.

| API | Args | Exported to |
| --- | --- | --- |
| `ExotelWebClient.DoRegister` | None | Application UI |

```js
// Ensure initWebrtc has been invoked before calling DoRegister
exWebClient.DoRegister();
```

The result arrives on `RegisterEventCallBack`:

| Param | Type | Values |
| --- | --- | --- |
| `state` | String | `registered` / `unregistered` / `terminated` / `sent_request` / `websocket_disconnected` |
| `phone` | String | Username |

```js
function RegisterEventCallBack(state, phone, error) {
  if (state === 'registered') {
    setRegState(true);                 // successful registration
  } else if (state === 'unregistered') {
    setRegState(false);                // successful unregistration
  } else if (state === 'websocket_disconnected') {
    console.log('WebSocket disconnected for', phone, error);
    setRegState(false);
  } else if (state === 'terminated') {
    setRegState(false);                // registration/unregistration failed
  } else if (state === 'sent_request') {
    // request sent
  }
}
```

### 6.5 Unregister the SIP phone

| API | Args | Exported to |
| --- | --- | --- |
| `ExotelWebClient.UnRegister` | None | Application UI |

```js
exWebClient.UnRegister();
```

**Note 1:** with more than one phone, the `phone` argument identifies which one unregistered.

**Note 2:** unregistration does not always produce a success response. Handle the flow using the
`sent_request` event as well.

### 6.6 Receive calls

Incoming calls arrive on `CallListenerCallback`.

| Param | Type | Values |
| --- | --- | --- |
| `callObj` | Object | `{ callId, callState, callDirection, callStartedTime, remoteDisplayName, callSid, legSid, sipHeaders, ... }` |
| `eventType` | String | `incoming` / `connected` / `callEnded` / `activeSession` |
| `phone` | String | Username identifying the receiving phone |

`callId` is the SIP Call-ID; `callStartedTime` the start time; `remoteDisplayName` the caller name.

**[VST-2017]** `callObj` also carries `callSid` and `legSid` — read off the `X-Exotel-CallSid` /
`X-Exotel-LegSid` INVITE headers, so `callObj.callSid` ties the WebRTC leg back to the AppServer
call — plus `sipHeaders`, every header on the INVITE. Shipped in client-sdk **v3.0.15** (core-sdk v3.0.13); this sample app bundles v3.0.16.

```js
function CallListenerCallback(callObj, eventType, phone) {
  if (eventType === 'incoming') {
    setCallComing(true);

    // callSid / legSid are already parsed for you — prefer these over sipHeaders.
    const { callSid, legSid, sipHeaders } = callObj;
    console.log('callSid:', callSid, 'legSid:', legSid);

    // Reading a header directly from sipHeaders? SIP.js title-cases each dash
    // segment when it stores the header, so the wire's mixed-case name is
    // never present as a key. This looks up 'X-Exotel-CallSid' and misses:
    console.log(sipHeaders['X-Exotel-CallSid']);  // undefined
    // The stored key is 'X-Exotel-Callsid' (lowercase "sid"):
    console.log(sipHeaders['X-Exotel-Callsid']);  // matches callObj.callSid
  } else if (eventType === 'connected') {
    setCallComing(false);
    setCallState(true);
  } else if (eventType === 'callEnded' || eventType === 'terminated') {
    setCallComing(false);
    setCallState(false);
  }
}
```

### 6.7 Accept calls

Get the call object with `getCall()` and answer it.

| API | Args | Exported to |
| --- | --- | --- |
| `Call.Answer` | None | Application UI |

```js
function acceptCallHandler() {
  const call = exWebClient.getCall();
  call.Answer();
}
```

A successful answer produces a `connected` event. Other outcomes: `callEnded` (ended locally)
and `terminated` (terminated remotely).

### 6.8 Hangup / reject calls

| API | Args | Exported to |
| --- | --- | --- |
| `Call.Hangup` | None | Application UI |

```js
function rejectCallHandler() {
  const call = exWebClient.getCall();
  call.Hangup();
}
```

Hangup by the local user reports `callEnded`; by the remote user, `terminated`.

### 6.9 Mute / unmute

| API | Args |
| --- | --- |
| `Call.Mute` | None |
| `Call.UnMute` | None |
| `Call.MuteToggle` | None |

```js
function muteHandler() {
  const call = exWebClient.getCall();
  // call.MuteToggle();  // or explicitly:
  if (!callOnMute) { call.Mute();   callOnMute = true;  }
  else             { call.UnMute(); callOnMute = false; }
}
```

There is no callback event for mute. The call stays `connected` with the mic muted.

### 6.10 Hold / resume

| API | Args |
| --- | --- |
| `Call.Hold` | None |
| `Call.UnHold` | None |
| `Call.HoldToggle` | None |

```js
function holdHandler() {
  const call = exWebClient.getCall();
  // call.HoldToggle();  // or explicitly:
  if (!callOnHold) { call.Hold();   callOnHold = true;  }
  else             { call.UnHold(); callOnHold = false; }
}
```

There is no callback event for hold. The call stays `connected` but in sendonly mode.

### 6.11 Send DTMF

| API | Args | Values |
| --- | --- | --- |
| `Call.sendDTMF` | `digit` (String) | `0-9`, `A-D`, `*`, `#` |

```js
const call = exWebClient.getCall();
if (call) { call.sendDTMF(digit); }
```

### 6.12 Multitab scenarios

When the SDK is loaded in multiple tabs, every instance registers and receives incoming call
alerts. Two ways to avoid that:

- Keep a single login session so only one SDK instance loads (**preferred**).
- Maintain a parent/child relationship across tabs so only the parent handles the call.

The SDK supports multi-tab sessions over a Broadcast Channel. `SessionListener` creates the
channel and broadcasts `incoming` / `connected` / `callEnded` / `re-register` to child tabs. A
child tab may notify the user but should not handle the call. When the parent tab is destroyed,
a `re-register` event reaches the children and one of them can become the new parent.

**Note 1:** parent/child bookkeeping is the customer application's responsibility.
**Note 2:** if you do not use multi-tab, you do not need to handle these events.

```js
SessionListener();   // call during initialization
```

`SessionCallback(callState, phone)` states:

| State | Meaning |
| --- | --- |
| `incoming` | Child tab shows a notification |
| `connected` | Child tab closes the notification |
| `callEnded` | Child tab closes the notification |
| `re-register` | Child tab registers when the parent closes |
| `ice_gathering_state_<state>` | ICE gathering changed (`new`, `gathering`, `complete`) |
| `ice_connection_state_<state>` | ICE connection changed (`new`, `checking`, `connected`, `disconnected`, `failed`, `closed`) |
| `media_permission_denied` | User denied microphone/camera permission |

```js
function SessionCallback(callState, phone) {
  switch (callState) {
    case 'incoming':
      if (window.sessionStorage.getItem('activeSessionTab') !== 'parent0') {
        setMessage('Incoming call from ' + phone + ', switch tab to find dialpad');
      }
      break;
    case 'connected':
    case 'callEnded':
      setOpen(false);
      break;
    case 're-register':
      window.sessionStorage.setItem('activeSessionTab', 'parent0');
      sendAutoRegistration();
      break;
    case 'media_permission_denied':
      showErrorMessage('Microphone access is required for calls.');
      break;
  }
}
```

### 6.13 Device and network diagnostics

#### Initialize

```js
exWebClient.initDiagnostics(diagnosticsReportCallback, diagnosticsKeyValueCallback);

function diagnosticsReportCallback(logStatus, logData) {
  // logData: troubleshooting log to save to a file
}

function diagnosticsKeyValueCallback(key, status, description) {
  // key: type of response, status: value for that key, description: detail
}
```

Immediately after `initDiagnostics`, three values arrive on the key/value callback:
`browserVersion` (e.g. `Chrome/101.0.0.0`), `micInfo` and `speakerInfo`.

#### Speaker test

```js
exWebClient.startSpeakerDiagnosticsTest();   // plays a ring tone, reports volume levels
exWebClient.stopSpeakerDiagnosticsTest('yes');  // 'yes' | 'no' | omit
```

Key `speaker`, status is a float, description `"speaker ok"` / `"speaker error"`. `'yes'` means
the user heard it. Passing no argument just ends the test without updating the logs.

#### Mic test

```js
exWebClient.startMicDiagnosticsTest();
exWebClient.stopMicDiagnosticsTest('yes');   // 'yes' | 'no' | omit
```

Key `mic`, status is a float, description `"mic ok"` / `"mic error"`.

#### Network diagnostics

```js
exWebClient.startNetworkDiagnostics();
```

Results arrive on the key/value callback:

| Key | Status | Description |
| --- | --- | --- |
| `wss` | connected / disconnected | WSS URL |
| `userReg` | registered / unregistered | userName |
| `tcp` | connected / disconnected | ICE candidate line for TCP |
| `udp` | connected / disconnected | ICE candidate line for UDP |
| `host` | connected / disconnected | ICE candidate for host (local facing) |
| `srflx` | connected / disconnected | ICE candidate for reflexive (remote facing) |

### 6.14 Auto retry

The SDK retries registration on its own after a dropped connection — a transport
failure, or a silent network drop that surfaces as a registration-expiry event. Enabled by
default, at a fixed 5s interval, until it succeeds or auto-retry is turned off. No app-side
retry loop is needed; `RegisterEventCallBack` just reports each attempt as it happens.

| API | Args | Description |
| --- | --- | --- |
| `ExotelWebClient.enableAutoRetry` | None | Turn auto-retry on (the default). Takes effect from the next `DoRegister()`. |
| `ExotelWebClient.disableAutoRetry` | None | Turn auto-retry off, including a retry already scheduled for the current session. |

```js
exWebClient.disableAutoRetry();   // opt out
exWebClient.enableAutoRetry();    // opt back in
```

`UnRegister()` does not disable auto-retry — a later `DoRegister()` still retries on failure
unless `disableAutoRetry()` was called explicitly.

### 6.15 Check SDK readiness

Checks, in order, that a microphone is available, the websocket is connected, and the user is
registered.

```js
exWebClient.checkClientStatus(function (status) {
  console.log('SDK Status ' + status);
});
```

| Event | Description |
| --- | --- |
| `media_permission_denied` | Media device unavailable, or permission not granted |
| `not_initialized` | SDK is not initialized |
| `websocket_connection_failed` | WebSocket failing due to network connectivity |
| `unregistered`, `terminated` | Invalid credentials, or registration keepalive failed |
| `initial` | Registration in progress |
| `registered` | Ready to receive calls |
| `disconnected` | WebSocket not connected |
| `connecting` | Trying to connect the WebSocket |
| `unknown` | Something went wrong |

### 6.16 Audio device selection

Register callbacks to learn when the default device changes:

| Argument | Type | |
| --- | --- | --- |
| `audioInputDeviceChangeCallback` | function | mandatory |
| `audioOutputDeviceCallback` | function | mandatory |
| `onDeviceChangeCallback` | function | optional |

If `onDeviceChangeCallback` is **not** passed, the SDK internally switches to the new default
device. If it **is** passed, the SDK will not switch internally (though the OS may still change
the default at OS level).

```js
exWebClient.registerAudioDeviceChangeCallback(
  (deviceId) => console.log('input device changed to ' + deviceId),
  (deviceId) => console.log('output device changed to ' + deviceId)
);
```

Change devices during or before a call. The optional `forceDeviceChange` bypasses the system's
internal auto-switching:

```js
exWebClient.changeAudioOutputDevice(
  selectedDeviceId,
  () => console.log('Output device changed successfully'),
  (error) => console.log('Failed to change output device: ' + error),
  true // optional: forceDeviceChange
);

exWebClient.changeAudioInputDevice(
  selectedDeviceId,
  () => console.log('Input device changed successfully'),
  (error) => console.log('Failed to change input device: ' + error),
  true // optional
);
```

To have the SDK detect and switch to newly plugged-in devices automatically, pass a 5th argument
to `initWebrtc`:

```js
exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack,
                       CallListenerCallback, SessionCallback,
                       true); // enable auto audio device change handling
```

### 6.17 Noise suppression

Disabled by default. Call after `DoRegister()`.

```js
exWebClient.setNoiseSuppression(true);
exWebClient.setNoiseSuppression(false);
```

### 6.18 Logger callback

Register your own logger to receive SDK log items. `registerLoggerCallback` is **static** on
`ExotelWebClient`.

| Arg | Type |
| --- | --- |
| `type` | String |
| `message` | String |
| `args` | Array |

> **Behaviour change in v3.0.13/3.0.14.** `type` now carries the real severity — `"log"`,
> `"info"`, `"warn"` or `"error"`. Previously **every** message arrived as `"log"`, so an
> integrator could not distinguish an SDK error from an ordinary log line, and could not filter
> or alert on failures. The signature is unchanged: a callback that already switches on `type`
> needs no code change, but `warn` and `error` now reach those branches instead of all landing
> in `"log"`.

```js
exotelSDK.ExotelWebClient.registerLoggerCallback(function (type, message, args) {
    switch (type) {
        case "error": console.error(`demo: ${message}`, args); break;
        case "warn":  console.warn(`demo: ${message}`, args);  break;
        case "info":  console.info(`demo: ${message}`, args);  break;
        default:      console.log(`demo: ${message}`, args);   break;
    }
});
```

`common.js` in this sample app already switches on the severity.

### 6.19 Audio volume control

Volume values are normalized between `0.0` (silent) and `1.0` (maximum). Settings persist for
the session and reset on page reload.

#### Notification audio (static — these sounds are global)

| API | Args | Returns |
| --- | --- | --- |
| `ExotelWebClient.setAudioOutputVolume` | `audioElementName` (string), `value` (0.0–1.0) | None |
| `ExotelWebClient.getAudioOutputVolume` | `audioElementName` (string) | Current volume |

Valid `audioElementName` values: `"ringtone"` (incoming ringtone), `"ringbacktone"` (outgoing
ringback), `"dtmftone"` (keypad tones), `"beeptone"` (system beeps).

```js
exotelSDK.ExotelWebClient.setAudioOutputVolume("ringtone", 0.5);
const volume = exotelSDK.ExotelWebClient.getAudioOutputVolume("ringtone");
```

#### Call audio (per account — not static)

| API | Args | Returns |
| --- | --- | --- |
| `exWebClient.setCallAudioOutputVolume` | `value` (0.0–1.0) | None |
| `exWebClient.getCallAudioOutputVolume` | None | Current volume |

```js
exWebClient.setCallAudioOutputVolume(0.8);
const callVolume = exWebClient.getCallAudioOutputVolume();
```

### 6.20 WebSocket disconnect event

When the SIP WebSocket transport closes or fails, the SDK reports state
`"websocket_disconnected"` on `RegisterEventCallBack`.

```js
function RegisterEventCallBack(state, phone, error) {
  if (state === 'websocket_disconnected') {
    console.log('SDK websocket disconnected', phone, error);
  }
}
```

### 6.21 Ring tone control

The SDK plays a ring tone on an incoming call. Since v3.0.13/3.0.14 the duration is configurable
and the application can take over when the ring starts.

All six are **instance** methods, not static, and are available only after `initWebrtc` has run.
Called before that, the setters log a warning and return `false`, and the getters return the
defaults (`30` and `true`).

| API | Args | Returns | Description |
| --- | --- | --- | --- |
| `exWebClient.setRingingDuration` | `seconds` (number or numeric string) | `true` on success, `false` if rejected | How long the ring tone plays. Default 30 sec. |
| `exWebClient.getRingingDuration` | None | number (seconds) | Configured ringing duration. |
| `exWebClient.setRingToneAutoStart` | `enabled` (boolean, or `"true"`/`"false"`) | `true` on success, `false` if rejected | Whether the SDK auto-plays the ring tone on an incoming session. Enabled by default. |
| `exWebClient.getRingToneAutoStart` | None | boolean | Current auto-start setting. |
| `exWebClient.startRingTone` | None | None | Start the ring tone. Never blocked by `setRingToneAutoStart(false)`. |
| `exWebClient.stopRingTone` | None | None | Stop the ring tone and cancel its auto-stop timer. |

> **Shared process-wide, not per account.** The ring tone audio element and its state (duration
> and auto-start) are global. In a multi-account page, setting them on one `ExotelWebClient`
> applies to every account, and one `stopRingTone()` stops the single shared ring.

#### Ringing duration

The default is **30 seconds**; earlier versions capped the ring at a hardcoded ~15 seconds.

A number or a numeric string is accepted, which helps when the value comes from a config blob or
an input field. Any other type (`true`, `[5]`, `""`, `null`, non-numeric text) and any value
`<= 0` is rejected: the call returns `false`, logs an error, and the previous duration is kept.

Changing the duration mid-ring reschedules the auto-stop against time already spent ringing — it
can shorten a ring in progress but never extend it past the new total. A duration shorter than
the elapsed ring time stops the ring immediately.

```js
// After initWebrtc
exWebClient.setRingingDuration(45);      // true — ring auto-stops after 45s
exWebClient.getRingingDuration();        // 45
exWebClient.setRingingDuration("45");    // numeric string also accepted

exWebClient.setRingingDuration(0);       // false; duration unchanged
exWebClient.setRingingDuration(-5);      // false; duration unchanged
```

#### Starting and stopping

The SDK starts the ringtone automatically on an incoming SIP INVITE. You can also drive it
yourself, for example to align ringing with your own UI or push-notification sync.

You do **not** need `stopRingTone()` on the normal transitions: the SDK stops the ring itself
when the call is answered or terminated (answered, hung up, or cancelled by the caller), and in
any case it stops once the configured duration elapses. `stopRingTone()` is for stopping earlier
on an application signal — gating logic deciding a call is stale, or the UI dismissing it. It is
safe to call when nothing is ringing.

A browser may reject the first `play()` on a page that has not yet seen a user gesture. The SDK
retries every 500 ms until the ring starts or is stopped, so a call arriving before any
interaction still rings once the page becomes eligible.

```js
exWebClient.startRingTone();
exWebClient.stopRingTone();
```

#### Gating the automatic ring

By default the SDK rings as soon as an incoming session arrives. An app that must first
reconcile its own state — say, waiting for a push notification and the SIP INVITE to agree on
the same AppServer call — disables auto-start and rings when ready. Disabling auto-start never
blocks an explicit `startRingTone()`; it governs only the automatic start.

Booleans and the strings `"true"`/`"false"` (case-insensitive) are accepted — config layers
commonly supply strings. Any other value is rejected and the previous setting kept.

```js
// During setup, after initWebrtc
exWebClient.setRingToneAutoStart(false);

function CallListenerCallback(callObj, eventType, phone) {
  if (eventType === 'incoming') {
    // The SDK has NOT started the ring tone.
    // Ring only once our own checks pass.
    if (isCallConfirmedByPush(callObj)) {
      exWebClient.startRingTone();
    }
  }
}
```

### 6.22 Disabling built-in logging

`setEnableConsoleLogging` is **static** on `ExotelWebClient` and controls all built-in logging —
console output, SDK logs and SIP.js logs.

```js
exotelSDK.ExotelWebClient.setEnableConsoleLogging(false);
```

- Default: logging is enabled (`true`).
- When `false`, SDK logs, SIP.js logs and internal logger callbacks are all suppressed.
- Call it **before** initializing or registering the client so no logs are printed.

## 7. Messages — sipAccountInfo reference

| Field | Description |
| --- | --- |
| `authUser` | SIP username to register |
| `userName` | Unique map index for phones; same as `authUser` |
| `displayName` | Local display name on the dialer |
| `secret` | SIP password |
| `sipdomain` | SIP public domain |
| `security` | `"wss"` / `"ws"` — typically `"wss"` |
| `port` | 443 for WebSockets |
| `sipUri` | Complete SIP URI (constructed internally; leave blank) |
| `contactHost` | IP address to contact back (found via STUN; leave blank) |

## 8. Integration with Exotel APIs

See the [Make a Call API](https://developer.exotel.com/api/make-a-call-api). For example, to
call a web client from a PSTN phone:

```bash
curl -s -X POST https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_account_sid>/Calls/connect \
  -d "From=<sip_user_id>" \
  -d "CallerId=<caller_id>" \
  -d "To=<phone number>"
```

## 9. Support

Write to hello@exotel.in for any support required with integration.
