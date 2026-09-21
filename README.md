# Exotel Voice WebSDK

The Exotel Voice WebSDK adds VOIP calling to a web application. This is the **main repository**:
the SDK source, the sample applications, and the integration guides all live here, and releases
are published from here.

You need an Exotel account to use VOIP calling. Contact Exotel support for a demo and account
creation, or write to hello@exotel.in.

**Current release: client-sdk v3.0.16 / core-sdk v3.0.14.** See [Changelog.md](Changelog.md) and
[releases](https://github.com/exotel/webrtc-client-sdk/releases).

## Product documentation

| Guide | Link |
| --- | --- |
| Client WebSDK | https://docs.exotel.com/voice-apis/client-websdk |
| Subscriber Management API | https://docs.exotel.com/voice-apis/-qbf-subscriber-management-api |

## Repository layout

| Path | What it is |
| --- | --- |
| [`webrtc-client-sdk/`](webrtc-client-sdk) | The client SDK — `@exotel-npm-dev/webrtc-client-sdk`. The public API applications integrate against. |
| [`webrtc-core-sdk/`](webrtc-core-sdk) | The core SDK — `@exotel-npm-dev/webrtc-core-sdk`. SIP/WebRTC layer the client SDK builds on. |
| [`demo-npm/`](demo-npm) | React sample app consuming the SDK from npm, plus the full npm integration guide. |
| [`demo-non-npm/`](demo-non-npm) | Plain HTML/JS sample app using the pre-built bundle, plus the full bundle integration guide. |
| [`assets/sounds/`](assets/sounds) | Ring/beep/DTMF tones shipped with the bundle. |

## Integration guides

The complete integration guide and API reference lives with each sample app. Pick the one
matching how you consume the SDK:

| Guide | Use when | Docs |
| --- | --- | --- |
| **npm** | You install `@exotel-npm-dev/webrtc-client-sdk` from npm and bundle it yourself | [demo-npm/README.md](demo-npm/README.md) |
| **Bundle (non-npm)** | You drop `exotelsdk.js` into a page with a `<script>` tag | [demo-non-npm/README.md](demo-non-npm/README.md) |

Both cover the same SDK and are self-contained: getting started, supported browsers,
initialization, register/unregister, call handling (accept, hangup, mute, hold, DTMF), multitab
sessions, device and network diagnostics, auto-reconnect and auto-retry, readiness checks, audio
device selection, noise suppression, logging, volume control, ring tone control and the
`sipAccountInfo` reference.

### Jump to a topic

| Topic | npm | non-npm |
| --- | --- | --- |
| Initialize the library | [link](demo-npm/README.md#61-initialize-the-library) | [link](demo-non-npm/README.md#61-initialize-the-library) |
| Register / unregister | [link](demo-npm/README.md#64-register-the-sip-phone) | [link](demo-non-npm/README.md#64-register-the-sip-phone) |
| Receive / accept calls | [link](demo-npm/README.md#66-receive-calls) | [link](demo-non-npm/README.md#66-receive-calls) |
| Multitab scenarios | [link](demo-npm/README.md#612-multitab-scenarios) | [link](demo-non-npm/README.md#612-multitab-scenarios) |
| Diagnostics | [link](demo-npm/README.md#613-device-and-network-diagnostics) | [link](demo-non-npm/README.md#613-device-and-network-diagnostics) |
| Audio device selection | [link](demo-npm/README.md#616-audio-device-selection) | [link](demo-non-npm/README.md#616-audio-device-selection) |
| Logger callback | [link](demo-npm/README.md#618-logger-callback) | [link](demo-non-npm/README.md#618-logger-callback) |
| Ring tone control | [link](demo-npm/README.md#621-ring-tone-control) | [link](demo-non-npm/README.md#621-ring-tone-control) |
| `sipAccountInfo` reference | [link](demo-npm/README.md#7-messages--sipaccountinfo-reference) | [link](demo-non-npm/README.md#7-messages--sipaccountinfo-reference) |

## Running the sample apps

### demo-npm

Configure `src/phone.json`, then:

```bash
cd demo-npm && npm install && npm start
```

Runs on `https://localhost:3000`.

### demo-non-npm

Configure `phone.js`, then serve over HTTPS — WebRTC requires a secure context:

```bash
cd demo-non-npm
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
http-server -S -C cert.pem -K key.pem -p 8080 -c-1
```

The generated `key.pem` / `cert.pem` are local dev material and are gitignored — never commit
them. The bundled SDK lives in `demo-non-npm/dist/`; `demo-non-npm/SDK/exotelsdk-3.0.16.tar.gz`
is the same build packaged for distribution. Extract it over `dist/` to refresh the bundle, and
keep the `.wav` files that ship alongside `exotelsdk.js` — the bundle loads them by name.

## Building and releasing the SDK

```bash
cd webrtc-client-sdk
make build          # build against the published core-sdk
make build-local    # build against the local ../webrtc-core-sdk instead
make tar            # produce exotelsdk-<version>.tar.gz from dist/
make publish        # build and npm publish
```

`dist/exotelsdk.js` is generated along with the `.wav` files. Bump the version in
`package.json`, add the entry to [Changelog.md](Changelog.md), then tag and publish a release
here.

> **Ringtone not playing after a build?** Remove the `.wav` files from `dist/` and copy the ones
> from [`assets/sounds/`](assets/sounds) in their place.

## Support

Write to hello@exotel.in for any support required with integration.
