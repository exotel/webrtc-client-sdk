import SIPJSPhone from './sipjsphone';
import WebrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';






class WebrtcSIPPhone {

	constructor(username, logger) {
		this.logger = logger;
	
		if (!username) {
			throw new Error("username is required for WebrtcSIPPhone");
		}
		this.username = username;
		this.webrtcSIPEngine = null;        
		this.webrtcSIPPhoneEventDelegate = new WebrtcSIPPhoneEventDelegate(username, this.logger);
		this.phone   = null;
	}

	getLogger() {
		return this.logger;
	}

	registerPhone(engine, delegate, enableAutoAudioDeviceChangeHandling = false) {
		this.logger.log("webrtcSIPPhone: registerPhone : ", engine, "enableAutoAudioDeviceChangeHandling:", enableAutoAudioDeviceChangeHandling);
		this.webrtcSIPEngine = engine;
		
		if (!this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate = new WebrtcSIPPhoneEventDelegate(this.username, this.logger);
		}
		
		this.webrtcSIPPhoneEventDelegate.registerDelegate(delegate);
		
		switch (engine) {
			case "sipjs":
				this.phone = new SIPJSPhone(
					this.webrtcSIPPhoneEventDelegate,
					this.username,
					this.logger
				);
				break;
			default:
				this.logger.log("webrtcSIPPhone: Unsupported engine type:", engine);
				break;
		}
		
		this.webrtcSIPPhoneEventDelegate.onRegisterWebRTCSIPEngine(engine);
		this.phone.setEnableAutoAudioDeviceChangeHandling(enableAutoAudioDeviceChangeHandling);
		if(enableAutoAudioDeviceChangeHandling) {
			this.phone.attachGlobalDeviceChangeListener();
		}
	}

	getWebRTCStatus() {
		this.logger.log("webrtcSIPPhone: getWebRTCStatus entry");
		if (!this.phone) {
			this.logger.log("webrtcSIPPhone: getWebRTCStatus: phone not initialized");
			return "offline";
		}
		const status = this.phone.getStatus();
		this.logger.log("webrtcSIPPhone: getWebRTCStatus: current status:", status);
		return status;
	}

	isConnected() {
		this.logger.log("webrtcSIPPhone: isConnected entry");
		if (!this.phone) {
			this.logger.log("webrtcSIPPhone: isConnected: phone not initialized");
			return false;
		}
		const status = this.phone.getStatus();
		this.logger.log("webrtcSIPPhone: isConnected: current status:", status);
		return status !== "offline";
	}

	sendDTMFWebRTC (dtmfValue){
		this.logger.log("webrtcSIPPhone: sendDTMFWebRTC : ",dtmfValue);
		this.phone.sipSendDTMF(dtmfValue);
	}

	registerWebRTCClient (sipAccountInfo, handler){
		this.logger.log("webrtcSIPPhone: registerWebRTCClient : ",sipAccountInfo,handler);
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
		this.logger.log("webrtcSIPPhone: configureWebRTCClientDevice : ",handler);
		this.phone.registerCallBacks(handler);
	}

	setAuthenticatorServerURL(serverURL) {
		this.logger.log("webrtcSIPPhone: setAuthenticatorServerURL : ",serverURL);
	}

	toggleSipRegister (){
		this.logger.log("webrtcSIPPhone: toggleSipRegister entry");
		this.phone.resetRegisterAttempts();
		this.phone.sipToggleRegister();
	}

	webRTCMuteUnmute (){
		this.logger.log("webrtcSIPPhone: webRTCMuteUnmute");
		this.phone.sipToggleMic();
	}

	getMuteStatus (){
		this.logger.log("webrtcSIPPhone: getMuteStatus entry");
		return this.phone.getMicMuteStatus();
	}

	muteAction (bMute){
		this.logger.log("webrtcSIPPhone: muteAction: ",bMute);
		this.phone.sipMute(bMute);
	}

	holdAction (bHold){
		this.logger.log("webrtcSIPPhone: holdAction: ",bHold);
		this.phone.sipHold(bHold);
	}

	holdCall (){
		this.logger.log("webrtcSIPPhone: holdCall entry");
		this.phone.holdCall();
	}

	pickCall (){
		this.logger.log("webrtcSIPPhone: pickCall entry");
		this.phone.pickPhoneCall();

		this.webrtcSIPPhoneEventDelegate.onPickCall();
	}

	rejectCall (){
		this.logger.log("webrtcSIPPhone: rejectCall entry");
		this.phone.sipHangUp();

		this.webrtcSIPPhoneEventDelegate.onRejectCall();
	}

	reRegisterWebRTCPhone (){
		this.logger.log("webrtcSIPPhone: reRegisterWebRTCPhone entry");
		this.phone.reRegister();
	}

	playBeepTone (){
		this.logger.log("webrtcSIPPhone: playBeepTone entry");
		this.phone.playBeep();
	}

	sipUnRegisterWebRTC (){
		this.logger.log("webrtcSIPPhone: sipUnRegisterWebRTC entry");
		this.phone.sipUnRegister();
	}

	startWSNetworkTest (){
		this.logger.log("webrtcSIPPhone: startWSNetworkTest entry");
		this.testingMode = true;
		this.phone.sipRegister();
	}

	stopWSNetworkTest (){
		this.logger.log("webrtcSIPPhone stopWSNetworkTest entry");
		this.phone.sipUnRegister();
	}

	disconnect (){
		this.logger.log("webrtcSIPPhone: disconnect entry");
		if (this.phone) {
			this.phone.disconnect();
		}
	}

	connect (){
		this.logger.log("webrtcSIPPhone: connect entry");
		this.phone.connect();
	}

	getSIPAccountInfo() {
		this.logger.log("webrtcSIPPhone: getSIPAccountInfo entry");
		return this.sipAccountInfoData;
	}

	getWebRTCSIPEngine() {
		this.logger.log("webrtcSIPPhone: getWebRTCSIPEngine entry");
		return this.webrtcSIPEngine;
	}

	/* NL Addition - Start */
	getSpeakerTestTone() {
		this.logger.log("webrtcSIPPhone: getSpeakerTestTone entry");
		try {
			return this.phone.getSpeakerTestTone()
		} catch (e) {
			this.logger.log("getSpeakerTestTone: Exception ", e)
		}
	}

	getWSSUrl() {
		this.logger.log("webrtcSIPPhone: getWSSUrl entry");
		try {
			return this.phone.getWSSUrl()
		} catch (e) {
			this.logger.log("getWSSUrl: Exception ", e)
		}
	}

	getTransportState() {
		this.logger.log("webrtcSIPPhone: getTransportState entry");
		try {
			return this.phone.getTransportState();
		} catch (e) {
			this.logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	}

	getRegistrationState() {
		this.logger.log("webrtcSIPPhone: getRegistrationState entry");
		try {
			return this.phone.getRegistrationState();
		} catch (e) {
			this.logger.log("getTransportState: Exception ", e);
			return "unknown";
		}
	}

	changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
		this.logger.log("webrtcSIPPhone: changeAudioInputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange);
		this.phone.changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange);
	}

	changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange = false) {
		this.logger.log("webrtcSIPPhone: changeAudioOutputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange);
		this.phone.changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange);
	}

	setPreferredCodec(codecName) {
		this.logger.log("webrtcSIPPhone: setPreferredCodec : ", codecName);
		this.phone.setPreferredCodec(codecName);
	}

	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
		this.logger.log("webrtcSIPPhone: registerAudioDeviceChangeCallback entry");
		this.phone.registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback);
	}

	setAudioOutputVolume(audioElementName, value){
		this.logger.log("webrtcSIPPhone: setAudioOutputVolume: ", audioElementName, value);
		if (!this.phone) {
			this.logger.error("webrtcSIPPhone: setAudioOutputVolume: phone not initialized");
			return false;
		}
		return this.phone.setAudioOutputVolume(audioElementName, value);
	}

	getAudioOutputVolume(audioElementName) {
		this.logger.log("webrtcSIPPhone: getAudioOutputVolume: ", audioElementName);
		if (!this.phone) {
			this.logger.error("webrtcSIPPhone: getAudioOutputVolume: phone not initialized");
			return 0;
		}
		return this.phone.getAudioOutputVolume(audioElementName);
	}

	sendWebRTCEventsToFSM(eventType, sipMethod) {
		this.logger.log("webrtcSIPPhone: sendWebRTCEventsToFSM : ",eventType,sipMethod);
		//this.webrtcSIPPhoneEventDelegate = new WebrtcSIPPhoneEventDelegate();
		this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM(eventType, sipMethod);
	}
}

export default WebrtcSIPPhone;