"use strict";
exports.__esModule = true;
var DiagnosticsListener_1 = require("./DiagnosticsListener");
var Callback_1 = require("../../listeners/Callback");
var AmeyoWebrtcTroubleshooterFSM = /** @class */ (function () {
    function AmeyoWebrtcTroubleshooterFSM() {
        var _this = this;
        this.deviceTestingFSM = new window.FSM("INITIAL_STATE", { name: "Device testing FSM" });
        this.networkTestingFSM = new window.FSM("INITIAL_STATE", { name: "Network testing FSM" });
        this.addDeviceTestingFSMTransitions = function () {
            _this.deviceTestingFSM.addTransition('MICROPHONE_TEST_STARTING', 'INITIAL_STATE', null, 'MICROPHONE_TEST_STARTED', _this.startMicTest);
            _this.deviceTestingFSM.addTransition('MICROPHONE_TEST_PASS', 'MICROPHONE_TEST_STARTED', null, 'MICROPHONE_TEST_PASSED', _this.microphoneSuccessCallback);
            _this.deviceTestingFSM.addTransition('MICROPHONE_TEST_FAIL', 'MICROPHONE_TEST_STARTED', null, 'MICROPHONE_TEST_FAILED', _this.microphoneFailureCallback);
            _this.deviceTestingFSM.addTransition('PROCEED', 'MICROPHONE_TEST_PASSED', null, 'MICROPHONE_TEST_DONE', _this.microphoneTestDoneCallback);
            _this.deviceTestingFSM.addTransition('PROCEED', 'MICROPHONE_TEST_FAILED', null, 'MICROPHONE_TEST_DONE', _this.microphoneTestDoneCallback);
            _this.deviceTestingFSM.addTransition('SPEAKER_TEST_STARTNG', 'MICROPHONE_TEST_DONE', null, 'SPEAKER_TEST_STARTED', _this.startSpeakerTest);
            _this.deviceTestingFSM.addTransition('SPEAKER_TEST_PASS', 'SPEAKER_TEST_STARTED', null, 'SPEAKER_TEST_PASSED', _this.speakerSuccessCallback);
            _this.deviceTestingFSM.addTransition('SPEAKER_TEST_FAIL', 'SPEAKER_TEST_STARTED', null, 'SPEAKER_TEST_FAILED', _this.speakerFailureCallback);
            _this.deviceTestingFSM.addTransition('PROCEED', 'SPEAKER_TEST_PASSED', null, 'SPEAKER_TEST_DONE', _this.speakerTestDoneCallback);
            _this.deviceTestingFSM.addTransition('PROCEED', 'SPEAKER_TEST_FAILED', null, 'SPEAKER_TEST_DONE', _this.speakerTestDoneCallback);
        };
        this.startMicTest = function () {
            Callback_1.ameyoWebRTCTroubleshooter.startMicTest();
        };
        this.startSpeakerTest = function () {
            Callback_1.ameyoWebRTCTroubleshooter.startSpeakerTest();
        };
        this.microphoneSuccessCallback = function () {
            _this.deviceTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.microphoneTestSuccessEvent();
        };
        this.microphoneFailureCallback = function () {
            _this.deviceTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.microphoneTestFailedEvent();
        };
        this.microphoneTestDoneCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.microphoneTestDoneEvent();
        };
        this.speakerSuccessCallback = function () {
            _this.deviceTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.speakerTestSuccessEvent();
        };
        this.speakerFailureCallback = function () {
            _this.deviceTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.speakerTestFailedEvent();
        };
        this.speakerTestDoneCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.speakerTestDoneEvent();
        };
        this.addNetworkTestingFSMTransitions = function () {
            _this.networkTestingFSM.addTransition('WS_TEST_STARTING', 'INITIAL_STATE', null, 'WS_TEST_STARTED', _this.startWebsocketTesting);
            _this.networkTestingFSM.addTransition('WS_TEST_PASS', 'WS_TEST_STARTED', null, 'WS_TEST_PASSED', _this.wsPassCallback);
            _this.networkTestingFSM.addTransition('WS_TEST_FAIL', 'WS_TEST_STARTED', null, 'WS_TEST_FAILED', _this.wsFailCallback);
            _this.networkTestingFSM.addTransition('PROCEED', 'WS_TEST_PASSED', null, 'WS_TEST_DONE', _this.wsTestDoneCallback);
            _this.networkTestingFSM.addTransition('PROCEED', 'WS_TEST_FAILED', null, 'WS_TEST_DONE', _this.wsTestDoneCallback);
            _this.networkTestingFSM.addTransition('USER_REG_TEST_STARTING', 'WS_TEST_DONE', null, 'USER_REG_TEST_STARTED', null);
            _this.networkTestingFSM.addTransition('USER_REG_TEST_PASS', 'USER_REG_TEST_STARTED', null, 'USER_REG_TEST_PASSED', _this.userRegPassCallback);
            _this.networkTestingFSM.addTransition('USER_REG_TEST_FAIL', 'USER_REG_TEST_STARTED', null, 'USER_REG_TEST_FAILED', _this.userRegFailCallback);
            _this.networkTestingFSM.addTransition('PROCEED', 'USER_REG_TEST_PASSED', null, 'USER_REG_TEST_DONE', _this.userRegDoneCallback);
            _this.networkTestingFSM.addTransition('PROCEED', 'USER_REG_TEST_FAILED', null, 'USER_REG_TEST_DONE', _this.userRegDoneCallback);
            _this.networkTestingFSM.addTransition('UDP_TEST_STARTING', 'USER_REG_TEST_DONE', null, 'UDP_TEST_STARTED', _this.startNetworkProtocolTesting);
            _this.networkTestingFSM.addTransition('UDP_TEST_COMPLETE', 'UDP_TEST_STARTED', null, 'UDP_TEST_COMPLETED', _this.udpCompletedCallback);
            _this.networkTestingFSM.addTransition('TCP_TEST_STARTING', 'UDP_TEST_COMPLETED', null, 'TCP_TEST_STARTED', null);
            _this.networkTestingFSM.addTransition('TCP_TEST_COMPLETE', 'TCP_TEST_STARTED', null, 'TCP_TEST_COMPLETED', _this.tcpCompletedCallback);
            _this.networkTestingFSM.addTransition('IPV6_TEST_STARTING', 'TCP_TEST_COMPLETED', null, 'IPV6_TEST_STARTED', null);
            _this.networkTestingFSM.addTransition('IPV6_TEST_COMPLETE', 'IPV6_TEST_STARTED', null, 'IPV6_TEST_COMPLETED', _this.ipv6CompletedCallback);
            _this.networkTestingFSM.addTransition('HOST_CON_TEST_STARTING', 'IPV6_TEST_COMPLETED', null, 'HOST_CON_TEST_STARTED', null);
            _this.networkTestingFSM.addTransition('HOST_CON_TEST_COMPLETE', 'HOST_CON_TEST_STARTED', null, 'HOST_CON_TEST_COMPLETED', _this.hostCandidateCompletedCallback);
            _this.networkTestingFSM.addTransition('REFLEX_CON_TEST_STARTING', 'HOST_CON_TEST_COMPLETED', null, 'REFLEX_CON_TEST_STARTED', null);
            _this.networkTestingFSM.addTransition('REFLEX_CON_TEST_COMPLETE', 'REFLEX_CON_TEST_STARTED', null, 'REFLEX_CON_TEST_COMPLETED', _this.reflexCandidateCompletedCallback);
        };
        this.startNetworkProtocolTesting = function () {
            Callback_1.ameyoWebRTCTroubleshooter.startNetworkProtocolTest();
        };
        this.startWebsocketTesting = function () {
            Callback_1.ameyoWebRTCTroubleshooter.startWsTesting();
        };
        this.wsPassCallback = function () {
            _this.networkTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.wsConTestSuccessEvent();
        };
        this.wsFailCallback = function () {
            _this.networkTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.wsConTestFailedEvent();
        };
        this.wsTestDoneCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.wsConTestDoneEvent();
        };
        this.userRegPassCallback = function () {
            _this.networkTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.userRegTestSuccessEvent();
        };
        this.userRegFailCallback = function () {
            _this.networkTestingFSM.sendEvent('PROCEED', null);
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.userRegTestFailedEvent();
        };
        this.userRegDoneCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.userRegTestDoneEvent();
            _this.networkTestingFSM.sendEvent('UDP_TEST_STARTING', null);
        };
        this.udpCompletedCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.udpTestCompletedEvent();
        };
        this.tcpCompletedCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.tcpTestCompletedEvent();
        };
        this.ipv6CompletedCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.ipv6TestCompletedEvent();
        };
        this.hostCandidateCompletedCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.hostCandidateTestCompletedEvent();
        };
        this.reflexCandidateCompletedCallback = function () {
            DiagnosticsListener_1.webrtcTroubleshooterEventBus.reflexCandidateTestCompletedEvent();
        };
        this.sendDeviceTestingEventForFSM = function (event) {
            _this.deviceTestingFSM.sendEvent(event.toUpperCase(), null);
        };
        this.sendNetworkTestingEventForFSM = function (event) {
            _this.networkTestingFSM.sendEvent(event.toUpperCase(), null);
        };
        this.addDeviceTestingFSMTransitions();
        this.addNetworkTestingFSMTransitions();
        window.deviceTestingFSM = this.deviceTestingFSM;
        window.networkTestingFSM = this.networkTestingFSM;
        window.sendDeviceTestingEvent = this.sendDeviceTestingEventForFSM;
        window.sendNetworkTestingEvent = this.sendNetworkTestingEventForFSM;
    }
    AmeyoWebrtcTroubleshooterFSM.prototype.restFSM = function () {
        if (this.deviceTestingFSM.currentState === 'SPEAKER_TEST_PASSED' || this.deviceTestingFSM.currentState === 'SPEAKER_TEST_STARTED')
            Callback_1.ameyoWebRTCTroubleshooter.stopSpeakerTesttone();
        this.deviceTestingFSM = new window.FSM("INITIAL_STATE", { name: "Device testing FSM" });
        this.networkTestingFSM = new window.FSM("INITIAL_STATE", { name: "Network testing FSM" });
        this.addDeviceTestingFSMTransitions();
        this.addNetworkTestingFSMTransitions();
        window.deviceTestingFSM = this.deviceTestingFSM;
        window.networkTestingFSM = this.networkTestingFSM;
    };
    return AmeyoWebrtcTroubleshooterFSM;
}());
var ameyoWebrtcTroubleshooterFSMInstance = new AmeyoWebrtcTroubleshooterFSM();
exports["default"] = ameyoWebrtcTroubleshooterFSMInstance;
