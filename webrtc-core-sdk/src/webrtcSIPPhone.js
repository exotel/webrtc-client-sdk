/**
 * Communication from Webrtc flows and feature handling for web RTC as WebRTC Phone Interface
 * 
 */

import coreSDKLogger from './coreSDKLogger';
import SIPJSPhone from './sipjsphone';
import webrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';

var phone = null;
let webrtcSIPEngine = null;
const logger = coreSDKLogger;

function sendWebRTCEventsToFSM(eventType, sipMethod) {
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM(eventType, sipMethod);
}

let sipAccountInfoData = {};

export const webrtcSIPPhone = {


	isConnected: () => {
		var status = phone.getStatus();
		if (status != "offline") {
			return true;
		} else {
			return false;
		}
	},

	sendDTMFWebRTC: (dtmfValue) => {
		phone.sipSendDTMF(dtmfValue);
	},

	registerWebRTCClient: (sipAccountInfo, handler) => {
		sipAccountInfoData = sipAccountInfo;
		phone.init(() => {
			phone.loadCredentials(sipAccountInfo);
			if (webrtcSIPPhone.getWebRTCStatus() == "offline") {
				if (handler != null)
					if (handler.onFailure)
						handler.onFailure();
			} else {
				if (handler != null)
					if (handler.onResponse)
						handler.onResponse();
			}
		});

	},


	configureWebRTCClientDevice: (handler) => {
		phone.registerCallBacks(handler);
	},

	setAuthenticatorServerURL(serverURL) {
		// Nothing to do here
	},

	toggleSipRegister: () => {
		phone.resetRegisterAttempts();
		phone.sipToggleRegister();
	},

	webRTCMuteUnmute: (isMuted) => {
		phone.sipToggleMic();
	},

	getMuteStatus: () => {
		return phone.getMicMuteStatus();
	},

	muteAction: (bMute) => {
		phone.sipMute(bMute);
	},

	holdAction: (bHold) => {
		phone.sipHold(bHold);
	},

	holdCall: () => {
		phone.holdCall();
	},

	pickCall: () => {
		phone.pickPhoneCall();

		webrtcSIPPhoneEventDelegate.onPickCall();
	},

	rejectCall: () => {
		phone.sipHangUp();

		webrtcSIPPhoneEventDelegate.onRejectCall();
	},

	reRegisterWebRTCPhone: () => {
		phone.reRegister();
	},


	playBeepTone: () => {
		phone.playBeep();

	},

	sipUnRegisterWebRTC: () => {
		phone.sipUnRegister();
	},

	startWSNetworkTest: () => {
		this.testingMode = true;
		phone.sipRegister();
	},

	stopWSNetworkTest: () => {
		phone.sipUnRegister();
	},



	registerPhone: (engine, delegate) => {
		webrtcSIPEngine = engine;
		switch (engine) {
			case "sipjs":
				phone = SIPJSPhone;
				break;
			default:
				break;
		}
		webrtcSIPPhoneEventDelegate.registerDelegate(delegate);
		webrtcSIPPhoneEventDelegate.onRegisterWebRTCSIPEngine(engine);


	},

	getWebRTCStatus: () => {
		var status = phone.getStatus();
		return status;
	},

	disconnect: () => {
		if (phone) {
			phone.disconnect();
		}
	},

	connect: () => {
		phone.connect();
	},

	getSIPAccountInfo() {
		return sipAccountInfoData;
	},
	getWebRTCSIPEngine() {
		return webrtcSIPEngine;
	},

	/* NL Addition - Start */
	getSpeakerTestTone() {
		try {
			return SIPJSPhone.getSpeakerTestTone()
		} catch (e) {
			logger.log("getSpeakerTestTone: Exception ", e)
		}
	},

	getWSSUrl() {
		try {
			return SIPJSPhone.getWSSUrl()
		} catch (e) {
			logger.log("getWSSUrl: Exception ", e)
		}
	},
	/* NL Addition - End */

	getTransportState() {
		try {
			return SIPJSPhone.getTransportState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	},

	getRegistrationState() {
		try {
			return SIPJSPhone.getRegistrationState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	},

	changeAudioInputDevice(deviceId, onSuccess, onError) {
		logger.log(`webrtcSIPPhone:changeAudioInputDevice  entry`);
		SIPJSPhone.changeAudioInputDevice(deviceId, onSuccess, onError);
	},

	changeAudioOutputDevice(deviceId, onSuccess, onError) {
		logger.log(`webrtcSIPPhone:changeAudioOutputDevice entry`);
		SIPJSPhone.changeAudioOutputDevice(deviceId, onSuccess, onError);
	},

	setPreferredCodec(codecName) {
		logger.log("webrtcSIPPhone:setPreferredCodec entry");
		SIPJSPhone.setPreferredCodec(codecName);
	},

	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback) {
		logger.log(`webrtcSIPPhone:registerAudioDeviceChangeCallback  entry`);
		SIPJSPhone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback);
	},
	getLogger() {
		return coreSDKLogger;
	}

};


export default webrtcSIPPhone;
