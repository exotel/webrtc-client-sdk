Changelog

## v3.0.16 15 September, 2026
-[VST-1150] Refactor callback handling in webrtc-client-sdk to include error parameter in session callbacks. Update ExWebClient to trigger session callbacks with error information on WebSocket disconnect. Modify SIPJSPhone to improve error message handling during disconnection events.
-[VST-2187] Added auto-retry for the WebRTC connection: enableAutoRetry()/disableAutoRetry() toggle the policy (enabled by default); on a transport failure, or a silent network drop surfaced as a registration-expiry "unregistered" event, the SDK automatically re-registers after a fixed 5s delay, repeating until it succeeds or auto-retry is disabled
-[VST-2187] disableAutoRetry() now also stops a retry that is already armed for the current session, not just future ones

## v3.0.14 08 September, 2026
-[VST-1782] Expose setRingingDuration, getRingingDuration on ExotelWebClient (default ring 30 sec)
-[VST-2016] Expose startRingTone and stopRingTone on ExotelWebClient
-[VST-2016] Expose setRingToneAutoStart, getRingToneAutoStart on ExotelWebClient; enabled by default. When disabled, the SDK does not auto-play the ring tone on an incoming session, so an app can gate ringing on push/SIP sync and call startRingTone() itself. An explicit startRingTone() is never blocked
-BEHAVIOUR CHANGE: registerLoggerCallback now receives the real severity ("log", "info", "warn", "error"); it previously received "log" for every message
-BEHAVIOUR CHANGE: default ring duration is 30 sec, up from the previous hardcoded ~15 sec cap
-Sample app: bundled SDK (demo-non-npm/dist, demo-non-npm/SDK/exotelsdk-3.0.14.tar.gz) rebuilt from client-sdk v3.0.14 / core-sdk v3.0.12; demo-npm pinned to webrtc-client-sdk ^3.0.14

## v3.0.12 14 August, 2026
-[VST-1150] Expose websocket close event to consumers.

## v3.0.11 07 May, 2026
-[VST-1584]Updated webrtc-core-sdk to v3.0.11 with dtmf tone fix


## v3.0.10 01 April, 2026
-[VST-1584]Updated webrtc-core-sdk to v3.0.10 with stack trace logging in error method


v3.0.9 27 March, 2026
-[VST-1577] Removed the same-device-ID guard from replaceSenderTrack.

v3.0.8 30 December, 2025
-[VST-1306] mute/unmute issue fix for preffered codec

v3.0.7 30 December, 2025
-[VST-1306] hold unhold issue fix

## v3.0.6 19 December, 2025
-[VST-1269] fixing noise suppression bug and added wss transport in contact params

## v3.0.5 16 December, 2025
-[VST-1292] commenting fetchpublicip in initwebrtc as its causing race condition

## v3.0.4 16 September, 2025
-[VST-1093] Enabled support for noise suppression

## v3.0.3 15 September, 2025
-[VST-1063] granular control over different audio streams, added static registerLogger method for logger callback registration

## v3.0.2 28 August, 2025
-[VST-1063] prevent exotel / sipjs from throwing logs in the console based on a flag, added missing iceconnectionstate in session event callback, make auto audio device change handling configurable and fixing Missing sent_request event in registerCallback

## v3.0.0 07 July, 2025
-[VST-991] Enabled Mutli-Webrtc accounts in the same tab

## v1.0.23 10 June, 2025
-[VST-1011] Increasing Registration Expiry from 60s to 300s
## v1.0.22 04 April, 2025
-[VST-973] get and download logs , log refactoring and mute functionality enhancement

## v1.0.21 05 March, 2025
-[VST-954] Added custom sip codes and reason phrase for when agent are disconnecting and sdk is disconnecting call.

## v1.0.20 28 January, 2025
-[VST-940] Added checks for X-Exotel-Callsid, Call-ID, and LegSid headers in onRecieveInvite.

## v1.0.19 09 January, 2025
-[VST-865] Added option in websdk to select the codec preference

## v1.0.16 21 November, 2024
-[VST-885] Retry Support for SDK Websocket Connection

## v1.0.14 12 September, 2024
-[VST-807] Added call details with callsid and sip headers

## v1.0.11 26 August 2024
- upgraded sdk to 1.0.11, Added real-time selection for microphone and speaker devices, and implemented callbacks to notify the application when a device change occurs.

# v1.0.10 24 March 2024
- upgrade sdk to 1.0.10 with send DTMF support 

# v1.0.8 26 Feb 2024
- upgrade sdk 1.0.9

# v1.0.7 16 Feb 2024
- upgrade sdk having checkclientStatus API