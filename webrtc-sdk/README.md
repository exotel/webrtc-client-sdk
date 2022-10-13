# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm run build` 
	Creates the node_modules directory.
        No bundling.
        If you are publishing update the version in package.json

### `npm publish --registry=<registry_path>`
        Publish the SDK in registry"
        npm install --registry=https://verdaccio.nouveau-labs.in/ @exotel/webrtc-sdk-diagnostics

## Operations
### Import the Entry Points
        The ExotelWebClient object can be imported as follows.
        import { ExotelWebClient } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/ExWebClient';

### Call Flow 
        * Initialise: Pass the sip account dictionary and callbacks        
                exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback)        
                        Response comes in RegisterEventCallBack
        * Register
                exWebClient.DoRegister();
        * UnRegister
                exWebClient.UnRegister();
        * Receive Callback
                - Event comes in  CallListenerCallback
                - Retrieve call object: call = exWebClient.getCall()
                        - Accept Call
                                call.Answer()
                        - Reject Call
                                call.Hangup()
                        - Mute Calls
                                call.Mute()
                        - Hold Calls
                                call.Hold()
### Diagnostics Flow
        * Initialise diagnostics: Pass keyValue and report Callbacks.
                exWebClient.initDiagnostics(diagnosticsReportCallback, diagnosticsKeyValueCallback)
        * End Diagnostics
                exWebClient.closeDiagnostics()
        * Speaker Diagnostics
                exWebClient.startSpeakerDiagnosticsTest()
                exWebClient.startSpeakerDiagnosticsTest()
                exWebClient.stopSpeakerDiagnosticsTest('yes')
                exWebClient.stopSpeakerDiagnosticsTest('no')
        * Mic Diagnostics
                exWebClient.startMicDiagnosticsTest()
                exWebClient.stopMicDiagnosticsTest()
                exWebClient.stopMicDiagnosticsTest('yes')
                exWebClient.stopMicDiagnosticsTest('no')
        * Network Diagnostics
                exWebClient.startNetworkDiagnostics()
                exWebClient.stopNetworkDiagnostics()

