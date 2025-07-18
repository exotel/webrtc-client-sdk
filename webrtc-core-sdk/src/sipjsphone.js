/*
 * SIPJS WebRTC SIP Phone - to interact with SIPJS Library
 */

var SIP = require('./sip-0.20.0.js')
import { audioDeviceManager } from './audioDeviceManager.js';
import coreSDKLogger from './coreSDKLogger.js';
import webrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';

let enableAutoAudioDeviceChangeHandling = false;
var lastTransportState = "";
var lastRegistererState = "";
var initializeComplete = false;
var webRTCStatus = "offline"; // ready -> registered, offline -> unregistered,
var callBackHandler = null;
let txtPublicIdentity = "";
var bMicEnable = true;
var bHoldEnable = false;
var bDisableVideo = true;
var beeptone = document.createElement("audio");
beeptone.src = require("./static/beep.wav");
var ringtone = document.createElement("audio");
ringtone.src = require("./static/ringtone.wav");
var ringbacktone = document.createElement("audio");
ringbacktone.src = require("./static/ringbacktone.wav");
var dtmftone = document.createElement("audio");
dtmftone.src = require("./static/dtmf.wav");

var audioRemote = document.createElement("audio");


let txtDisplayName, txtPrivateIdentity, txtHostNameWithPort, txtHostName, txtWebSocketPort, txtAccountName;
let txtSecurity, txtSipDomain, txtWSPort, txtSipPort, txtSipSecurePort, txtContactHost, endpoint;
let txtPassword, txtRealm, txtTurnServer, txtCredential, txtTurnUri, txtWebsocketURL, txtUDPURL;


let register_flag = false;
var ctxSip = {};
var registerer = null;


let logger = coreSDKLogger;
logger.log(SIP);
/* NL Additions - Start */

export function getLogger() {

	try {
		let userAgent = SIP.UserAgent
		uaLogger = userAgent.getLogger("sip.WebrtcLib")
		//let loggerFactory = userAgent.getLoggerFactory()
	} catch (e) {
		logger.log("sipjsphone: getLogger: No userAgent.getLogger, Using console log")
		return console;
	}

	if (uaLogger) {
		return uaLogger;
	}
	else {
		logger.log("sipjsphone: getLogger: No Logger, Using console log")
		return logger;
	}
}

/* NL Additions - End */

//var intervalID = 0;
function postInit(onInitDoneCallback) {

	ctxSip = {
		config: {},
		ringtone: ringtone,
		ringbacktone: ringbacktone,
		dtmfTone: dtmftone,
		beeptone: beeptone,
		Sessions: [],
		callTimers: {},
		callActiveID: null,
		callVolume: 1,
		Stream: null,
		ringToneIntervalID: 0,
		ringtoneCount: 30,

		startRingTone: function () {
			try {
				var count = 0;
				if (!ctxSip.ringtone) {
					ctxSip.ringtone = ringtone;
				}
				ctxSip.ringtone.load();
				ctxSip.ringToneIntervalID = setInterval(function () {
					ctxSip.ringtone.play()
						.then(() => {
							// Audio is playing.
							logger.log("sipjsphone: startRingTone: Audio is playing: count=" + count + " ctxSip.ringToneIntervalID=" + ctxSip.ringToneIntervalID + " ctxSip.ringtoneCount=" + ctxSip.ringtoneCount);
						})
						.catch(e => {
							logger.log("sipjsphone: startRingTone: Exception:", e);
						});
					count++;
					if (count > ctxSip.ringtoneCount) {
						clearInterval(ctxSip.ringToneIntervalID);
					}
				}, 500)



			} catch (e) { logger.log("sipjsphone: startRingTone: Exception:", e); }
		},

		stopRingTone: function () {
			try {

				if (!ctxSip.ringtone) {
					ctxSip.ringtone = ringtone;
				}
				ctxSip.ringtone.pause();
				logger.log("sipjsphone: stopRingTone: intervalID:", ctxSip.ringToneIntervalID);
				clearInterval(ctxSip.ringToneIntervalID)
			} catch (e) { logger.log("sipjsphone: stopRingTone: Exception:", e); }
		},

		startRingbackTone: function () {
			if (!ctxSip.ringbacktone) {
				ctxSip.ringbacktone = ringbacktone;
			}
			try {
				ctxSip.ringbacktone.play().then(() => {
					// Audio is playing.
					logger.log("sipjsphone: startRingbackTone: Audio is playing:");
				})
					.catch(e => {
						logger.log("sipjsphone: startRingbackTone: Exception:", e);
					});
			} catch (e) { logger.log("sipjsphone: startRingbackTone: Exception:", e); }
		},

		stopRingbackTone: function () {
			if (!ctxSip.ringbacktone) {
				ctxSip.ringbacktone = ringbacktone;
			}
			try { ctxSip.ringbacktone.pause(); } catch (e) { logger.log("sipjsphone: stopRingbackTone: Exception:", e); }
		},

		// Genereates a rendom string to ID a call
		getUniqueID: function () {
			return Math.random().toString(36).substr(2, 9);
		},

		newSession: function (newSess) {

			newSess.displayName = newSess.remoteIdentity.displayName || newSess.remoteIdentity.uri.user;
			newSess.ctxid = ctxSip.getUniqueID();
			ctxSip.callActiveID = newSess.ctxid;


			newSess.stateChange.addListener((newState) => {
				switch (newState) {
					case SIP.SessionState.Establishing:
						// Session is establishing.
						break;
					case SIP.SessionState.Established:
						onInvitationSessionAccepted(newSess);
						break;
					case SIP.SessionState.Terminated:
						// Session has terminated.
						onInvitationSessionTerminated();
						break;
					default:
						break;
				}
			});



			newSess.delegate = {};

			newSess.delegate.onSessionDescriptionHandler = (sdh, provisional) => {
				let lastIceState = "unknown";

				try {
					let callId = ctxSip.callActiveID;
					let username = ctxSip.config.authorizationUsername;
					let pc = sdh._peerConnection;
					webrtcSIPPhoneEventDelegate.initGetStats(pc, callId, username);
				} catch (e) {
					logger.log("sipjsphone: newSession: something went wrong while initing getstats");
					logger.log(e);
				}

				sdh.peerConnectionDelegate = {
					onnegotiationneeded: (event) => {
						webrtcSIPPhoneEventDelegate.onCallStatNegoNeeded();
					},
					onsignalingstatechange: (event) => {
						webrtcSIPPhoneEventDelegate.onCallStatSignalingStateChange(event.target.signalingState);
					},
					onconnectionstatechange: (event) => {
						webrtcSIPPhoneEventDelegate.onStatPeerConnectionConnectionStateChange(event.target.connectionState);
					},
					oniceconnectionstatechange: (event) => {
						webrtcSIPPhoneEventDelegate.onStatPeerConnectionIceConnectionStateChange(event.target.iceConnectionState);
					},
					onicegatheringstatechange: (event) => {
						webrtcSIPPhoneEventDelegate.onStatPeerConnectionIceGatheringStateChange(event.target.iceGatheringState);
					}

				};

			};
			ctxSip.Sessions[newSess.ctxid] = newSess;

			let status;
			if (newSess.direction === 'incoming') {
				webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('incoming');
				status = "Incoming: " + newSess.displayName;
				ctxSip.startRingTone();
				//sip call method was invoking after 500 ms because of race between server push and 
				//webrtc websocket autoanswer
				setTimeout(sipCall, 500);

			}
			ctxSip.setCallSessionStatus(status);


		},

		// getUser media request refused or device was not present
		getUserMediaFailure: function (e) {

		},

		getUserMediaSuccess: function (stream) {
			ctxSip.Stream = stream;
		},

		/**
		 * sets the ui call status field
		 * 
		 * @param {string}
		 *            status
		 */
		setCallSessionStatus: function (status) {

		},

		/**
		 * sets the ui connection status field
		 * 
		 * @param {string}
		 *            status
		 */
		setStatus: function (status) {
		},

		/**
		 * logs a call to localstorage
		 * 
		 * @param {object}
		 *            session
		 * @param {string}
		 *            status Enum 'ringing', 'answered', 'ended', 'holding',
		 *            'resumed'
		 */
		logCall: function (session, status) { },




		sipHangUp: function (sessionid) {

			var s = ctxSip.Sessions[sessionid];
			// s.terminate();
			if (!s) {
				return;
			} else if (s.state == SIP.SessionState.Established) {
				s.bye();
			} else if (s.reject) {
				s.reject({
					statusCode: 486,
					reasonPhrase: "Busy"
				});
			} else if (s.cancel) {
				s.cancel();
			}


		},

		sipSendDTMF: function (digit) {

			try { ctxSip.dtmfTone.play(); } catch (e) { logger.log("sipjsphone: sipSendDTMF: Exception:", e); }

			var a = ctxSip.callActiveID;
			if (a) {
				var s = ctxSip.Sessions[a];

				if (!/^[0-9A-D#*,]$/.exec(digit)) {
					return Promise.reject(new Error("Invalid DTMF tone."));
				}
				if (!s) {
					return Promise.reject(new Error("Session does not exist."));
				}

				const dtmf = digit;
				const duration = 240;
				const body = {
					contentDisposition: "render",
					contentType: "application/dtmf-relay",
					content: "Signal=" + dtmf + "\r\nDuration=" + duration
				};
				const requestOptions = { body };
				return s.info({ requestOptions }).then(() => {
					return;
				});

			}
		},

		setError: function (err, title, msg, closable) { },




		phoneMuteButtonPressed: function (sessionid) {
			logger.log(" sipjsphone: phoneMuteButtonPressed: bMicEnable, sessionid", bMicEnable, sessionid);
			var s = ctxSip.Sessions[sessionid];

			if (bMicEnable) {
				toggleMute(s, true);
				bMicEnable = false;
			} else {
				toggleMute(s, false);
				bMicEnable = true;
			}
		},

		//NL --Implement hold button start
		phoneMute: function (sessionid, bMute) {
			if (sessionid) {
				var s = ctxSip.Sessions[sessionid];
				logger.log(" sipjsphone: phoneMute: bMute", bMute)
				toggleMute(s, bMute);
				bMicEnable = !bMute;
			}
			else{
				logger.log(" sipjsphone: phoneMute: doing nothing as sessionid not found")

			}
		},

		phoneHold: function (sessionid, bHold) {
			if (sessionid) {
				var s = ctxSip.Sessions[sessionid];
				logger.log("sipjsphone: phoneHold: bHold", bHold)
				toggleHold(s, bHold);
				bHoldEnable = bHold;
			}
		},

		phoneHoldButtonPressed: function (sessionid) {
			if (sessionid) {
				var s = ctxSip.Sessions[sessionid];
				if (bHoldEnable) {
					toggleHold(s, false);
					bHoldEnable = false;
				} else {
					toggleHold(s, true);
					bHoldEnable = true;
				}
			}
		},
		//NL --Implement hold button end

		/**
		 * Tests for a capable browser, return bool, and shows an error modal on
		 * fail.
		 */
		hasWebRTC: function () {

			if (navigator.webkitGetUserMedia) {
				return true;
			} else if (navigator.mozGetUserMedia) {
				return true;
			} else if (navigator.getUserMedia) {
				return true;
			} else {
				ctxSip.setError(true, 'Unsupported Browser.', 'Your browser does not support the features required for this phone.');
				logger.error("WebRTC support not found");
				return false;
			}
		}

	};


	if (!ctxSip.hasWebRTC) {
		alert('Your browser don\'t support WebRTC.\naudio/video calls will be disabled.');
	}
	webrtcSIPPhoneEventDelegate.setWebRTCFSMMapper("sipjs");
	logger.log("sipjsphone: init: Initialization complete...")
	initializeComplete = true;
	onInitDoneCallback();
}

const addPreferredCodec = (description) => {
	logger.log("sipjsphone:addPreferredCodec entry");
	// Ensure a preferred codec is set
	if (!SIPJSPhone.preferredCodec) {
		logger.info("sipjsphone:addPreferredCodec: No preferred codec set. Using default.");
		return Promise.resolve(description);
	}

	const { payloadType, rtpMap, fmtp } = SIPJSPhone.preferredCodec;
	const codecRtpMap = `a=rtpmap:${payloadType} ${rtpMap}`;
	const codecFmtp = fmtp ? `a=fmtp:${payloadType} ${fmtp}` : "";

	logger.log("sipjsphone:addPreferredCodec: Original SDP:", description.sdp);

	// Parse SDP into lines
	let sdpLines = description.sdp.split("\r\n");

	// Check if Opus is already in the SDP
	const existingOpusIndex = sdpLines.findIndex((line) => line.includes(`a=rtpmap`) && line.includes("opus/48000/2"));
	const audioMLineIndex = sdpLines.findIndex((line) => line.startsWith("m=audio"));

	if (existingOpusIndex !== -1 && audioMLineIndex !== -1) {
		logger.log("sipjsphone:addPreferredCodec: Opus codec already exists. Prioritizing it.");

		// Extract and modify the audio m-line
		let audioMLine = sdpLines[audioMLineIndex];
		audioMLine = audioMLine.replace("RTP/SAVP", "RTP/AVP");

		const codecs = audioMLine.split(" ");
		const mLineStart = codecs.slice(0, 3); // "m=audio <port> <protocol>"
		const mLineCodecs = codecs.slice(3);

		// Move existing Opus payload type to the top
		const opusPayloadType = sdpLines[existingOpusIndex].match(/a=rtpmap:(\d+)/)[1];
		const opusIndex = mLineCodecs.indexOf(opusPayloadType);

		if (opusIndex !== -1) {
			// Remove Opus from its current position
			mLineCodecs.splice(opusIndex, 1);
		}
		// Add Opus to the beginning of the codec list
		mLineCodecs.unshift(opusPayloadType);

		// Update the audio m-line
		sdpLines[audioMLineIndex] = `${mLineStart.join(" ")} ${mLineCodecs.join(" ")}`;
	} else if (audioMLineIndex !== -1) {
		logger.log("sipjsphone:addPreferredCodec: Opus codec not found. Adding it to SDP.");

		// Extract and modify the audio m-line
		let audioMLine = sdpLines[audioMLineIndex];
		audioMLine = audioMLine.replace("RTP/SAVP", "RTP/AVP");

		const codecs = audioMLine.split(" ");
		const mLineStart = codecs.slice(0, 3); // "m=audio <port> <protocol>"
		const mLineCodecs = codecs.slice(3);

		// Add Opus payload type to the top
		mLineCodecs.unshift(payloadType.toString());

		// Update the audio m-line
		sdpLines[audioMLineIndex] = `${mLineStart.join(" ")} ${mLineCodecs.join(" ")}`;

		// Add Opus-specific attributes to the SDP
		if (!sdpLines.includes(codecRtpMap)) {
			sdpLines.splice(audioMLineIndex + 1, 0, codecRtpMap); // Add rtpmap after m=audio
		}
		if (fmtp && !sdpLines.includes(codecFmtp)) {
			sdpLines.splice(audioMLineIndex + 2, 0, codecFmtp); // Add fmtp after rtpmap
		}
	} else {
		logger.error("sipjsphone:addPreferredCodec: No audio m-line found in SDP. Cannot modify.");
		return Promise.resolve(description);
	}

	// Remove any duplicate lines
	sdpLines = [...new Set(sdpLines)];

	// Combine back into SDP
	description.sdp = sdpLines.join("\r\n");
	logger.log("sipjsphone:addPreferredCodec: Modified SDP:", description.sdp);

	return Promise.resolve(description);
};

function sipRegister() {

	lastRegistererState = "";

	cleanupRegistererTimer();

	try {
		ctxSip.config = {
			authorizationPassword: txtPassword,
			authorizationUsername: txtDisplayName,
			displayName: txtDisplayName,
			uri: SIP.UserAgent.makeURI(txtPublicIdentity),
			hackWssInTransport: true,
			allowLegacyNotifications: true,
			contactParams: {
				transport: "wss"
			},
			transportOptions: {
				server: txtWebsocketURL,
				traceSip: true,
				reconnectionAttempts: 0

			},
			logBuiltinEnabled: true,
			logConnector: sipPhoneLogger,
			logLevel: "log",
			sessionDescriptionHandlerFactoryOptions: {
				constraints: {
					audio: true,
					video: false
				}
			},
			stunServers: ["stun:stun.l.google.com:19302"],
			registerOptions: {
				expires: 300
			}

		};

		if (!txtRealm || !txtPrivateIdentity || !txtPublicIdentity) {
			return;
		}
		// enable notifications if not already done
		if (window.webkitNotifications
			&& window.webkitNotifications.checkPermission() != 0) {
			window.webkitNotifications.requestPermission();
		}

		ctxSip.phone = new SIP.UserAgent(ctxSip.config);
		registerPhoneEventListeners();

	} catch (e) {
		webRTCStatus = "offline";
		if (callBackHandler != null)
			if (callBackHandler.onResponse)
				callBackHandler.onResponse("error");
	}
	register_flag = false;
}

let registererStateEventListner = (newState) => {

	lastRegistererState = newState;
	if (ctxSip.phone && ctxSip.phone.transport && ctxSip.phone.transport.isConnected()) {
		sipPhoneLogger("debug", "", "", "sipjslog registerer new state " + newState);

		switch (newState) {
			case SIP.RegistererState.Registered:
				break;
			case SIP.RegistererState.Unregistered:
				onUserAgentRegistrationFailed();
				break;
			case SIP.RegistererState.Terminated:
				onUserAgentRegistrationTerminated();
				break;

			default:
				break;
		}
	}


};



let registererWaitingChangeListener = (b) => {
	if (registerer && registerer.state == SIP.RegistererState.Registered) {
		onUserAgentRegistered();
	}

};

let transportStateChangeListener = (newState) => {
	lastTransportState = newState;
	sipPhoneLogger("debug", "", "", "sipjslog transport new state " + newState);

	switch (newState) {

		case SIP.TransportState.Connecting:
			webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent('connecting');
			webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("starting", "CONNECTION");
			break;
		case SIP.TransportState.Connected:
			onUserAgentTransportConnected();
			break;
		case SIP.TransportState.Disconnected:
			onUserAgentTransportDisconnected();
			break;
		default:
			break;


	}
};

function registerPhoneEventListeners() {

	ctxSip.phone.delegate = {};




	ctxSip.phone.transport.stateChange.addListener(transportStateChangeListener);

	registerer = new SIP.Registerer(ctxSip.phone, { expires: 300, refreshFrequency: 80 });


	ctxSip.phone.delegate.onInvite = (incomingSession) => {
		if (ctxSip.callActiveID == null) {
			var s = incomingSession;
			s.direction = 'incoming';
			ctxSip.newSession(s);
			webrtcSIPPhoneEventDelegate.onRecieveInvite(incomingSession);
			webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("i_new_call", "CALL");
		} else {
			incomingSession.reject({
				statusCode: 480,
				reasonPhrase: "4001"
			});
		}
	};



	ctxSip.phone.start();

}



function uiOnConnectionEvent(b_connected, b_connecting) { // should be enum:
	// connecting,
	// connected,
	// terminating,
	// terminated
	if (b_connected || b_connecting) {
		register_flag = true;
		webRTCStatus = "ready";
	} else {
		register_flag = false;
		destroySocketConnection();

	}


}


function destroySocketConnection() {
	try {

		if (ctxSip.phone && ctxSip.phone.transport.isConnected()) {
			ctxSip.phone.transport.disconnect();
		}
	} catch (e) {
		logger.log("sipjsphone: destroySocketConnection: ERROR", e);
	}
}


function uiCallTerminated(s_description) {
	if (window.btnBFCP)
		window.btnBFCP.disabled = true;

	ctxSip.stopRingTone();
	ctxSip.stopRingbackTone();

	if (callBackHandler != null)
		if (callBackHandler.onResponse)
			callBackHandler.onResponse("disconnected");


}


function sipCall() {
	logger.log("sipjsphone: sipCall: testing emit accept_reject");
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("accept_reject", "CALL");
}




function sipPhoneLogger(level, category, label, content) {
	try {
		if (content) {
			if (content.startsWith("Sending WebSocket")) {
				handleWebSocketMessageContent(content, "sent");
			} else if (content.startsWith("Received WebSocket text message")) {
				handleWebSocketMessageContent(content, "recv");
			}
			logger.log("sipjsphone: sipPhoneLogger:" + level + " sipjslog: " + category + ": " + content);
		}
	} catch (e) {
		logger.error("sipjsphone:sipPhoneLogger ERROR", e);
	}

}


function onInvitationSessionAccepted(newSess) {
	ctxSip.Stream = newSess.sessionDescriptionHandler.localMediaStream;
	assignStream(newSess.sessionDescriptionHandler.remoteMediaStream, audioRemote);

	webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('accepted');
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected", "CALL");

	// If there is another active call, hold it
	if (ctxSip.callActiveID && ctxSip.callActiveID !== newSess.ctxid) {
		ctxSip.phoneHoldButtonPressed(ctxSip.callActiveID);
	}

	ctxSip.stopRingbackTone();
	ctxSip.stopRingTone();
	ctxSip.setCallSessionStatus('Answered');
	ctxSip.logCall(newSess, 'answered');
	ctxSip.callActiveID = newSess.ctxid;

	webRTCStatus = "busy";
	if (callBackHandler != null)
		if (callBackHandler.onResponse)
			callBackHandler.onResponse("connected");
}

function onInvitationSessionTerminated() {
	SIPJSPhone.stopStreamTracks(ctxSip.Stream);
	webrtcSIPPhoneEventDelegate.stopCallStat();
	webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('terminated');
	ctxSip.stopRingTone();
	ctxSip.stopRingbackTone();
	ctxSip.setCallSessionStatus("");
	ctxSip.callActiveID = null;
	webrtcSIPPhoneEventDelegate.playBeepTone();
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated", "CALL");

	uiCallTerminated();
	if (register_flag == true) {
		webRTCStatus = "ready";
	} else {
		destroySocketConnection();
	}
	if (callBackHandler != null)
		if (callBackHandler.onResponse)
			callBackHandler.onResponse("disconnected");
}


function onUserAgentRegistered() {
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected", "CONNECTION");
	var bConnected = true;
	uiOnConnectionEvent(bConnected, !bConnected);
	register_flag = true;
	webRTCStatus = "ready";
	if (callBackHandler != null)
		if (callBackHandler.onResponse)
			callBackHandler.onResponse("ready");


	var closePhone = function () {
		// stop the phone on unload
		localStorage.removeItem('ctxPhone');
		ctxSip.phone.stop();
	};

	window.onunload = closePhone;
	localStorage.setItem('ctxPhone', 'true');
}

function onUserAgentRegistrationTerminated() {
	uiOnConnectionEvent(false, false);
}

function onUserAgentRegistrationFailed() {


	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated", "CONNECTION");
	uiOnConnectionEvent(false, false);
	register_flag = false;
	if (callBackHandler != null) {
		if (callBackHandler.onResponse) {
			callBackHandler.onResponse("error");
		}
	}
}


function onUserAgentTransportConnected() {
	webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent('connected');
	webRTCStatus = "ready";
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("started", "CONNECTION");
	if (callBackHandler != null) {
		if (callBackHandler.onResponse) {
			callBackHandler.onResponse("offline");
		}
	}

	registerer.stateChange.addListener(registererStateEventListner);
	registerer.waitingChange.addListener(registererWaitingChangeListener);
	registerer.register();

}


function cleanupRegistererTimer() {
	if (registerer) {

		try {
			registerer.clearTimers();
			registerer.stateChange.removeListener(registererStateEventListner);
			registerer.waitingChange.removeListener(registererWaitingChangeListener);


		} catch (e) {
			logger.log("sipjsphone: cleanupRegistererTimer: ERROR", e);

		}
		registerer = null;
	}
}

function onUserAgentTransportDisconnected() {

	webRTCStatus = "offline";
	setRegisterFlag(false);

	cleanupRegistererTimer();

	webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent('disconnected');
	webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("failed_to_start", "CONNECTION");
	if (callBackHandler != null) {
		if (callBackHandler.onResponse) {
			callBackHandler.onResponse("error");
		}
	}




}


function parseSipMessage(message) {
	var lines = message.split("\n");
	var firstLine = lines[0];
	lines.slice(0, 1);
	var sipob = {};
	var arr = firstLine.split(" ");
	if (firstLine.startsWith("SIP")) {
		sipob.statusCode = arr[1];
	} else {
		sipob.method = arr[0];
	}
	for (var i = 0; i < lines.length; i++) {


		var line = lines[i];
		if (line) {
			arr = line.split(":");

			var key = arr[0].replace("-", "");
			var val = arr[1];
			sipob[key] = val;
		}

	}

	return sipob;
}

function handleWebSocketMessageContent(content, direction) {
	var lines = content.split('\n');
	lines.splice(0, 2);
	var newtext = lines.join('\n');


	var sipMessage = parseSipMessage(newtext);

	switch (direction) {
		case "sent":

			if (sipMessage.method == "REGISTER")
				webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("sent_request", "CONNECTION");

			webrtcSIPPhoneEventDelegate.onCallStatSipSendCallback(newtext, "sipjs");


			break;
		case "recv":
			webrtcSIPPhoneEventDelegate.onCallStatSipRecvCallback(newtext, "sipjs");
			break;
		default:
			break;
	}

}





function setRegisterFlag(b) {
	register_flag = b;
}

function toggleMute(s, mute) {
	let pc = s.sessionDescriptionHandler.peerConnection;
	if (pc.getSenders) {
		pc.getSenders().forEach(function (sender) {
			if (sender.track) {
				sender.track.enabled = !mute;
			}
		});
	} else {
		pc.getLocalStreams().forEach(function (stream) {
			stream.getAudioTracks().forEach(function (track) {
				track.enabled = !mute;
			});
			stream.getVideoTracks().forEach(function (track) {
				track.enabled = !mute;
			});
		});
	}
	if (mute) {
		onMuted(s);
	} else {
		onUnmuted(s);
	}
}


function onMuted(s) {
	webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('muted');
	s.isMuted = true;
	ctxSip.setCallSessionStatus("Muted");
}

function onUnmuted(s) {
	webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('unmuted');
	s.isMuted = false;
	ctxSip.setCallSessionStatus("Answered");
}

function onHold(s) {
	//webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('hold');
	logger.warn(`[${s.id}] re-invite request was accepted`);
	s.held = true;
	enableSenderTracks(!s.held && !s.isMuted);
	enableReceiverTracks(!s.held);
	//ctxSip.setCallSessionStatus("Hold");
}

function onUnhold(s) {
	//webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('unhold');
	logger.warn(`[${s.id}] re-invite request was rejected`);
	s.held = false;
	enableSenderTracks(!s.held && !s.isMuted);
	enableReceiverTracks(!s.held);
	//ctxSip.setCallSessionStatus("Unhold");
}

/** Helper function to enable/disable media tracks. */
function enableReceiverTracks(s, enable) {
	try {
		const sessionDescriptionHandler = s.sessionDescriptionHandler;
		const peerConnection = sessionDescriptionHandler.peerConnection;
		if (!peerConnection) {
			throw new Error("Peer connection closed.");
		}
		peerConnection.getReceivers().forEach((receiver) => {
			logger.log("sipjsphone: enableReceiverTracks: Receiver ", receiver)
			if (receiver.track) {
				receiver.track.enabled = enable;
			}
		});
	} catch (e) {
		logger.log("sipjsphone: enableReceiverTracks: Error in updating receiver tracks  ", e)

	}
}

/** Helper function to enable/disable media tracks. */
function enableSenderTracks(s, enable) {
	try {
		const sessionDescriptionHandler = s.sessionDescriptionHandler;
		const peerConnection = sessionDescriptionHandler.peerConnection;
		if (!peerConnection) {
			throw new Error("Peer connection closed.");
		}
		peerConnection.getSenders().forEach((sender) => {
			if (sender.track) {
				sender.track.enabled = enable;
			}
		});
	} catch (e) {
		logger.log("sipjsphone: enableSenderTracks: Error in updating sender tracks  ", e)
	}
}

function toggleHold(s, hold) {
	const options = {
		requestDelegate: {
			onAccept: () => {
				onHold(s)
			},
			onReject: () => {
				onUnhold(s)
			}
		},
		sessionDescriptionHandlerOptions: {
			hold: hold
		}
	};
	s.invite(options).then(() => {
		// preemptively enable/disable tracks
		enableReceiverTracks(s, !hold);
		enableSenderTracks(s, !hold && !s.isMuted);
	}).catch((error) => {
		logger.error(`Error in hold request [${s.id}]`);
	});
}

function assignStream(stream, element) {
	if (audioDeviceManager.currentAudioOutputDeviceId != "default")
		element.setSinkId(audioDeviceManager.currentAudioOutputDeviceId);
	// Set element source.
	element.autoplay = true; // Safari does not allow calling .play() from a
	// non user action
	element.srcObject = stream;

	// Load and start playback of media.
	element.play().catch((error) => {
		logger.error("Failed to play media");
		logger.error(error);
	});

	// If a track is added, load and restart playback of media.
	stream.onaddtrack = () => {
		element.load(); // Safari does not work otheriwse
		element.play().catch((error) => {
			logger.error("Failed to play remote media on add track");
			logger.error(error);
		});
	};

	// If a track is removed, load and restart playback of media.
	stream.onremovetrack = () => {
		element.load(); // Safari does not work otheriwse
		element.play().catch((error) => {
			logger.error("Failed to play remote media on remove track");
			logger.error(error);
		});
	};
}

function onUserSessionAcceptFailed(e) {
	if (e.name == "NotAllowedError" || e.name == "NotFoundError") {
		webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("m_permission_refused", "CALL");
		webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('userMediaFailed');
		webrtcSIPPhoneEventDelegate.onGetUserMediaErrorCallstatCallback();
	} else {
		logger.log("sipjsphone: onUserSessionAcceptFailed: user media failed due to error ", e);
	}
	uiCallTerminated('Media stream permission denied');
}

const SIPJSPhone = {

	init: (onInitDoneCallback) => {

		var preInit = function () {
			logger.log("sipjsphone: init:readyState, calling postInit")
			postInit(onInitDoneCallback);
		}
		var oReadyStateTimer = setInterval(function () {
			if (document.readyState === "complete") {
				clearInterval(oReadyStateTimer);
				logger.log("sipjsphone: init:readyState, calling preinit")
				preInit();
			}
		}, 100);

	},


	loadCredentials: (sipAccountInfo) => {
		txtDisplayName = sipAccountInfo['userName'];
		txtPrivateIdentity = sipAccountInfo['authUser'];
		txtHostNameWithPort = sipAccountInfo["domain"];
		txtHostName = txtHostNameWithPort.split(":")[0];
		txtWebSocketPort = txtHostNameWithPort.split(":")[1];
		txtAccountName = sipAccountInfo['accountName'];
		txtPublicIdentity = "sip:" + txtPrivateIdentity + "@" + txtHostNameWithPort;
		txtPassword = sipAccountInfo["secret"];
		txtRealm = txtHostName;
		txtTurnServer = "drishti@" + txtRealm + ":3478";
		txtCredential = "jrp931";
		txtTurnUri = "'turn:" + txtRealm + ":3478?transport=udp', credential: '" + txtCredential + "', username: 'drishti'";


		var default_values = {
			'security': window.location.protocol == "http:" ? 'ws' : 'wss',
			'sipdomain': txtHostName,
			'contactHost': txtHostName,
			'wsPort': window.location.protocol == "http:" ? 8088 : 8089,
			'sipPort': window.location.protocol == "http:" ? 5060 : 5061,
			'endpoint': 'ws'
		}

		txtSecurity = sipAccountInfo['security'] ? sipAccountInfo['security'] : default_values['security'];
		txtWSPort = txtWebSocketPort ? txtWebSocketPort : default_values['wsPort'];

		if (sipAccountInfo['sipdomain']) {
			txtSipDomain = sipAccountInfo["sipdomain"];
			txtPublicIdentity = "sip:" + txtPrivateIdentity + "@" + txtSipDomain;
		} else {
			txtSipDomain = default_values["sipdomain"];
		}

		if (sipAccountInfo['contactHost']) {
			txtContactHost = sipAccountInfo["contactHost"];
		} else {
			txtContactHost = default_values["contactHost"];
		}

		txtSipPort = sipAccountInfo['sipPort'] ? sipAccountInfo["sipPort"] : default_values["sipPort"];
		endpoint = sipAccountInfo['endpoint'] ? sipAccountInfo['endpoint'] : default_values['endpoint'];

		txtWebsocketURL = txtSecurity + "://" + txtHostName + ":" + txtWSPort + "/" + endpoint;
		txtUDPURL = "udp://" + txtHostName + ":" + txtSipPort;


		var oInitializeCompleteTimer = setTimeout(function () {
			if (initializeComplete == true) {
				sipRegister();
			}
		}, 500);
	},

	getStatus: () => {
		return webRTCStatus;
	},

	registerCallBacks: (handler) => {
		callBackHandler = handler;
	},

	sipSendDTMF: (c) => {
		ctxSip.sipSendDTMF(c);
	},

	sipToggleRegister: () => {
		if (register_flag == false) {
			register_flag = true;
			sipRegister();

		} else if (register_flag == true) {
			registerer.unregister({});
			register_flag = false;
			webRTCStatus = "offline";
			if (callBackHandler != null)
				if (callBackHandler.onResponse)
					callBackHandler.onResponse("error");

		}
	},

	reRegister: () => {
		logger.log("sipjsphone: reRegister: registering in case of relogin");
		if (ctxSip.phone && registerer) {
			registerer.register({});
		} else {
			logger.log("sipjsphone: reRegister: SIP Session does not exist for re registration");
		}

	},

	sipToggleMic: () => {
		ctxSip.phoneMuteButtonPressed(ctxSip.callActiveID);
	},

	sipMute: (bMute) => {
		ctxSip.phoneMute(ctxSip.callActiveID, bMute);
	},

	holdCall: () => {
		if (ctxSip.callActiveID) {
			ctxSip.phoneHoldButtonPressed(ctxSip.callActiveID);
		}
	},

	sipHold: (bHold) => {
		if (ctxSip.callActiveID) {
			ctxSip.phoneHold(ctxSip.callActiveID, bHold);
		}
	},

	getMicMuteStatus: () => {
		return bMicEnable;
	},

	setPreferredCodec: (codecName) => {
		logger.log("sipjsphone:setPreferredCodec entry");
		const codecPayloadTypes = {
			opus: { payloadType: 111, rtpMap: "opus/48000/2", fmtp: "minptime=10;useinbandfec=1" },
		};

		const preferredCodec = codecPayloadTypes[codecName.toLowerCase()];
		if (!preferredCodec) {
			logger.error("sipjsphone:setPreferredCodec: Unsupported code" + codecName + "specified.");
			SIPJSPhone.preferredCodec = null; // Clear codec details if unsupported
			return;
		}

		SIPJSPhone.preferredCodec = preferredCodec;
		logger.log("sipjsphone:setPreferredCodec: Preferred codec set to " + codecName);
	},

	pickPhoneCall: () => {
		var newSess = ctxSip.Sessions[ctxSip.callActiveID];
		logger.log("sipjsphone: pickphonecall: ", ctxSip.callActiveID);
		if (newSess) {
			if (audioDeviceManager.currentAudioInputDeviceId != "default") {
				newSess.accept({
					sessionDescriptionHandlerOptions: {
						constraints: { audio: { deviceId: audioDeviceManager.currentAudioInputDeviceId }, video: false }
					},
					sessionDescriptionHandlerModifiers: [addPreferredCodec]
				}).catch((e) => {
					onUserSessionAcceptFailed(e);
				});
			} else {

				newSess.accept({
					sessionDescriptionHandlerModifiers: [addPreferredCodec]
				}).catch((e) => {
					onUserSessionAcceptFailed(e);
				});
			}
		}

	},


	sipHangUp: () => {
		ctxSip.sipHangUp(ctxSip.callActiveID);
	},


	playBeep: () => {
		try {
			ctxSip.beeptone.play();
		} catch (e) {
			logger.log("sipjsphone: playBeep: Exception:", e);
		}
	},

	sipUnRegister: () => {
		if (ctxSip.phone && registerer) {
			registerer.unregister({}).then(function () {
				destroySocketConnection();
			});
		} else {
			if (ctxSip.phone) {
				destroySocketConnection();
			}
		}
	},

	connect: () => {
		try {
			sipRegister();
		} catch (e) {
		}
	},

	disconnect: () => {
		if (registerer) {
			cleanupRegistererTimer();
		}
		if (ctxSip.phone && ctxSip.phone.transport) {
			ctxSip.phone.transport.stateChange.removeListener(transportStateChangeListener);
			if (ctxSip.phone && ctxSip.phone.transport.isConnected()) {
				destroySocketConnection();
			}
		}
	},
	/* NL Additions - Start */
	getSpeakerTestTone: () => {
		logger.log("sipjsphone: getSpeakerTestTone: Returning speaker test tone:", ringtone);
		return ringtone;
	},


	getWSSUrl: () => {
		logger.log("sipjsphone: getWSSUrl: Returning txtWebsocketURL:", txtWebsocketURL);
		return txtWebsocketURL;
	},
	/* NL Additions - End */
	getTransportState: () => {
		logger.log("sipjsphone: getTransportState: Returning Transport State : ", lastTransportState);
		return lastTransportState;
	},
	getRegistrationState: () => {
		logger.log("sipjsphone: getRegistrationState: Returning Registration State : ", lastRegistererState);
		return lastRegistererState;
	},

	changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange) {
		logger.log(`SIPJSPhone: changeAudioInputDevice called with deviceId=${deviceId}, forceDeviceChange=${forceDeviceChange}, enableAutoAudioDeviceChangeHandling=${enableAutoAudioDeviceChangeHandling}`);
		audioDeviceManager.changeAudioInputDevice(deviceId, function (stream) {
			const trackChanged = SIPJSPhone.replaceSenderTrack(stream, deviceId);
			if (trackChanged) {
				audioDeviceManager.currentAudioInputDeviceId = deviceId;
				logger.log(`sipjsphone: changeAudioInputDevice: Input device changed to: ${deviceId}`);

				onSuccess();
			} else {
				logger.error("sipjsphone: changeAudioInputDevice: failed");
				onError("replaceSenderTrack failed for webrtc");
			}
		}, onError, forceDeviceChange);
	},
	changeAudioOutputDeviceForAdditionalAudioElement(deviceId) {
		const additionalAudioElements = [ringtone, beeptone, ringbacktone, dtmftone];
		let i = 0;
		let elem;
		try {
			for (i = 0; i < additionalAudioElements.length; i++) {
				elem = additionalAudioElements[i];
				elem.load();
				elem.setSinkId(deviceId);
			}
		} catch (e) {
			logger.error("sipjsphone:changeAudioOutputDeviceForAdditionalAudioElement failed to setSink for additonal AudioElements", e);
		}
	},
	changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange) {
		logger.log(`SIPJSPhone: changeAudioOutputDevice called with deviceId=${deviceId}, forceDeviceChange=${forceDeviceChange}, enableAutoAudioDeviceChangeHandling=${enableAutoAudioDeviceChangeHandling}`);
		if (!ctxSip.callActiveID) {
			audioRemote = document.createElement("audio");
		}
		audioDeviceManager.changeAudioOutputDevice(audioRemote, deviceId, function () {
			SIPJSPhone.changeAudioOutputDeviceForAdditionalAudioElement(deviceId);
			onSuccess();
		}, onError, forceDeviceChange);
	},

	stopStreamTracks(stream) {
		try {
			if (stream) {
				const tracks = stream.getTracks();
				tracks.forEach((track) => {
					track.stop();
				});
			}
		} catch (e) {
			logger.error("sipjsphone:stopStreamTracks failed to stop tracks");
		}
	},
	replaceSenderTrack(stream, deviceId) {
		try {

			if (audioDeviceManager.currentAudioInputDeviceId == deviceId) {
				SIPJSPhone.stopStreamTracks(stream);
				return false;
			}
			if (ctxSip.callActiveID) {
				ctxSip.Stream = stream;
				const s = ctxSip.Sessions[ctxSip.callActiveID];
				const pc = s.sessionDescriptionHandler.peerConnection;
				if (pc.getSenders) {
					try {
						const [audioTrack] = stream.getAudioTracks();
						const sender = pc.getSenders().find((s) => s.track.kind === audioTrack.kind);
						sender.track.stop();
						sender.replaceTrack(audioTrack);
					} catch (e) {
						logger.error(`replaceSenderTrack unable to replace track for stream for device id ${deviceId} `, stream);
					}
				}
			} else {
				SIPJSPhone.stopStreamTracks(stream);
			}
			return true;
		} catch (e) {
			return false;
		}

	},
	registerLogger(customLogger) {
		logger = customLogger;
	},
	audioInputDeviceChangeCallback: null,
	audioOutputDeviceChangeCallback: null,
	onDeviceChangeCallback: null,
	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
		logger.log(`sipjsphone: registerAudioDeviceChangeCallback: entry`);
		SIPJSPhone.audioInputDeviceChangeCallback = audioInputDeviceChangeCallback;
		SIPJSPhone.audioOutputDeviceChangeCallback = audioOutputDeviceChangeCallback;
		SIPJSPhone.onDeviceChangeCallback = onDeviceChangeCallback;
	},
	attachGlobalDeviceChangeListener() {
		logger.log("SIPJSPhone: Attaching global devicechange event listener (enableAutoAudioDeviceChangeHandling is true)");
		navigator.mediaDevices.addEventListener('devicechange', (event) => {
			try {
				if (!ctxSip.callActiveID) {
					audioRemote = document.createElement("audio");
				}
				audioDeviceManager.enumerateDevices(() => {
					if (SIPJSPhone.onDeviceChangeCallback) {
						logger.info("SIPJSPhone:ondevicechange relaying event to callback");
						SIPJSPhone.onDeviceChangeCallback(event);
					}
					audioDeviceManager.onAudioDeviceChange(
						audioRemote,
						(stream, deviceId) => {
							const trackChanged = SIPJSPhone.replaceSenderTrack(stream, deviceId);
							if (trackChanged) {
								audioDeviceManager.currentAudioInputDeviceId = deviceId;
								if (SIPJSPhone.audioInputDeviceChangeCallback) {
									SIPJSPhone.audioInputDeviceChangeCallback(deviceId);
								}
							}
						},
						(deviceId) => {
							SIPJSPhone.changeAudioOutputDeviceForAdditionalAudioElement(deviceId);
							audioDeviceManager.currentAudioOutputDeviceId = deviceId;
							if (SIPJSPhone.audioOutputDeviceChangeCallback) {
								SIPJSPhone.audioOutputDeviceChangeCallback(deviceId);
							}
						}
					);
				});
			} catch (e) {
				logger.error("SIPJSPhone:ondevicechange something went wrong during device change", e);
			}
		});
	},
    setEnableAutoAudioDeviceChangeHandling(flag) {
		logger.log("sipjsphone: setEnableAutoAudioDeviceChangeHandling: entry, enableAutoAudioDeviceChangeHandling = ",flag);
        enableAutoAudioDeviceChangeHandling = flag;
		audioDeviceManager.setEnableAutoAudioDeviceChangeHandling(flag);
    }
};



export default SIPJSPhone;
