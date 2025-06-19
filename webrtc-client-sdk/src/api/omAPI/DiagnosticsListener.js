import { getLogger } from "@exotel-npm-dev/webrtc-core-sdk";
import { diagnosticsCallback } from '../../listeners/Callback';
import { ameyoWebRTCTroubleshooter } from './Diagnostics';

const logger = getLogger();


export function initDiagnostics(setDiagnosticsReportCallback, keyValueSetCallback) {
    if (!keyValueSetCallback || !setDiagnosticsReportCallback) {
        logger.log("Callbacks are not set")
        return
    }
    diagnosticsCallback.setKeyValueCallback(keyValueSetCallback);
    diagnosticsCallback.setDiagnosticsReportCallback(setDiagnosticsReportCallback);
    let version = ameyoWebRTCTroubleshooter.getBrowserData();
    diagnosticsCallback.keyValueSetCallback('browserVersion', 'ready', version)
    return;
}

export function closeDiagnostics() {
    diagnosticsCallback.setKeyValueCallback(null);
    diagnosticsCallback.setDiagnosticsReportCallback(null);
    return;
}

export function startSpeakerDiagnosticsTest() {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    logger.log("Request to startSpeakerTest:\n");
    ameyoWebRTCTroubleshooter.startSpeakerTest()
    return;
}

export function stopSpeakerDiagnosticsTest(speakerTestResponse) {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */

    logger.log("Request to stopSpeakerTest - Suuccessful Test:\n");
    if (speakerTestResponse == 'yes') {
        ameyoWebRTCTroubleshooter.stopSpeakerTesttoneWithSuccess()
    } else if (speakerTestResponse == 'no') {
        ameyoWebRTCTroubleshooter.stopSpeakerTesttoneWithFailure()
    } else {
        ameyoWebRTCTroubleshooter.stopSpeakerTest()
    }
    return;
}

export function startMicDiagnosticsTest() {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    logger.log("Request to startMicTest:\n");
    ameyoWebRTCTroubleshooter.startMicTest()
    return;
}

export function stopMicDiagnosticsTest(micTestResponse) {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    logger.log("Request to stopMicTest - Successful Test:\n");
    if (micTestResponse == 'yes') {
        ameyoWebRTCTroubleshooter.stopMicTestSuccess()
    } else if (micTestResponse == 'no') {
        ameyoWebRTCTroubleshooter.stopMicTestFailure()
    } else {
        ameyoWebRTCTroubleshooter.stopMicTest()
    }
    return;
}

/**
 * Function to troubleshoot the environment
 */
export function startNetworkDiagnostics() {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    logger.log("Request to start network diagnostics:\n");
    ameyoWebRTCTroubleshooter.startWSAndUserRegistrationTest();
    return;
}

/**
 * Function to troubleshoot the environment
 */
export function stopNetworkDiagnostics() {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    logger.log("Request to stop network diagnostics:\n");
    return;
}

export class DiagnosticsListener {
    constructor(diagnosticsCallback) {
        this.diagnosticsCallback = diagnosticsCallback;
    }

    onDiagnosticsEvent(event) {
        logger.log("DiagnosticsListener: onDiagnosticsEvent", event);
        this.diagnosticsCallback.triggerCallback(event);
    }
}