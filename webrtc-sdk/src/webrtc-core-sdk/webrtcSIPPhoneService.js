/*
 *  to intialize/disconnect webrtc sip phone and maintain phone states on disconnect, reconnectione etc.
 */

import webrtcSIPPhone from './webrtcSIPPhone';

let MAX_REGISTER_ATTEMPTS = 2000;
let registerAttempts = 0;
let TWILIO_SERVER_PATH = "";

var logger;

function registerWebRTCInstance(sipAccountName, sipAuthUser, serverDomain, sipSecret, sipUserName, twilioServerPath,uiCallbackHandler, sipDomain, sipWsPort, sipPort, sipSecurePort) {
	let sipAccInfo = {
		userName: sipUserName,
		authUser: sipAuthUser,
		domain: serverDomain,
		accountName: sipAccountName,
		secret: sipSecret,
		sipdomain: sipDomain,
		security: 'wss',
		sipPort :sipPort,
		sipSecurePort : sipSecurePort,
		wsPort : sipWsPort
	};
	
	
	webrtcSIPPhone.setAuthenticatorServerURL(twilioServerPath);
	
	
	webrtcSIPPhone.registerWebRTCClient(sipAccInfo, uiCallbackHandler);
}

function registerWebrtcInstance(result,uiCallBackHandler) {
	registerWebRTCInstance(result.accountName,
			       result.authUser,
		               result.domain,
		               result.secret,
		               result.userName,
		               TWILIO_SERVER_PATH,
		               uiCallBackHandler,
		               result.sipdomain,
		               result.sipWsPort,
		               result.sipPort,
		               result.sipSecurePort);
}

function checkWebRTCClientStatus(result, webRTCStatusCallbackHandler,uiCallbackHandler) {


	let webRTCStatus = webrtcSIPPhone.getWebRTCStatus();

	if (webRTCStatus == "offline") {
		let condition = compare();
		if (condition) {
			incrementRegisterAttempts();
			registerWebrtcInstance(result,uiCallbackHandler);
		} else {
			webRTCStatusCallbackHandler("webrtc_status_offline","");	
		}
	} else {
		resetRegisterAttempts();
		webRTCStatusCallbackHandler("webrtc_status_online","");
	}
}

function resetRegisterAttempts() {
	registerAttempts = 0;
}

function incrementRegisterAttempts() {
	registerAttempts++;
}

function compare() {
	if (registerAttempts <= MAX_REGISTER_ATTEMPTS) {
		return true;
	} else {
		return false;
	}
}



let checkWebRTCStatusTimer = null;

function startCheckingWebrtcStatus(result, webRTCStatusCallbackHandler,uiCallbackHandler) {
	checkWebRTCStatusTimer = setInterval(() => {
		checkWebRTCClientStatus(result, webRTCStatusCallbackHandler,uiCallbackHandler);
	}, 8000);
}


const webrtcSIPPhoneService = {

	init: (engine, result, webRTCStatusCallbackHandler, webrtcPhoneDelegate,uiCallbackHandler) => {

		webrtcSIPPhone.registerPhone(engine,webrtcPhoneDelegate);
		
		logger.info("Going to register webrtc instance");		
		registerWebrtcInstance(result,uiCallbackHandler);
		startCheckingWebrtcStatus(result, webRTCStatusCallbackHandler,uiCallbackHandler);
		
	},
	
	unregister : () => {
		
	},

	startWsTesting : () => {
        webrtcSIPPhone.startWsTesting();
	},
	
    
    disconnect : () => {
    	webrtcSIPPhoneService.clearCheckWebRTCTimers();
    	webrtcSIPPhone.disconnect();
	},
	
	clearCheckWebRTCTimers:()=>{
		if(checkWebRTCStatusTimer) {
    		clearInterval(checkWebRTCStatusTimer);
    		checkWebRTCStatusTimer = null;
        	
        }
	},
	
	getWebrtcLogger: () => {
		return logger;
	},

	setWebrtcLogger: (clientLogger) => {
		logger = clientLogger;
	}

};

export default webrtcSIPPhoneService;
