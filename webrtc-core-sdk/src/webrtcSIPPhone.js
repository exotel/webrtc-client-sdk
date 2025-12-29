import coreSDKLogger from './coreSDKLogger';
import SIPJSPhone from './sipjsphone';
import WebrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';

const logger = coreSDKLogger;

export function getLogger() {
	return coreSDKLogger;
}

function sendWebRTCEventsToFSM(eventType, sipMethod) {
	logger.log("webrtcSIPPhone: sendWebRTCEventsToFSM : ",eventType,sipMethod);
	this.webrtcSIPPhoneEventDelegate = new WebrtcSIPPhoneEventDelegate();
	this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM(eventType, sipMethod);
}

class WebrtcSIPPhone {

	constructor(username) {
		if (!username) {
			throw new Error("username is required for WebrtcSIPPhone");
		}
		this.username           = username;
		this.webrtcSIPEngine             = null;        
		this.webrtcSIPPhoneEventDelegate      = new WebrtcSIPPhoneEventDelegate(username);
		this.phone   = null;
	}

	static getLogger() {
		return coreSDKLogger;
	}

	registerPhone(engine, delegate, enableAutoAudioDeviceChangeHandling = false) {
		logger.log("webrtcSIPPhone: registerPhone : ", engine, "enableAutoAudioDeviceChangeHandling:", enableAutoAudioDeviceChangeHandling);
		this.webrtcSIPEngine = engine;
		
		if (!this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate = new WebrtcSIPPhoneEventDelegate(this.username);
		}
		
		this.webrtcSIPPhoneEventDelegate.registerDelegate(delegate);
		
		// Preserve noise suppression setting from existing phone instance if it exists
		const existingNoiseSuppression = this.phone?.enableNoiseSuppression;
		
		switch (engine) {
			case "sipjs":
				this.phone = new SIPJSPhone(
					this.webrtcSIPPhoneEventDelegate,
					this.username
				);
				// Restore noise suppression setting if it was set on the previous instance
				if (existingNoiseSuppression) {
					this.phone.setNoiseSuppression(existingNoiseSuppression);
				}
				break;
			default:
				logger.log("webrtcSIPPhone: Unsupported engine type:", engine);
				break;
		}
		
		this.webrtcSIPPhoneEventDelegate.onRegisterWebRTCSIPEngine(engine);
		this.phone.setEnableAutoAudioDeviceChangeHandling(enableAutoAudioDeviceChangeHandling);
		if(enableAutoAudioDeviceChangeHandling) {
			this.phone.attachGlobalDeviceChangeListener();
		}
	}

	getWebRTCStatus() {
		logger.log("webrtcSIPPhone: getWebRTCStatus entry");
		if (!this.phone) {
			logger.log("webrtcSIPPhone: getWebRTCStatus: phone not initialized");
			return "offline";
		}
		const status = this.phone.getStatus();
		logger.log("webrtcSIPPhone: getWebRTCStatus: current status:", status);
		return status;
	}

	isConnected() {
		logger.log("webrtcSIPPhone: isConnected entry");
		if (!this.phone) {
			logger.log("webrtcSIPPhone: isConnected: phone not initialized");
			return false;
		}
		const status = this.phone.getStatus();
		logger.log("webrtcSIPPhone: isConnected: current status:", status);
		return status !== "offline";
	}

	sendDTMFWebRTC (dtmfValue){
		logger.log("webrtcSIPPhone: sendDTMFWebRTC : ",dtmfValue);
		this.phone.sipSendDTMF(dtmfValue);
	}

	registerWebRTCClient (sipAccountInfo, handler){
		logger.log("webrtcSIPPhone: registerWebRTCClient : ",sipAccountInfo,handler);
		this.sipAccountInfoData = sipAccountInfo;
		this.phone.init(() => {
			this.phone.loadCredentials(sipAccountInfo);
			if (this.getWebRTCStatus() == "offline") {
				if (handler != null)
					if (handler.onFailure)
						handler.onFailure();
			} else {
				if (handler != null)
					if (handler.onResponse)
						handler.onResponse();
			}
		});
	}

	configureWebRTCClientDevice (handler){
		logger.log("webrtcSIPPhone: configureWebRTCClientDevice : ",handler);
		this.phone.registerCallBacks(handler);
	}

	setAuthenticatorServerURL(serverURL) {
		logger.log("webrtcSIPPhone: setAuthenticatorServerURL : ",serverURL);
	}

	toggleSipRegister (){
		logger.log("webrtcSIPPhone: toggleSipRegister entry");
		this.phone.resetRegisterAttempts();
		this.phone.sipToggleRegister();
	}

	webRTCMuteUnmute (){
		logger.log("webrtcSIPPhone: webRTCMuteUnmute");
		this.phone.sipToggleMic();
	}

	getMuteStatus (){
		logger.log("webrtcSIPPhone: getMuteStatus entry");
		return this.phone.getMicMuteStatus();
	}

	getHoldStatus() {
		logger.log("webrtcSIPPhone: getHoldStatus entry");
		return this.phone.getHoldStatus();
	}

	muteAction (bMute){
		logger.log("webrtcSIPPhone: muteAction: ",bMute);
		this.phone.sipMute(bMute);
	}

	holdAction (bHold){
		logger.log("webrtcSIPPhone: holdAction: ",bHold);
		this.phone.sipHold(bHold);
	}

	holdCall (){
		logger.log("webrtcSIPPhone: holdCall entry");
		this.phone.holdCall();
	}

	pickCall (){
		logger.log("webrtcSIPPhone: pickCall entry");
		this.phone.pickPhoneCall();

		this.webrtcSIPPhoneEventDelegate.onPickCall();
	}

	rejectCall (){
		logger.log("webrtcSIPPhone: rejectCall entry");
		this.phone.sipHangUp();

		this.webrtcSIPPhoneEventDelegate.onRejectCall();
	}

	reRegisterWebRTCPhone (){
		logger.log("webrtcSIPPhone: reRegisterWebRTCPhone entry");
		this.phone.reRegister();
	}

	playBeepTone (){
		logger.log("webrtcSIPPhone: playBeepTone entry");
		this.phone.playBeep();
	}

	sipUnRegisterWebRTC (){
		logger.log("webrtcSIPPhone: sipUnRegisterWebRTC entry");
		this.phone.sipUnRegister();
	}

	startWSNetworkTest (){
		logger.log("webrtcSIPPhone: startWSNetworkTest entry");
		this.testingMode = true;
		this.phone.sipRegister();
	}

	stopWSNetworkTest (){
		logger.log("webrtcSIPPhone stopWSNetworkTest entry");
		this.phone.sipUnRegister();
	}

	disconnect (){
		logger.log("webrtcSIPPhone: disconnect entry");
		if (this.phone) {
			this.phone.disconnect();
		}
	}

	connect (){
		logger.log("webrtcSIPPhone: connect entry");
		this.phone.connect();
	}

	getSIPAccountInfo() {
		logger.log("webrtcSIPPhone: getSIPAccountInfo entry");
		return this.sipAccountInfoData;
	}

	getWebRTCSIPEngine() {
		logger.log("webrtcSIPPhone: getWebRTCSIPEngine entry");
		return this.webrtcSIPEngine;
	}

	/* NL Addition - Start */
	getSpeakerTestTone() {
		logger.log("webrtcSIPPhone: getSpeakerTestTone entry");
		try {
			return this.phone.getSpeakerTestTone()
		} catch (e) {
			logger.log("getSpeakerTestTone: Exception ", e)
		}
	}

	getWSSUrl() {
		logger.log("webrtcSIPPhone: getWSSUrl entry");
		try {
			return this.phone.getWSSUrl()
		} catch (e) {
			logger.log("getWSSUrl: Exception ", e)
		}
	}

	getTransportState() {
		logger.log("webrtcSIPPhone: getTransportState entry");
		try {
			return this.phone.getTransportState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	}

	getRegistrationState() {
		logger.log("webrtcSIPPhone: getRegistrationState entry");
		try {
			return this.phone.getRegistrationState();
		} catch (e) {
			logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	}

	changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
		logger.log("webrtcSIPPhone: changeAudioInputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange);
		this.phone.changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange);
	}

	changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
		logger.log("webrtcSIPPhone: changeAudioOutputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange);
		this.phone.changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange);
	}

	setPreferredCodec(codecName) {
		logger.log("webrtcSIPPhone: setPreferredCodec : ", codecName);
		this.phone.setPreferredCodec(codecName);
	}

	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
		logger.log("webrtcSIPPhone: registerAudioDeviceChangeCallback entry");
		this.phone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
	}

	static setAudioOutputVolume(audioElementName, value){
		logger.log("WebrtcSIPPhone: setAudioOutputVolume: ", audioElementName, value);
		return SIPJSPhone.setAudioOutputVolume(audioElementName, value);
	}

	static getAudioOutputVolume(audioElementName) {
		logger.log("webrtcSIPPhone: getAudioOutputVolume: ", audioElementName);
		return SIPJSPhone.getAudioOutputVolume(audioElementName);
	}

	setCallAudioOutputVolume(value) {
		logger.log("webrtcSIPPhone: setCallAudioOutputVolume: ", value);
		return this.phone.setCallAudioOutputVolume(value);
	}

	getCallAudioOutputVolume() {
		logger.log("webrtcSIPPhone: getCallAudioOutputVolume");
		return this.phone.getCallAudioOutputVolume();
	}

	setNoiseSuppression(enabled = false) {
        logger.log("webrtcSIPPhone: setNoiseSuppression: ", enabled);
        this.phone.setNoiseSuppression(enabled);
    }
}

export default WebrtcSIPPhone;