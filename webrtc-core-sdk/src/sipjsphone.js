/*
 * SIPJS WebRTC SIP Phone - to interact with SIPJS Library
 */

var SIP = require('./sip-0.20.0.js')
import webrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';


var videoRemote, videoLocal, audioRemote;
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

videoLocal = document.createElement("video");//getElementById("video_local");
videoRemote = document.createElement("video");//getElementById("video_remote");

let txtDisplayName, txtPrivateIdentity, txtHostNameWithPort, txtHostName, txtWebSocketPort, txtAccountName;
let txtSecurity, txtSipDomain, txtWSPort, txtSipPort, txtSipSecurePort, txtContactHost;
let txtPassword, txtRealm, txtTurnServer, txtCredential, txtTurnUri, txtWebsocketURL, txtUDPURL;


let register_flag = false;
var ctxSip = {};
var registerer = null;

const logger = console; //AmeyoLogger.get("sipjsphone");
logger.log(SIP);
/* NL Additions - Start */

export function getLogger() {

	try {
		let userAgent = SIP.UserAgent
		uaLogger = userAgent.getLogger("sip.WebrtcLib")
		//let loggerFactory = userAgent.getLoggerFactory()
	} catch (e) {
		console.log("No userAgent.getLogger: Using console log")
		return console;
	}
	
	if (uaLogger) {
		return uaLogger;
	}
	else {
		console.log("No Logger: Using console log")
		return logger;
	}
}

/* NL Additions - End */

//var intervalID = 0;
function postInit() {

	ctxSip = {
		config: {},
		ringtone: ringtone,
		ringbacktone: ringbacktone,
		dtmfTone: document.getElementById('dtmfTone'),
		beeptone: beeptone,
		Sessions: [],
		callTimers: {},
		callActiveID: null,
		callVolume: 1,
		Stream: null,
		ringToneIntervalID: 0,
		ringtoneCount:30,

		startRingTone: function () {
			try {
				var count = 0;
				if (!ctxSip.ringtone) {
					ctxSip.ringtone = ringtone;
				}
				ctxSip.ringtone.load(); 
				ctxSip.ringToneIntervalID = setInterval(function(){
				ctxSip.ringtone.play()
				.then(() => {
					// Audio is playing.
					logger.log("startRingTone: Audio is playing: count=" + count + " ctxSip.ringToneIntervalID=" + ctxSip.ringToneIntervalID + " ctxSip.ringtoneCount=" + ctxSip.ringtoneCount);
				  })
				  .catch(e => {
					logger.log("startRingTone: Exception:", e);
				  });
				  count++;
				  if(count > ctxSip.ringtoneCount){
					clearInterval(ctxSip.ringToneIntervalID);
				  }				  
				},500)



			} catch (e) { logger.log("startRingTone: Exception:", e); }
		},

		stopRingTone: function () {
			try { 
				
				if (!ctxSip.ringtone) {
					ctxSip.ringtone = ringtone;
				}
				ctxSip.ringtone.pause(); 
				logger.log("stopRingTone: intervalID:", ctxSip.ringToneIntervalID);
				clearInterval(ctxSip.ringToneIntervalID) 
			} catch (e) {  logger.log("stopRingTone: Exception:", e); }
		},

		startRingbackTone: function () {
			if (!ctxSip.ringbacktone) {
				ctxSip.ringbacktone = ringbacktone;
			}				
			try { ctxSip.ringbacktone.play().then(() => {
				// Audio is playing.
				logger.log("startRingbackTone: Audio is playing:");
			  })
			  .catch(e => {
				logger.log("startRingbackTone: Exception:", e);
			  });
			} catch (e) { logger.log("startRingbackTone: Exception:", e); }
		},

		stopRingbackTone: function () {
			if (!ctxSip.ringbacktone) {
				ctxSip.ringbacktone = ringbacktone;
			}			
			try { ctxSip.ringbacktone.pause(); } catch (e) { logger.log("stopRingbackTone: Exception:", e); }
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
					logger.log("something went wrong while initing getstats");
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
				setTimeout(sipCall,500);
				
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
			} else if(s.state==SIP.SessionState.Established) {
				s.bye();
			} else if(s.reject) {
				s.reject();

			} else if(s.cancel) {
				s.cancel();
			}
			

		},

		sipSendDTMF: function (digit) {

			try { ctxSip.dtmfTone.play(); } catch (e) { logger.log("sipSendDTMF: Exception:", e);}

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
				const duration = 2000;
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
		phoneMute: function(sessionid, bMute) {
			if (sessionid) {
				var s = ctxSip.Sessions[sessionid];
				console.log("phoneMute: bMute", bMute)
				toggleMute(s, bMute);
				bMicEnable = !bMute;
			}
		},

		phoneHold: function(sessionid, bHold) {
			if (sessionid) {
				var s = ctxSip.Sessions[sessionid];
				console.log("phoneHold: bHold", bHold)
				toggleHold(s, bHold);
				bHoldEnable = bHold;
			}
		},

		phoneHoldButtonPressed : function(sessionid) {
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
				window.console.error("WebRTC support not found");
				return false;
			}
		}

	};


	if (!ctxSip.hasWebRTC) {
		alert('Your browser don\'t support WebRTC.\naudio/video calls will be disabled.');
	}
	webrtcSIPPhoneEventDelegate.setWebRTCFSMMapper("sipjs");
	logger.log("init: Initialization complete...")
	initializeComplete = true;
}

function sipRegister() {

	
	
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
				expires: 60
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

	registerer = new SIP.Registerer(ctxSip.phone, { expires: 60, refreshFrequency: 80 });
	

	ctxSip.phone.delegate.onInvite = (incomingSession) => {
		if (ctxSip.callActiveID == null) {
			webrtcSIPPhoneEventDelegate.onRecieveInvite();
			
			webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("i_new_call", "CALL");
			var s = incomingSession;
			s.direction = 'incoming';
			ctxSip.newSession(s);
		} else {
			incomingSession.reject();
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
		logger.log("ERROR", e);
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
		logger.log("testing emit accept_reject");
		webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("accept_reject", "CALL");
}




function sipPhoneLogger(level, category, label, content) {
	try {
		if(content) {
			if (content.startsWith("Sending WebSocket")) {
				handleWebSocketMessageContent(content, "sent");
			} else if (content.startsWith("Received WebSocket text message")) {
				handleWebSocketMessageContent(content, "recv");
			}
			logger.log(level + " sipjslog: " + category + ": " + content);
		}
	} catch (e) {
		logger.error("ERROR", e);
	}

}


function onInvitationSessionAccepted(newSess) {

	if (!audioRemote) {
		audioRemote = document.createElement("audio");
		//audioRemote.setAttribute("id", "audio_remote");
		console.log("No audio remote id .... ")
	}

	if (audioRemote) {
		assignStream(newSess.sessionDescriptionHandler.remoteMediaStream, audioRemote);
	}

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
			logger.log("ERROR", e);

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


function parseSipMessage(message){
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
		
			if (sipMessage.method == "CONNECTION")
				webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("sent_request", sipMessage.method);

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
			console.log("Receiver ", receiver)
			if (receiver.track) {
				receiver.track.enabled = enable;
			}
		});
	} catch (e) {
		console.log("enableReceiverTracks: Error in updating receiver tracks  ", e)

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
		console.log("enableSenderTracks: Error in updating sender tracks  ", e)
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
		enableReceiverTracks(s,!hold);
		enableSenderTracks(s, !hold && !s.isMuted);
	}).catch((error) => {
		logger.error(`Error in hold request [${s.id}]`);
	}); 
}

function assignStream(stream, element) {
	// Set element source.
	element.autoplay = true; // Safari does not allow calling .play() from a
	// non user action
	element.srcObject = stream;

	// Load and start playback of media.
	element.play().catch((error) => {
		console.error("Failed to play media");
		console.error(error);
	});

	// If a track is added, load and restart playback of media.
	stream.onaddtrack = () => {
		element.load(); // Safari does not work otheriwse
		element.play().catch((error) => {
			console.error("Failed to play remote media on add track");
			console.error(error);
		});
	};

	// If a track is removed, load and restart playback of media.
	stream.onremovetrack = () => {
		element.load(); // Safari does not work otheriwse
		element.play().catch((error) => {
			console.error("Failed to play remote media on remove track");
			console.error(error);
		});
	};
}

function onUserSessionAcceptFailed(e) {
	if (e.name == "NotAllowedError" || e.name=="NotFoundError") {
		webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("m_permission_refused", "CALL");
		webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('userMediaFailed');
		webrtcSIPPhoneEventDelegate.onGetUserMediaErrorCallstatCallback();
	} else {
		logger.log("user media failed due to error ", e);
	}
	uiCallTerminated('Media stream permission denied');
}

const SIPJSPhone = {

		init: () => {

			videoLocal = document.getElementById("video_local");
			videoRemote = document.getElementById("video_remote");
			audioRemote = document.getElementById("audio_remote");
			var preInit = function () {
				logger.log("init:readyState, calling postInit")
				postInit();
			}
			var oReadyStateTimer = setInterval(function () {
				if (document.readyState === "complete") {
					clearInterval(oReadyStateTimer);
					logger.log("init:readyState, calling preinit")
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
			if (!txtWebSocketPort) {
				txtWebSocketPort = 8089;
			}
			/*txtWebsocketURL = "wss://" + txtHostName + ":" + txtWebSocketPort + "/ws";
			txtUDPURL = "udp://" + txtHostName + ":5061";
			if (window.location.protocol == "http:") {
				txtWebsocketURL = "ws://" + txtHostName + ":8088/ws";
				txtUDPURL = "udp://" + txtHostName + ":5060";
			}*/

			/* NL needs extra params and we pass it in sipAccountInfo.
			   For these extra params, Ameyo does not have any entries and hence we fill
			   default values for Ameyo.
			*/

			var default_values = {
				'security':'ws',
				'sipdomain':txtHostName,
				'contactHost':txtHostName,
				'wsPort' : 8088,
				'udpPort' : 5060,
				'tcpPort' : 5061
			}

			if (sipAccountInfo['security']) {
				txtSecurity = sipAccountInfo['security'];
			} else {
				txtSecurity = default_values['security'];
			}

			if (sipAccountInfo['sipdomain']) {
				txtSipDomain = sipAccountInfo["sipdomain"];
				txtPublicIdentity = "sip:" + txtPrivateIdentity + "@" + txtSipDomain;
			} else {
				txtSipDomain = default_values["sipdomain"];
			}


			if (sipAccountInfo['contactHost']) {
				txtContactHost = sipAccountInfo["contactHost"]; //NL contact host seperate from viaHost
			} else {
				txtContactHost = default_values["contactHost"]; //NL contact host seperate from viaHost
			}

			/*if (sipAccountInfo['wsPort']) {
				txtWSPort = sipAccountInfo['wsPort'];
			} else {
				txtWSPort = default_values["wsPort"];
			}*/
			txtWSPort = txtWebSocketPort;

			if (sipAccountInfo['sipPort']) {
				txtSipPort = sipAccountInfo["sipPort"];
			} else {
				txtSipPort = default_values["sipPort"];
			}

			if (sipAccountInfo['sipSecurePort']) {
				txtSipSecurePort = sipAccountInfo["sipSecurePort"];
			} else {
				txtSipSecurePort = default_values["sipSecurePort"];
			}

			/* We need to recalculate the Websocket URL
			   based on the values above
			*/

			var loadCredentials_port_fn = function(sipAccountInfo) {
					console.log("loadCredentials_extra:", sipAccountInfo);
					if (txtSecurity == 'ws') {
						txtWebsocketURL = "ws://" + txtHostName + ":" + txtWSPort + "/ws";
						txtUDPURL = "udp://" + txtHostName + ":" + txtSipPort;
						if (window.location.protocol == "http:") {
							txtWebsocketURL = "ws://" + txtHostName + ":" + txtWSPort + "/ws";
							txtUDPURL = "udp://" + txtHostName + ":" + txtSipPort;
							logger.log("ws http : " + txtSipPort);
						} else {
							/* Cannot send with "ws" plain when client is https. Means for https, we need to force wss.
							   Q: Can cient and proxy be on different servers?
								  We need not have this if condition in that case.
							 */
							txtWebsocketURL = "wss://" + txtHostName + ":" + txtWSPort + "/ws";
							txtUDPURL = "udp://" + txtHostName + ":" + txtSipSecurePort;
						}

					} else {

						txtWebsocketURL = "wss://" + txtHostName + ":" + txtWSPort + "/wss";
						txtUDPURL = "udp://" + txtHostName + ":" + txtSipSecurePort;
						logger.log("wss udp :" + txtSipSecurePort);
						if (window.location.protocol == "http:") {
							txtWebsocketURL = "wss://" + txtHostName + ":" + txtWSPort + "/wss";
							txtUDPURL = "udp://" + txtHostName + ":" + txtSipSecurePort;
						}
						logger.log("wss http : " + txtWSPort);
						logger.log("wss txtWebsocketURL : " + txtWebsocketURL);
					}
			}

			loadCredentials_port_fn(sipAccountInfo)

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
			logger.log("sipjs: registering in case of relogin");
			if (ctxSip.phone && registerer) {
				registerer.register({});
			} else {
				logger.log("sipjs: SIP Session does not exist for re registration");
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

		pickPhoneCall: () => {
			var newSess = ctxSip.Sessions[ctxSip.callActiveID];
			logger.log("pickphonecall ",ctxSip.callActiveID);
			if(newSess) {
				newSess.accept().catch((e) => {
					onUserSessionAcceptFailed(e);
				});	
			}
			
		},


		sipHangUp: () => {
			ctxSip.sipHangUp(ctxSip.callActiveID);
		},


		playBeep: () => {
			try {
				ctxSip.beeptone.play();
			} catch (e) {
				logger.log("playBeep: Exception:", e);
			}
		},

		sipUnRegister: () => {
			if (ctxSip.phone && registerer) {
				registerer.unregister({}).then(function(){
					destroySocketConnection();
				});
			} else {
				if (ctxSip.phone ) {
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
		
		disconnect :  () => {
			if(registerer) {
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
			console.log("Returning speaker test tone:", ringtone);
			return ringtone;
		},


		getWSSUrl: () => {
			console.log("Returning txtWebsocketURL:", txtWebsocketURL);
			return txtWebsocketURL;
		}
		/* NL Additions - End */


	};

export default SIPJSPhone;
