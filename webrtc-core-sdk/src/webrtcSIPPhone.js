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
	logger.log("webrtcSIPPhone: sendWebRTCEventsToFSM : ",eventType,sipMethod);
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM(eventType, sipMethod);
}

let sipAccountInfoData = {};

export const webrtcSIPPhone = {


	isConnected: () => {
		logger.log("webrtcSIPPhone: isConnected entry");
		var status = phone.getStatus();
		if (status != "offline") {
			return true;
		} else {
			return false;
		}
	},

	sendDTMFWebRTC: (dtmfValue) => {
		logger.log("webrtcSIPPhone: sendDTMFWebRTC : ",dtmfValue);
		phone.sipSendDTMF(dtmfValue);
	},

	registerWebRTCClient: (sipAccountInfo, handler) => {
		logger.log("webrtcSIPPhone: registerWebRTCClient : ",sipAccountInfo,handler);
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
		logger.log("webrtcSIPPhone: configureWebRTCClientDevice : ",handler);
		phone.registerCallBacks(handler);
	},

	setAuthenticatorServerURL(serverURL) {
		logger.log("webrtcSIPPhone: setAuthenticatorServerURL : ",serverURL);
		// Nothing to do here
	},

	toggleSipRegister: () => {
		logger.log("webrtcSIPPhone: toggleSipRegister entry");
		phone.resetRegisterAttempts();
		phone.sipToggleRegister();
	},

	webRTCMuteUnmute: () => {
		logger.log("webrtcSIPPhone: webRTCMuteUnmute");
		phone.sipToggleMic();
	},

	getMuteStatus: () => {
		logger.log("webrtcSIPPhone: getMuteStatus entry");
		return phone.getMicMuteStatus();
	},

	muteAction: (bMute) => {
		logger.log("webrtcSIPPhone: muteAction: ",bMute);
		phone.sipMute(bMute);
	},

	holdAction: (bHold) => {
		logger.log("webrtcSIPPhone: holdAction: ",bHold);
		phone.sipHold(bHold);
	},

	holdCall: () => {
		logger.log("webrtcSIPPhone: holdCall entry");
		phone.holdCall();
	},

	pickCall: () => {
		logger.log("webrtcSIPPhone: pickCall entry");
		phone.pickPhoneCall();

		webrtcSIPPhoneEventDelegate.onPickCall();
	},

	rejectCall: () => {
		logger.log("webrtcSIPPhone: rejectCall entry");
		phone.sipHangUp();

		webrtcSIPPhoneEventDelegate.onRejectCall();
	},

	reRegisterWebRTCPhone: () => {
		logger.log("webrtcSIPPhone: reRegisterWebRTCPhone entry");
		phone.reRegister();
	},


	playBeepTone: () => {
		logger.log("webrtcSIPPhone: playBeepTone entry");
		phone.playBeep();

	},

	sipUnRegisterWebRTC: () => {
		logger.log("webrtcSIPPhone: sipUnRegisterWebRTC entry");
		phone.sipUnRegister();
	},

	startWSNetworkTest: () => {
		logger.log("webrtcSIPPhone: startWSNetworkTest entry");
		this.testingMode = true;
		phone.sipRegister();
	},

	stopWSNetworkTest: () => {
		logger.log("webrtcSIPPhone stopWSNetworkTest entry");
		phone.sipUnRegister();
	},



	registerPhone: (engine, delegate) => {
		logger.log("webrtcSIPPhone: registerPhone : ",engine);
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
		logger.log("webrtcSIPPhone: getWebRTCStatus entry");
		var status = phone.getStatus();
		return status;
	},

	disconnect: () => {
		logger.log("webrtcSIPPhone: disconnect entry");
		if (phone) {
			phone.disconnect();
		}
	},

	connect: () => {
		logger.log("webrtcSIPPhone: connect entry");
		phone.connect();
	},

	getSIPAccountInfo() {
		logger.log("webrtcSIPPhone: getSIPAccountInfo entry");
		return sipAccountInfoData;
	},
	getWebRTCSIPEngine() {
		logger.log("webrtcSIPPhone: getWebRTCSIPEngine entry");
		return webrtcSIPEngine;
	},

	/* NL Addition - Start */
	getSpeakerTestTone() {
		logger.log("webrtcSIPPhone: getSpeakerTestTone entry");
		try {
			return SIPJSPhone.getSpeakerTestTone()
		} catch (e) {
			logger.log("getSpeakerTestTone: Exception ", e)
		}
	},

	getWSSUrl() {
		logger.log("webrtcSIPPhone: getWSSUrl entry");
		try {
			return SIPJSPhone.getWSSUrl()
		} catch (e) {
			logger.log("getWSSUrl: Exception ", e)
		}
	},
	/* NL Addition - End */

	getTransportState() {
		logger.log("webrtcSIPPhone: getTransportState entry");
		try {
			return SIPJSPhone.getTransportState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	},

	getRegistrationState() {
		logger.log("webrtcSIPPhone: getRegistrationState entry");
		try {
			return SIPJSPhone.getRegistrationState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	},

	changeAudioInputDevice(deviceId, onSuccess, onError) {
		logger.log("webrtcSIPPhone: changeAudioInputDevice : ", deviceId, onSuccess, onError);
		SIPJSPhone.changeAudioInputDevice(deviceId, onSuccess, onError);
	},

	changeAudioOutputDevice(deviceId, onSuccess, onError) {
		logger.log("webrtcSIPPhone: changeAudioOutputDevice : ", deviceId, onSuccess, onError);
		SIPJSPhone.changeAudioOutputDevice(deviceId, onSuccess, onError);
	},
	setPreferredCodec(codecName) {
		logger.log("webrtcSIPPhone: setPreferredCodec : ", codecName);
		SIPJSPhone.setPreferredCodec(codecName);
	},
	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
		logger.log("webrtcSIPPhone: registerAudioDeviceChangeCallback entry");
		SIPJSPhone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
	},
	getLogger() {
		return coreSDKLogger;
	}

};


export default webrtcSIPPhone;
