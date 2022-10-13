
module.exports = {
//Register APIs
DoRegister: require('./webrtc-client-sdk/api/registerAPI/RegisterListener'),
UnRegister: require('./webrtc-client-sdk/api/registerAPI/RegisterListener'),
//Call Apis
Call: require('./webrtc-client-sdk/api/callAPI/Call'),
CallDetails: require('./webrtc-client-sdk/api/callAPI/CallDetails.js'),
//Diagnostics APIs
DoDiagnostics: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsSpeakerTestStart: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsSpeakerTestStopSuccess: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsSpeakerTestStopFailure: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsSpeakerTestStop: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsMicTestStart: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsMicTestStop: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsMicTestStopSuccess: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
DiagnosticsMicTestStopFailure: require('./webrtc-client-sdk/api/omAPI/DiagnosticsListener'),
AmeyoWebrtcTroubleshooterFSM:require('./webrtc-client-sdk/api/omAPI/DiagnosticsFSM'),
//Listeners to stack
ExotelWebClient: require('./webrtc-client-sdk/listeners/ExWebClient'),
ExotelVoiceClientListener: require('./webrtc-client-sdk/listeners/ExotelVoiceClientListener'),
SessionListener: require('./webrtc-client-sdk/listeners/SessionListeners'),
//Callbacks for app
CallListener: require('./webrtc-client-sdk/listeners/CallListener'),
CallController: require('./webrtc-client-sdk/listeners/CallCtrlerDummy'),
callbacks:require('./webrtc-client-sdk/listeners/Callback'),
registerCallback:require('./webrtc-client-sdk/listeners/Callback'),
phoneInstance:require('./webrtc-client-sdk/listeners/Callback'),
sessionCallback:require('./webrtc-client-sdk/listeners/Callback'),
diagnosticsCallback:require('./webrtc-client-sdk/listeners/Callback'),
timerSession:require('./webrtc-client-sdk/listeners/Callback'),
module: {
    rules: [
        {
            test: /\.(js)$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }
    ],
}
}

/* SymLink
$ npm link 
npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN webrtc-sdk@1.0.0 No repository field.

up to date in 1.097s
found 0 vulnerabilities

/usr/local/lib/node_modules/webrtc-sdk -> /home/exotel/exotel_code/gaudim/webrtc-sdk
*/
