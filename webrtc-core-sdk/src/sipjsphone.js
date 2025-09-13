var SIP = require('./sip-0.20.0.js')
import { audioDeviceManager } from './audioDeviceManager.js';
import coreSDKLogger from './coreSDKLogger.js';
import WebrtcSIPPhoneEventDelegate from './webrtcSIPPhoneEventDelegate';
let logger = coreSDKLogger;

var beeptone = document.createElement("audio");
beeptone.src = require("./static/beep.wav");
var ringtone = document.createElement("audio");
ringtone.src = require("./static/ringtone.wav");
var ringbacktone = document.createElement("audio");
ringbacktone.src = require("./static/ringbacktone.wav");
var dtmftone = document.createElement("audio");
dtmftone.src = require("./static/dtmf.wav");

class SIPJSPhone {

	static toBeConfigure = true;
	static audioElementNameVsAudioGainNodeMap = {};

	static configure() {
		logger.log("SIPJSPhone: configure: entry");
		SIPJSPhone.audioElementNameVsAudioGainNodeMap["ringtone"] = audioDeviceManager.createAndConfigureAudioGainNode(ringtone);
		SIPJSPhone.audioElementNameVsAudioGainNodeMap["ringbacktone"] = audioDeviceManager.createAndConfigureAudioGainNode(ringbacktone);
		SIPJSPhone.audioElementNameVsAudioGainNodeMap["dtmftone"] = audioDeviceManager.createAndConfigureAudioGainNode(dtmftone);
		SIPJSPhone.audioElementNameVsAudioGainNodeMap["beeptone"] = audioDeviceManager.createAndConfigureAudioGainNode(beeptone);
	}
	

	constructor(delegate, username) {
		if(SIPJSPhone.toBeConfigure) {
			SIPJSPhone.toBeConfigure = false;
			SIPJSPhone.configure();
		}
		this.webrtcSIPPhoneEventDelegate = delegate;
		this.username = username;
		this.ctxSip = {};
		this.lastRegistererState = "";
		this.lastTransportState = "";
		this.registererTimer = null;
		this.txtDisplayName = "";
		this.txtPassword = "";
		this.txtPrivateIdentity = "";
		this.txtPublicIdentity = "";
		this.txtRealm = "";
		this.txtHostName = "";
		this.txtSipDomain = "";
		this.txtWebsocketURL = "";
		this.txtWebSocketPort = "";
		this.txtHostNameWithPort = "";
		this.txtSecurity = "";
		this.txtWSPort = "";
		this.endpoint = "";
		this.preferredCodec = null;
		this.userAgent = null;
		this.registerer = null;
		this.session = null;
		this.remoteStream = null;
		this.localStream = null;
		this.registerAttempts = 0;
		this.maxRegisterAttempts = 3;
		this.registerTimer = null;
		this.isRegistered = false;
		this.isConnecting = false;
		this.isDisconnected = false;
		this.isMuted = false;
		this.isHold = false;
		this.isCallActive = false;
		this.isCallEnded = false;
		this.isCallRejected = false;
		this.isCallAccepted = false;
		this.isCallInProgress = false;
		this.isCallEstablished = false;
		this.isCallTerminated = false;
		this.isCallFailed = false;
		this.isCallBusy = false;
		this.isCallNoAnswer = false;
		this.isCallCanceled = false;
		this.isCallTimeout = false;
		this.isCallError = false;
		this.isCallUnknown = false;
		this.isCallOther = false;
		this.isCallNone = false;
		this.isCallAll = false;
		this.isCallAny = false;
		this.isCallSome = false;
		this.isCallMany = false;
		this.isCallFew = false;
		this.isCallSeveral = false;
		this.isCallNumerous = false;
		this.isCallCountless = false;
		this.isCallInnumerable = false;
		this.isCallUncountable = false;
		this.isCallInfinite = false;
		this.isCallEndless = false;
		this.isCallBoundless = false;
		this.isCallLimitless = false;
		this.isCallUnlimited = false;
		this.isCallUnrestricted = false;
		this.isCallUnconstrained = false;
		this.isCallUnbounded = false;
		this.isCallUnconfined = false;
		this.isCallUnfettered = false;
		this.isCallUnhampered = false;
		this.isCallUnhindered = false;
		this.isCallUnimpeded = false;
		this.isCallUnobstructed = false;
		this.isCallUnrestrained = false;
		this.isCallUnrestricted = false;
		this.isCallUnshackled = false;
		this.isCallUntrammeled = false;
		this.bMicEnable = true;
		this.bHoldEnable = false;
		this.register_flag = false;
		this.enableAutoAudioDeviceChangeHandling = false;
		this.addPreferredCodec = this.addPreferredCodec.bind(this);

		this.ringtone = ringtone;
		this.beeptone = beeptone;
		this.ringbacktone = ringbacktone;
		this.dtmftone = dtmftone;
		this.audioRemote = document.createElement("audio");
		this.audioRemote.style.display = 'none';
		document.body.appendChild(this.audioRemote);

		this.audioRemoteGainNode = null;
		this.audioRemoteSourceNode = null;
		this.callAudioOutputVolume = 1;
		
	}


	setCallAudioOutputVolume(value) {
		logger.log(`sipjsphone: setCallAudioOutputVolume: ${value}`);
		this.callAudioOutputVolume = Math.max(0, Math.min(1, value));
		
		if(this.audioRemoteGainNode) {
			this.audioRemoteGainNode.gain.value = this.callAudioOutputVolume;
			
			// Ensure audio context is running
			if (audioDeviceManager.webAudioCtx.state === "suspended") {
				audioDeviceManager.webAudioCtx.resume();
			}
		}
		return true;
	}

	getCallAudioOutputVolume() {
		logger.log(`sipjsphone: getCallAudioOutputVolume`);
		return this.callAudioOutputVolume;
	}

	// Volume control methods
	static setAudioOutputVolume(audioElementName, value) {
		
		logger.log(`SIPJSPhone: setAudioOutputVolume: ${audioElementName} volume set to ${value}`);
		if(!SIPJSPhone.audioElementNameVsAudioGainNodeMap.hasOwnProperty(audioElementName)) {
			logger.error(`SIPJSPhone: setAudioOutputVolume: Invalid audio element name: ${audioElementName}`);
			throw new Error(`Invalid audio element name: ${audioElementName}`);
		}

		let gainNode = SIPJSPhone.audioElementNameVsAudioGainNodeMap[audioElementName];
		gainNode.gain.value = Math.max(0, Math.min(1, value));
		logger.log(`SIPJSPhone: setAudioOutputVolume: ${audioElementName} volume set to ${value}`);
		return true;
	
	}

	static getAudioOutputVolume(audioElementName) {
		logger.log(`SIPJSPhone: getAudioOutputVolume: ${audioElementName}`);
		if(!SIPJSPhone.audioElementNameVsAudioGainNodeMap.hasOwnProperty(audioElementName)) {
			logger.error(`SIPJSPhone: getAudioOutputVolume: Invalid audio element name: ${audioElementName}`);
			throw new Error(`Invalid audio element name: ${audioElementName}`);
		}
		let gainNode = SIPJSPhone.audioElementNameVsAudioGainNodeMap[audioElementName];
		return gainNode.gain.value;	
	}

	attachGlobalDeviceChangeListener() {
		logger.log("SIPJSPhone: Attaching global devicechange event listener enableAutoAudioDeviceChangeHandling = ", this.enableAutoAudioDeviceChangeHandling);
		navigator.mediaDevices.addEventListener('devicechange', this._onDeviceChange.bind(this));
	}

	setEnableAutoAudioDeviceChangeHandling(flag) {
		logger.log("sipjsphone: setEnableAutoAudioDeviceChangeHandling: entry, enableAutoAudioDeviceChangeHandling = ",flag);
        this.enableAutoAudioDeviceChangeHandling = flag;
		audioDeviceManager.setEnableAutoAudioDeviceChangeHandling(flag);
    }

	init(onInitDoneCallback) {

		const preInit = () => {
			logger.log("sipjsphone: init:readyState, calling postInit")
			this.postInit(onInitDoneCallback);
		}

		const oReadyStateTimer = setInterval(() => {
			if (document.readyState === "complete") {
				clearInterval(oReadyStateTimer);
				logger.log("sipjsphone: init:readyState, calling preinit")
				preInit();
			}
		}, 100);

	}

	postInit(onInitDoneCallback) {
		this.ctxSip = {
		config: {},
			ringtone: this.ringtone,
			ringbacktone: this.ringbacktone,
			dtmfTone: this.dtmftone,
			beeptone: this.beeptone,
		Sessions: [],
		callTimers: {},
		callActiveID: null,
		callVolume: 1,
		Stream: null,
		ringToneIntervalID: 0,
		ringtoneCount: 30,

			startRingTone: () => {
			try {
				var count = 0;
				if (!this.ctxSip.ringtone) {
					this.ctxSip.ringtone = this.ringtone;
				}
				logger.log('DEBUG: startRingTone called, audio element:', this.ctxSip.ringtone);
				logger.log('DEBUG: startRingTone src:', this.ctxSip.ringtone.src);
				this.ctxSip.ringtone.load();
				this.ctxSip.ringToneIntervalID = setInterval(() => {
					this.ctxSip.ringtone.play()
						.then(() => {
							logger.log("DEBUG: startRingTone: Audio is playing...");
						})
						.catch(e => {
							logger.log("DEBUG: startRingTone: Exception:", e);
						});
					count++;
					if (count > this.ctxSip.ringtoneCount) {
						clearInterval(this.ctxSip.ringToneIntervalID);
					}
					}, 500);
				} catch (e) {
					logger.log("DEBUG: startRingTone: Exception:", e);
				}
			},

			stopRingTone: () => {
				try {

					if (!this.ctxSip.ringtone) {
						this.ctxSip.ringtone = this.ringtone;
					}
					this.ctxSip.ringtone.pause();
					logger.log("sipjsphone: stopRingTone: intervalID:", this.ctxSip.ringToneIntervalID);
					clearInterval(this.ctxSip.ringToneIntervalID)
			} catch (e) { logger.log("sipjsphone: stopRingTone: Exception:", e); }
		},

			// Update the startRingbackTone method (around line 223) to use Web Audio:
			startRingbackTone: () => {
				if (!this.ctxSip.ringbacktone) {
					this.ctxSip.ringbacktone = this.ringbacktone;
				}
				try {
					this.ctxSip.ringbacktone.play()
						.then(() => {
							logger.log("sipjsphone: startRingbackTone: Audio is playing...");
						})
						.catch(e => {
							logger.log("sipjsphone: startRingbackTone: Exception:", e);
							// Optionally, prompt user to interact with the page to enable audio
						});
				} catch (e) { logger.log("sipjsphone: startRingbackTone: Exception:", e); }
			},

			stopRingbackTone: () => {
				if (!this.ctxSip.ringbacktone) {
					this.ctxSip.ringbacktone = this.ringbacktone;
				}
				try { this.ctxSip.ringbacktone.pause(); } catch (e) { logger.log("sipjsphone: stopRingbackTone: Exception:", e); }
			},

			getUniqueID: () => {
			return Math.random().toString(36).substr(2, 9);
		},

			newSession: (newSess) => {

			newSess.displayName = newSess.remoteIdentity.displayName || newSess.remoteIdentity.uri.user;
				newSess.ctxid = this.ctxSip.getUniqueID();
				this.ctxSip.callActiveID = newSess.ctxid;


			newSess.stateChange.addListener((newState) => {
				switch (newState) {
					case SIP.SessionState.Establishing:
						break;
					case SIP.SessionState.Established:
							this.onInvitationSessionAccepted(newSess);
						break;
					case SIP.SessionState.Terminated:
							this.onInvitationSessionTerminated();
						break;
					default:
						break;
				}
			});



			newSess.delegate = {};

			newSess.delegate.onSessionDescriptionHandler = (sdh, provisional) => {
				let lastIceState = "unknown";

				try {
						let callId = this.ctxSip.callActiveID;
						let username = this.ctxSip.config.authorizationUsername;
					let pc = sdh._peerConnection;
						this.webrtcSIPPhoneEventDelegate.initGetStats(pc, callId, username);
				} catch (e) {
					logger.log("sipjsphone: newSession: something went wrong while initing getstats");
					logger.log(e);
				}

				sdh.peerConnectionDelegate = {
					onnegotiationneeded: (event) => {
							this.webrtcSIPPhoneEventDelegate.onCallStatNegoNeeded();
					},
					onsignalingstatechange: (event) => {
							this.webrtcSIPPhoneEventDelegate.onCallStatSignalingStateChange(event.target.signalingState);
					},
					onconnectionstatechange: (event) => {
							this.webrtcSIPPhoneEventDelegate.onStatPeerConnectionConnectionStateChange(event.target.connectionState);
					},
					oniceconnectionstatechange: (event) => {
							this.webrtcSIPPhoneEventDelegate.onStatPeerConnectionIceConnectionStateChange(event.target.iceConnectionState);
					},
					onicegatheringstatechange: (event) => {
							this.webrtcSIPPhoneEventDelegate.onStatPeerConnectionIceGatheringStateChange(event.target.iceGatheringState);
					}

				};

			};
				this.ctxSip.Sessions[newSess.ctxid] = newSess;

			let status;
			if (newSess.direction === 'incoming') {
					logger.log('DEBUG: Incoming call detected, about to start ring tone');
					this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('incoming');
				status = "Incoming: " + newSess.displayName;
					this.ctxSip.startRingTone();
				//sip call method was invoking after 500 ms because of race between server push and 
				//webrtc websocket autoanswer
					setTimeout(() => this.sipCall(), 500);

			}
				this.ctxSip.setCallSessionStatus(status);


		},

		// getUser media request refused or device was not present
			getUserMediaFailure: (e) => {

		},

			getUserMediaSuccess: (stream) => {
				this.ctxSip.Stream = stream;
		},

		/**
		 * sets the ui call status field
		 * 
		 * @param {string}
		 *            status
		 */
			setCallSessionStatus: (status) => {

		},

		/**
		 * sets the ui connection status field
		 * 
		 * @param {string}
		 *            status
		 */
			setStatus: (status) => {
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
			logCall: (session, status) => { },




			sipHangUp: (sessionid) => {

				var s = this.ctxSip.Sessions[sessionid];
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

			// Update the sipSendDTMF method (around line 389) to use Web Audio:
			sipSendDTMF: (digit) => {
				var a = this.ctxSip.callActiveID;
				if (a) {
					var s = this.ctxSip.Sessions[a];

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

			setError: (err, title, msg, closable) => { },




			phoneMuteButtonPressed: (sessionid) => {
				logger.log(" sipjsphone: phoneMuteButtonPressed: bMicEnable, sessionid", this.bMicEnable, sessionid);
				var s = this.ctxSip.Sessions[sessionid];

				if (this.bMicEnable) {
					this.toggleMute(s, true);
					this.bMicEnable = false;
			} else {
					this.toggleMute(s, false);
					this.bMicEnable = true;
			}
		},

		//NL --Implement hold button start
			phoneMute: (sessionid, bMute) => {
			if (sessionid) {
					var s = this.ctxSip.Sessions[sessionid];
				logger.log(" sipjsphone: phoneMute: bMute", bMute)
					this.toggleMute(s, bMute);
					this.bMicEnable = !bMute;
			}
			else{
				logger.log(" sipjsphone: phoneMute: doing nothing as sessionid not found")

			}
		},

			phoneHold: (sessionid, bHold) => {
			if (sessionid) {
					var s = this.ctxSip.Sessions[sessionid];
				logger.log("sipjsphone: phoneHold: bHold", bHold)
					this.toggleHold(s, bHold);
					this.bHoldEnable = bHold;
			}
		},

			phoneHoldButtonPressed: (sessionid) => {
			if (sessionid) {
					var s = this.ctxSip.Sessions[sessionid];
					if (this.bHoldEnable) {
						this.toggleHold(s, false);
						this.bHoldEnable = false;
				} else {
						this.toggleHold(s, true);
						this.bHoldEnable = true;
				}
			}
		},
		//NL --Implement hold button end

		/**
		 * Tests for a capable browser, return bool, and shows an error modal on
		 * fail.
		 */
			hasWebRTC: () => {

			if (navigator.webkitGetUserMedia) {
				return true;
			} else if (navigator.mozGetUserMedia) {
				return true;
			} else if (navigator.getUserMedia) {
				return true;
			} else {
					this.ctxSip.setError(true, 'Unsupported Browser.', 'Your browser does not support the features required for this phone.');
				logger.error("WebRTC support not found");
				return false;
			}
		}

	};


		if (!this.ctxSip.hasWebRTC()) {
		alert('Your browser don\'t support WebRTC.\naudio/video calls will be disabled.');
	}

		// Use the correct delegate property
		if (this.webrtcSIPPhoneEventDelegate?.setWebRTCFSMMapper) {
			this.webrtcSIPPhoneEventDelegate.setWebRTCFSMMapper("sipjs");
		}

	logger.log("sipjsphone: init: Initialization complete...")
		this.initializeComplete = true;
		if (onInitDoneCallback) {
	onInitDoneCallback();
		}
}

	addPreferredCodec(description) {
		logger.log("sipjsphone:addPreferredCodec entry");
		// Ensure a preferred codec is set
		if (!this.preferredCodec) {
			logger.info("sipjsphone:addPreferredCodec: No preferred codec set. Using default.");
			return Promise.resolve(description);
		}

		const { payloadType, rtpMap, fmtp } = this.preferredCodec;
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
	}

	sipRegister() {
		logger.log("sipjsphone: sipRegister: Starting registration with config:", [{
			authorizationUsername: this.txtPrivateIdentity,
			authorizationPassword: this.txtPassword,
			uri: this.txtPublicIdentity,
			websocketURL: this.txtWebsocketURL,
			realm: this.txtRealm
		}]);

		try {
			if (!this.txtRealm || !this.txtPrivateIdentity || !this.txtPublicIdentity) {
				logger.error("sipjsphone: sipRegister: Missing required credentials");
				return;
			}

			const uri = SIP.UserAgent.makeURI(this.txtPublicIdentity);
			if (!uri) {
				logger.error("sipjsphone: sipRegister: Failed to create SIP URI");
				return;
			}

			const userAgentConfig = {
				uri: uri,
			transportOptions: {
					server: this.txtWebsocketURL,
				traceSip: true,
				reconnectionAttempts: 0
			},
			logBuiltinEnabled: false,
				logConfiguration: true,
				authorizationUsername: this.txtPrivateIdentity,
				authorizationPassword: this.txtPassword,
				registerOptions: {
					expires: 300
				},
				displayName: this.txtDisplayName,
				hackWssInTransport: true,
				stunServers: ["stun:stun.l.google.com:19302"],
				hackIpInContact: true,
				forceRport: true,
				hackViaTcp: false,
				hackAllowUnregisteredOptionTags: false,
				viaHost: this.txtHostName,
				allowLegacyNotifications: true,
				logConnector: this.sipPhoneLogger.bind(this),
			logLevel: "log",
			sessionDescriptionHandlerFactoryOptions: {
				constraints: {
					audio: true,
					video: false
				}
			},
				delegate: {
					onInvite: (incomingSession) => {
						logger.log("onInvite called");
						if (this.ctxSip.callActiveID == null) {
							// Tell the PSTN/SIP proxy we are ringing so it doesn't CANCEL
							incomingSession.progress({ statusCode: 180, reasonPhrase: "Ringing" });
							incomingSession.direction = "incoming";
							this.ctxSip.newSession(incomingSession);
							this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("i_new_call", "CALL", incomingSession);
						} else {
							incomingSession.reject({ statusCode: 486 });
						}
					}
				}
			};

			logger.log("sipjsphone: sipRegister: Created UserAgent with config:", [userAgentConfig]);
			this.ctxSip.userAgent = new SIP.UserAgent(userAgentConfig);
			this.ctxSip.userAgent.start();
			this.ctxSip.phone = this.ctxSip.userAgent;
			const registererConfig = {
				expires: 300,
				refreshFrequency: 80,
				registrar: SIP.UserAgent.makeURI(`sip:${this.txtSipDomain}`),
				logConfiguration: true
			};

			this.ctxSip.registerer = new SIP.Registerer(this.ctxSip.userAgent, registererConfig);
			this.registerer        = this.ctxSip.registerer;
			this.ctxSip.registerer.stateChange.addListener(this.registererStateEventListner.bind(this));
			this.ctxSip.registerer.waitingChange.addListener(this.registererWaitingChangeListener.bind(this));
			this.registerer = this.ctxSip.registerer;

			this.ctxSip.userAgent.transport.stateChange.addListener(this.transportStateChangeListener.bind(this));
		} catch (error) {
			logger.error("sipjsphone: sipRegister: Error during registration setup:", error);
		}
	}

	registererStateEventListner(newState) {
		logger.log("sipjsphone: registererStateEventListner: Registration state changed to:", [newState]);

	switch (newState) {
			case "Registered":
				logger.log("sipjsphone: registererStateEventListner: Registration successful");
				this.webRTCStatus = "ready";
				this.isRegistered = true;

				// Update UI state
				if (this.callBackHandler && typeof this.callBackHandler.onResponse === 'function') {
					this.callBackHandler.onResponse("ready");
				}

				if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM === 'function') {
					this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("registered", "CONNECTION");
				}
				break;
			case "Unregistered":
				logger.error("sipjsphone: registererStateEventListner: Registration failed");
				this.webRTCStatus = "offline";
				this.isRegistered = false;

				// Update UI state
				if (this.callBackHandler && typeof this.callBackHandler.onResponse === 'function') {
					this.callBackHandler.onResponse("error");
				}

				if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM === 'function') {
					this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("unregistered", "CONNECTION");
				}
				break;
			case "Terminated":
				logger.log("sipjsphone: registererStateEventListner: Registration terminated");
				this.webRTCStatus = "offline";
				this.isRegistered = false;

				// Update UI state
				if (this.callBackHandler && typeof this.callBackHandler.onResponse === 'function') {
					this.callBackHandler.onResponse("error");
				}

				if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM === 'function') {
					this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated", "CONNECTION");
				}
				break;
		}
		this.lastRegistererState = newState;
	}



	registererWaitingChangeListener(b) {
		if (this.registerer && this.registerer.state == SIP.RegistererState.Registered) {
			this.registererStateEventListner("Registered");
		}

	}

	transportStateChangeListener(newState) {
		logger.log("sipjsphone: transportStateChangeListener: Transport state changed to:", [newState]);
		this.lastTransportState = newState;

		if (newState === "Connected") {
			logger.log("sipjsphone: transportStateChangeListener: WebSocket connected");
			this.onUserAgentTransportConnected();
		}

		if (newState === "Disconnected") {
			logger.log("sipjsphone: transportStateChangeListener: WebSocket disconnected");

			if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent === 'function') {
				this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent("disconnected");
			}

			// PATCH: Surface this as an 'unregistered' terminal state
			this.registererStateEventListner("Unregistered");

			this.onUserAgentTransportDisconnected();
		}

		if (this.webrtcSIPPhoneEventDelegate && this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent) {
			this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent(newState);
		}
	}

	/**
 * Closes the underlying WebSocket transport and removes listeners so
 * that SIP.js can GC everything cleanly.
 * Call-site: disconnect(), sipUnRegister(), uiOnConnectionEvent()…
 */
destroySocketConnection() {
	try {
	  // The transport object lives on the SIP.js Phone (UserAgent.transport)
	  const transport = this.ctxSip?.phone?.transport;
	  if (!transport) {
		return;                       // nothing to do
	  }

	  // SIP.js 0.20 ⇢ state-driven API; older builds still expose isConnected()
	  const connected =
		typeof transport.isConnected === "function"
		  ? transport.isConnected()
		  : transport.state === 2;    // TransportState.Connected === 2

	  if (connected) {
		// 0.20 has async disconnect; earlier versions are sync – await is OK for both
		transport.disconnect();
	  }
  	} catch (e) {
	  logger.error("destroySocketConnection: cleanup failed", e);
	}
  }


	uiOnConnectionEvent(b_connected, b_connecting) {
		logger.log("sipjsphone: uiOnConnectionEvent: Connection state changed:", [b_connected, b_connecting]);

		if (b_connecting) {
			this.webRTCStatus = "connecting";
		} else if (b_connected) {
			this.webRTCStatus = "ready";
		} else {
			this.webRTCStatus = "offline";
		}

		if (this.callBackHandler && typeof this.callBackHandler.onResponse === 'function') {
			if (b_connected) {
				this.callBackHandler.onResponse("ready");
			} else if (b_connecting) {
				this.callBackHandler.onResponse("connecting");
			} else {
				this.callBackHandler.onResponse("error");
			}
		}
	}

	onUserAgentTransportConnected() {
		logger.log("sipjsphone: onUserAgentTransportConnected: Transport connected");

		if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent === 'function') {
			this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent('connected');
		}

		this.webRTCStatus = "ready";

		if (this.webrtcSIPPhoneEventDelegate && typeof this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM === 'function') {
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("started", "CONNECTION");
		}

		// Update UI state to show connected
		this.uiOnConnectionEvent(true, false);

		if (this.ctxSip.registerer) {
			this.ctxSip.registerer.stateChange.addListener(this.registererStateEventListner.bind(this));
			this.ctxSip.registerer.waitingChange.addListener(this.registererWaitingChangeListener.bind(this));
			this.ctxSip.registerer.register();
		}
	}

	cleanupRegistererTimer() {
		if (this.registerer) {

			try {
				this.registerer.clearTimers();
				this.registerer.stateChange.removeListener(this.registererStateEventListner);
				this.registerer.waitingChange.removeListener(this.registererWaitingChangeListener);


		} catch (e) {
			logger.log("sipjsphone: cleanupRegistererTimer: ERROR", e);

		}
			this.registerer = null;

		}
	}

	onUserAgentTransportDisconnected() {

		this.webRTCStatus = "offline";
		this.setRegisterFlag(false);

		this.cleanupRegistererTimer();

		this.webrtcSIPPhoneEventDelegate.onCallStatSipJsTransportEvent('disconnected');
		this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("failed_to_start", "CONNECTION");
		if (this.callBackHandler != null) {
			if (this.callBackHandler.onResponse) {
				this.callBackHandler.onResponse("error");
			}
		}




	}


	parseSipMessage(message) {
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

	handleWebSocketMessageContent(content, direction) {
	var lines = content.split('\n');
	lines.splice(0, 2);
	var newtext = lines.join('\n');


		var sipMessage = this.parseSipMessage(newtext);

	switch (direction) {
		case "sent":

			if (sipMessage.method == "REGISTER")
					this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("sent_request", "CONNECTION");

				this.webrtcSIPPhoneEventDelegate.onCallStatSipSendCallback(newtext, "sipjs");


			break;
		case "recv":
				this.webrtcSIPPhoneEventDelegate.onCallStatSipRecvCallback(newtext, "sipjs");
			break;
		default:
			break;
	}

}





	setRegisterFlag(b) {
		this.register_flag = b;
}

	toggleMute(s, mute) {
	let pc = s.sessionDescriptionHandler.peerConnection;
	if (pc.getSenders) {
			pc.getSenders().forEach((sender) => {
			if (sender.track) {
				sender.track.enabled = !mute;
			}
		});
	} else {
			pc.getLocalStreams().forEach((stream) => {
				stream.getAudioTracks().forEach((track) => {
				track.enabled = !mute;
			});
				stream.getVideoTracks().forEach((track) => {
				track.enabled = !mute;
			});
		});
	}
	if (mute) {
			this.onMuted(s);
	} else {
			this.onUnmuted(s);
	}
}


	onMuted(s) {
		logger.log(`[onMuted] Before: s.isMuted=${s && s.isMuted}, global isMuted=${this.isMuted}`);
		this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('muted');
		if (s) s.isMuted = true;
		this.isMuted = true;
		logger.log(`[onMuted] After: s.isMuted=${s && s.isMuted}, global isMuted=${this.isMuted}`);
		this.ctxSip.setCallSessionStatus("Muted");
	}

	onUnmuted(s) {
		logger.log(`[onUnmuted] Before: s.isMuted=${s && s.isMuted}, global isMuted=${this.isMuted}`);
		this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('unmuted');
		if (s) s.isMuted = false;
		this.isMuted = false;
		logger.log(`[onUnmuted] After: s.isMuted=${s && s.isMuted}, global isMuted=${this.isMuted}`);
		this.ctxSip.setCallSessionStatus("Answered");
	}

	onHold(s) {
	//webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('hold');
	logger.warn(`[${s.id}] re-invite request was accepted`);
	s.held = true;
		this.enableSenderTracks(s, !s.held && !s.isMuted);
		this.enableReceiverTracks(s, !s.held);
		//this.ctxSip.setCallSessionStatus("Hold");
	}

	 onUnhold(s) {
	//webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('unhold');
	logger.warn(`[${s.id}] re-invite request was rejected`);
	s.held = false;
		this.enableSenderTracks(s, !s.held && !s.isMuted);
		this.enableReceiverTracks(s, !s.held);
		//this.ctxSip.setCallSessionStatus("Unhold");
}

/** Helper function to enable/disable media tracks. */
	 enableReceiverTracks(s, enable) {
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
	 enableSenderTracks(s, enable) {
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

	 toggleHold(s, hold) {
	const options = {
		requestDelegate: {
			onAccept: () => {
					this.onHold(s)
			},
			onReject: () => {
					this.onUnhold(s)
			}
		},
		sessionDescriptionHandlerOptions: {
			hold: hold
		}
	};
	s.invite(options).then(() => {
		// preemptively enable/disable tracks
			this.enableReceiverTracks(s, !hold);
			this.enableSenderTracks(s, !hold && !s.isMuted);
	}).catch((error) => {
		logger.error(`Error in hold request [${s.id}]`);
	});
}

	assignStream(stream, element) {
    logger.log("sipjsphone: assignStream: entry for stream", stream);
    
    if (audioDeviceManager.currentAudioOutputDeviceId != "default")
        element.setSinkId(audioDeviceManager.currentAudioOutputDeviceId);
        
    // Set element source.
    element.autoplay = true;
    element.srcObject = stream;
    
    // Set HTML audio element volume to 0 to prevent direct audio output
    element.volume = 0;

    // Clean up existing audio nodes
    if(this.audioRemoteSourceNode) {
        try {
            this.audioRemoteSourceNode.disconnect();
            this.audioRemoteGainNode.disconnect();
        } catch (e) {
            logger.error("sipjsphone: assignStream: Old audio nodes cleanup:", e);
        }
    }

    // Create MediaStreamSource directly from the stream
    this.audioRemoteSourceNode = audioDeviceManager.webAudioCtx.createMediaStreamSource(stream);
    this.audioRemoteGainNode = audioDeviceManager.webAudioCtx.createGain();

    // Set the gain value
    this.audioRemoteGainNode.gain.value = this.callAudioOutputVolume;

    // Connect the audio graph
    this.audioRemoteSourceNode.connect(this.audioRemoteGainNode);
    this.audioRemoteGainNode.connect(audioDeviceManager.webAudioCtx.destination);

    // Resume audio context when element plays
    element.addEventListener("play", () => {
        if (audioDeviceManager.webAudioCtx.state === "suspended") {
            audioDeviceManager.webAudioCtx.resume();
        }
    });
    
    // Load and start playback of media.
    element.play().catch((error) => {
        logger.error("sipjsphone: assignStream: Failed to play media", error);
    });

    // If a track is added, load and restart playback of media.
    stream.onaddtrack = () => {
        element.load();
        element.play().catch((error) => {
            logger.error("sipjsphone: assignStream: Failed to play remote media on add track", error);
        });
    };
    
    // If a track is removed, load and restart playback of media.
    stream.onremovetrack = () => {
        element.load();
        element.play().catch((error) => {
            logger.error("sipjsphone: assignStream: Failed to play remote media on remove track", error);
        });
    };
}

	 onUserSessionAcceptFailed(e) {
	if (e.name == "NotAllowedError" || e.name == "NotFoundError") {
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("m_permission_refused", "CALL");
			this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('userMediaFailed');
			this.webrtcSIPPhoneEventDelegate.onGetUserMediaErrorCallstatCallback();
	} else {
		logger.log("sipjsphone: onUserSessionAcceptFailed: user media failed due to error ", e);
	}
		this.uiCallTerminated('Media stream permission denied');
	}

	loadCredentials(sipAccountInfo) {
		this.txtDisplayName = sipAccountInfo['userName'];
		this.txtPrivateIdentity = sipAccountInfo['authUser'];
		this.txtHostNameWithPort = sipAccountInfo["domain"];
		this.txtHostName = this.txtHostNameWithPort.split(":")[0];
		this.txtWebSocketPort = this.txtHostNameWithPort.split(":")[1];
		this.txtAccountName = sipAccountInfo['accountName'];

		// Use sipdomain for public identity if available, otherwise use hostname
		if (sipAccountInfo['sipdomain']) {
			this.txtSipDomain = sipAccountInfo["sipdomain"];
			this.txtPublicIdentity = "sip:" + this.txtPrivateIdentity + "@" + this.txtSipDomain;
		} else {
			this.txtSipDomain = this.txtHostName;
			this.txtPublicIdentity = "sip:" + this.txtPrivateIdentity + "@" + this.txtHostNameWithPort;
		}

		this.txtPassword = sipAccountInfo["secret"];
		this.txtRealm = this.txtSipDomain; // Use sipdomain as realm
		this.txtTurnServer = "drishti@" + this.txtRealm + ":3478";
		this.txtCredential = "jrp931";
		this.txtTurnUri = "'turn:" + this.txtRealm + ":3478?transport=udp', credential: '" + this.txtCredential + "', username: 'drishti'";


		var default_values = {
			'security': window.location.protocol == "http:" ? 'ws' : 'wss',
			'sipdomain': this.txtHostName,
			'contactHost': this.txtHostName,
			'wsPort': window.location.protocol == "http:" ? 8088 : 8089,
			'sipPort': window.location.protocol == "http:" ? 5060 : 5061,
			'endpoint': 'ws'
		}

		this.txtSecurity = sipAccountInfo['security'] ? sipAccountInfo['security'] : default_values['security'];
		this.txtWSPort = this.txtWebSocketPort ? this.txtWebSocketPort : default_values['wsPort'];

		if (sipAccountInfo['sipdomain']) {
			this.txtSipDomain = sipAccountInfo["sipdomain"];
			this.txtPublicIdentity = "sip:" + this.txtPrivateIdentity + "@" + this.txtSipDomain;
		} else {
			this.txtSipDomain = default_values["sipdomain"];
		}

		if (sipAccountInfo['contactHost']) {
			this.txtContactHost = sipAccountInfo["contactHost"];
		} else {
			this.txtContactHost = default_values["contactHost"];
		}

		this.txtSipPort = sipAccountInfo['sipPort'] ? sipAccountInfo["sipPort"] : default_values["sipPort"];

		// Fix: Handle endpoint value to avoid double 'wss' path
		this.endpoint = sipAccountInfo['endpoint'] ? sipAccountInfo['endpoint'] : default_values['endpoint'];

		// Construct WebSocket URL
		this.txtWebsocketURL = this.txtSecurity + "://" + this.txtHostName + ":" + this.txtWSPort;
		// Always append endpoint if it exists, regardless of its value
		if (this.endpoint) {
			this.txtWebsocketURL += "/" + this.endpoint;
		}
		this.txtUDPURL = "udp://" + this.txtHostName + ":" + this.txtSipPort;


		var oInitializeCompleteTimer =  setTimeout(() => {
			if (this.initializeComplete) {
				this.sipRegister()
			}
		}, 500);
	}

	getStatus() {
		return this.webRTCStatus;
	}

	registerCallBacks(handler) {
		this.callBackHandler = handler;
	}

	sipSendDTMF(c) {
		this.ctxSip.sipSendDTMF(c);
	}

	sipToggleRegister() {
		if (this.register_flag == false) {
			this.register_flag = true;
			this.sipRegister();

		} else if (this.register_flag == true) {
			this.registerer.unregister({});
			this.register_flag = false;
			this.webRTCStatus = "offline";
			if (this.callBackHandler != null)
				if (this.callBackHandler.onResponse)
					this.callBackHandler.onResponse("error");

		}
	}

	reRegister() {
		logger.log("sipjsphone: reRegister: registering in case of relogin");
		if (this.ctxSip.phone && this.registerer) {
			this.registerer.register({});
		} else {
			logger.log("sipjsphone: reRegister: SIP Session does not exist for re registration");
		}

	}

	sipToggleMic() {
		this.ctxSip.phoneMuteButtonPressed(this.ctxSip.callActiveID);
	}

	sipMute(bMute) {
		this.ctxSip.phoneMute(this.ctxSip.callActiveID, bMute);
	}

	holdCall() {
		if (this.ctxSip.callActiveID) {
			this.ctxSip.phoneHoldButtonPressed(this.ctxSip.callActiveID);
		}
	}

	sipHold(bHold) {
		if (this.ctxSip.callActiveID) {
			this.ctxSip.phoneHold(this.ctxSip.callActiveID, bHold);
		}
	}

	getMicMuteStatus() {
		// Prefer session mute state if available
		let sessionMuted = undefined;
		if (this.ctxSip && this.ctxSip.callActiveID && this.ctxSip.Sessions && this.ctxSip.Sessions[this.ctxSip.callActiveID]) {
			sessionMuted = !!this.ctxSip.Sessions[this.ctxSip.callActiveID].isMuted;
			logger.log(`[getMicMuteStatus] sessionMuted: ${sessionMuted}, global isMuted: ${this.isMuted}`);
			return sessionMuted;
		}
		logger.log(`[getMicMuteStatus] No active session, global isMuted: ${this.isMuted}`);
		return this.isMuted;
	}

	setPreferredCodec(codecName) {
		logger.log("sipjsphone:setPreferredCodec entry");
		const codecPayloadTypes = {
			opus: { payloadType: 111, rtpMap: "opus/48000/2", fmtp: "minptime=10;useinbandfec=1" },
		};

		let codec = "opus"; // Default to opus
		if (codecName && codecPayloadTypes[codecName.toLowerCase()]) {
			codec = codecName.toLowerCase();
		} else if (codecName) {
			logger.error("sipjsphone:setPreferredCodec: Unsupported codec " + codecName + " specified. Defaulting to opus.");
		}

		this.preferredCodec = codecPayloadTypes[codec];

		logger.log("sipjsphone:setPreferredCodec: Preferred codec set to " + codec);
	}

	pickPhoneCall() {
		var newSess = this.ctxSip.Sessions[this.ctxSip.callActiveID];
		logger.log("sipjsphone: pickphonecall: ", this.ctxSip.callActiveID);
		if (newSess) {
			if (audioDeviceManager.currentAudioInputDeviceId != "default") {
				newSess.accept({
					sessionDescriptionHandlerOptions: {
						constraints: { audio: { deviceId: audioDeviceManager.currentAudioInputDeviceId }, video: false }
					},
					sessionDescriptionHandlerModifiers: [this.addPreferredCodec]
				}).catch((e) => {
					this.onUserSessionAcceptFailed(e);
				});
			} else {

				newSess.accept({
					sessionDescriptionHandlerModifiers: [this.addPreferredCodec]
				}).catch((e) => {
					this.onUserSessionAcceptFailed(e);
				});
			}
		}

	}


	sipHangUp() {
		this.ctxSip.sipHangUp(this.ctxSip.callActiveID);
	}


	playBeep() {
		try {
			this.ctxSip.beeptone.play();
		} catch (e) {
			logger.log("sipjsphone: playBeep: Exception:", e);
		}
	}

	sipUnRegister() {
		if (this.ctxSip.phone && this.registerer) {
			this.registerer.unregister({}).then(() => {
				this.destroySocketConnection();
			});
		} else {
			if (this.ctxSip.phone) {
				this.destroySocketConnection();
			}
		}
	}

	connect() {
		try {
			this.sipRegister();
		} catch (e) {
		}
	}

	disconnect() {
		if (this.registerer) {
			this.cleanupRegistererTimer();
		}
		if (this.ctxSip.phone && this.ctxSip.phone.transport) {
			this.ctxSip.phone.transport.stateChange.removeListener(this.transportStateChangeListener);
			if (this.ctxSip.phone && this.ctxSip.phone.transport.isConnected()) {
				this.destroySocketConnection();
			}
		}
	}
	/* NL Additions - Start */
	getSpeakerTestTone() {
		logger.log("sipjsphone: getSpeakerTestTone: Returning speaker test tone:", this.ringtone);
		return this.ringtone;
	}


	getWSSUrl() {
		logger.log("sipjsphone: getWSSUrl: Returning txtWebsocketURL:", this.txtWebsocketURL);
		return this.txtWebsocketURL;
	}
	/* NL Additions - End */
	getTransportState() {
		logger.log("sipjsphone: getTransportState: Returning Transport State : ", this.lastTransportState);
		return this.lastTransportState;
	}
	getRegistrationState() {
		logger.log("sipjsphone: getRegistrationState: Returning Registration State : ", this.lastRegistererState);
		return this.lastRegistererState;
	}

	changeAudioInputDevice(deviceId, onSuccess, onError, forceDeviceChange) {
		logger.log("sipjsphone: changeAudioInputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange, "enableAutoAudioDeviceChangeHandling = ", this.enableAutoAudioDeviceChangeHandling);
		audioDeviceManager.changeAudioInputDevice(deviceId, (stream) => {
			const trackChanged = this.replaceSenderTrack(stream, deviceId);
			if (trackChanged) {
				audioDeviceManager.currentAudioInputDeviceId = deviceId;
				logger.log(`sipjsphone: changeAudioInputDevice: Input device changed to: ${deviceId}`);
				if (onSuccess) onSuccess();
			} else {
				logger.error("sipjsphone: changeAudioInputDevice: failed");
				if (onError) onError("replaceSenderTrack failed for webrtc");
			}
		}, (err) => {
			logger.error("sipjsphone: changeAudioInputDevice error:", err);
			if (onError) onError(err);
		},
		forceDeviceChange,
		logger);
	}

	async changeAudioOutputDevice(deviceId, onSuccess, onError, forceDeviceChange) {
		logger.log("sipjsphone: changeAudioOutputDevice : ", deviceId, onSuccess, onError, "forceDeviceChange = ", forceDeviceChange, "enableAutoAudioDeviceChangeHandling = ", this.enableAutoAudioDeviceChangeHandling);
		try {
			// Ensure device list is up-to-date
			await audioDeviceManager.enumerateDevices(() => {});
			if (!this.audioRemote) {
				const errorMsg = 'SIPJSPhone:changeAudioOutputDevice audioRemote element is not set.';
				logger.error(errorMsg);
				if (onError) onError(errorMsg);
				return;
			}
			if (typeof this.audioRemote.sinkId === 'undefined') {
				const errorMsg = 'SIPJSPhone:changeAudioOutputDevice Browser does not support output device selection.';
				logger.error(errorMsg);
				if (onError) onError(errorMsg);
				return;
			}
			audioDeviceManager.changeAudioOutputDevice(this.audioRemote, deviceId, () => {
				this.changeAudioOutputDeviceForAdditionalAudioElement(deviceId);
				if (onSuccess) onSuccess();
			}, (err) => {
				logger.error('SIPJSPhone:changeAudioOutputDevice error:', err);
				if (onError) onError(err);
			},
			forceDeviceChange,
		logger);
		} catch (e) {
			logger.error('SIPJSPhone:changeAudioOutputDevice unexpected error:', e);
			if (onError) onError(e);
		}
	}

	changeAudioOutputDeviceForAdditionalAudioElement(deviceId) {
		const additionalAudioElements = [this.ringtone, this.beeptone, this.ringbacktone, this.dtmftone];
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
	}

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
	}
	replaceSenderTrack(stream, deviceId) {
		try {

			if (audioDeviceManager.currentAudioInputDeviceId == deviceId) {
				this.stopStreamTracks(stream);
				return false;
			}
			if (this.ctxSip.callActiveID) {
				this.ctxSip.Stream = stream;
				const s = this.ctxSip.Sessions[this.ctxSip.callActiveID];
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
				this.stopStreamTracks(stream);
			}
			return true;
		} catch (e) {
			return false;
		}

	}
	registerLogger(customLogger) {
		logger = customLogger;
	}
	registerAudioDeviceChangeCallback(audioInputDeviceChangeCallback, audioOutputDeviceChangeCallback, onDeviceChangeCallback) {
		logger.log(`sipjsphone: registerAudioDeviceChangeCallback: entry`);
		this.audioInputDeviceChangeCallback = audioInputDeviceChangeCallback;
		this.audioOutputDeviceChangeCallback = audioOutputDeviceChangeCallback;
		this.onDeviceChangeCallback = onDeviceChangeCallback;
	}

	uiCallTerminated(s_description) {
		if (window.btnBFCP)
			window.btnBFCP.disabled = true;
		this.ctxSip.stopRingTone();
		this.ctxSip.stopRingbackTone();
		if (this.callBackHandler && this.callBackHandler.onResponse)
			this.callBackHandler.onResponse("disconnected");
	}

	sipCall() {
		logger.log("sipjsphone: sipCall: testing emit accept_reject");
		if (this.webrtcSIPPhoneEventDelegate)
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("accept_reject", "CALL");
	}

	onInvitationSessionAccepted(newSess) {
		// Reset mute state at the start of every call
		logger.log(`[onInvitationSessionAccepted] Resetting mute state. Before: newSess.isMuted=${newSess && newSess.isMuted}, global isMuted=${this.isMuted}`);
		this.isMuted = false;
		if (newSess && newSess.isMuted !== undefined) {
			newSess.isMuted = false;
		}
		logger.log(`[onInvitationSessionAccepted] After reset: newSess.isMuted=${newSess && newSess.isMuted}, global isMuted=${this.isMuted}`);
		this.ctxSip.Stream = newSess.sessionDescriptionHandler.localMediaStream;
		logger.log('onInvitationSessionAccepted: assigning remote stream to audioRemote');
		this.assignStream(newSess.sessionDescriptionHandler.remoteMediaStream, this.audioRemote);
		logger.log('onInvitationSessionAccepted: assignStream called');
		if (this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('accepted');
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected", "CALL");
		}
		// If there is another active call, hold it
		if (this.ctxSip.callActiveID && this.ctxSip.callActiveID !== newSess.ctxid) {
			this.ctxSip.phoneHoldButtonPressed(this.ctxSip.callActiveID);
		}
		this.ctxSip.stopRingbackTone();
		this.ctxSip.stopRingTone();
		this.ctxSip.setCallSessionStatus('Answered');
		this.ctxSip.logCall(newSess, 'answered');
		this.ctxSip.callActiveID = newSess.ctxid;
		this.webRTCStatus = "busy";
		if (this.callBackHandler && this.callBackHandler.onResponse)
			this.callBackHandler.onResponse("connected");
	}

	onInvitationSessionTerminated() {
		this.stopStreamTracks(this.ctxSip.Stream);
		if (this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate.stopCallStat();
			this.webrtcSIPPhoneEventDelegate.onCallStatSipJsSessionEvent('terminated');
		}
		this.ctxSip.stopRingTone();
		this.ctxSip.stopRingbackTone();
		this.ctxSip.setCallSessionStatus("");
		this.ctxSip.callActiveID = null;
		if (this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate.playBeepTone();
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated", "CALL");
		}
		this.uiCallTerminated();
		this.webRTCStatus = "ready";
		if (this.callBackHandler && this.callBackHandler.onResponse)
			this.callBackHandler.onResponse("disconnected");
	}

	onUserAgentRegistered() {
		if (this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("connected", "CONNECTION");
		}
		this.uiOnConnectionEvent(true, false);
		this.register_flag = true;
		this.webRTCStatus = "ready";
		if (this.callBackHandler && this.callBackHandler.onResponse)
			this.callBackHandler.onResponse("ready");
		window.onunload = () => {
			localStorage.removeItem('ctxPhone');
			if (this.ctxSip.phone) this.ctxSip.phone.stop();
		};
		localStorage.setItem('ctxPhone', 'true');
	}

	onUserAgentRegistrationTerminated() {
		this.uiOnConnectionEvent(false, false);
	}

	onUserAgentRegistrationFailed() {
		if (this.webrtcSIPPhoneEventDelegate) {
			this.webrtcSIPPhoneEventDelegate.sendWebRTCEventsToFSM("terminated", "CONNECTION");
		}
		this.uiOnConnectionEvent(false, false);
		this.register_flag = false;
		if (this.callBackHandler && this.callBackHandler.onResponse) {
			this.callBackHandler.onResponse("error");
		}
	}

	sipPhoneLogger(level, category, label, content) {
		try {
			if (content) {
				if (content.startsWith("Sending WebSocket")) {
					this.handleWebSocketMessageContent(content, "sent");
				} else if (content.startsWith("Received WebSocket text message")) {
					this.handleWebSocketMessageContent(content, "recv");
				}
				logger.log("sipjsphone: sipPhoneLogger:" + level + " sipjslog: " + category + ": " + content);
			}
		} catch (e) {
			logger.error("sipjsphone:sipPhoneLogger ERROR", e);
		}
	}

	_onDeviceChange(event) {
		try {
			audioDeviceManager.enumerateDevices(() => {
				if (this.onDeviceChangeCallback) {
				logger.info("SIPJSPhone:ondevicechange relaying event to callback");
					this.onDeviceChangeCallback(event);
				return;
			}
				audioDeviceManager.onAudioDeviceChange(
					this.audioRemote,
					(stream, deviceId) => {
						const trackChanged = this.replaceSenderTrack(stream, deviceId);
					if (trackChanged) {
						audioDeviceManager.currentAudioInputDeviceId = deviceId;
							if (this.audioInputDeviceChangeCallback) {
								this.audioInputDeviceChangeCallback(deviceId);
						}
					}
					},
					(deviceId) => {
						this.changeAudioOutputDeviceForAdditionalAudioElement(deviceId);
					audioDeviceManager.currentAudioOutputDeviceId = deviceId;
						if (this.audioOutputDeviceChangeCallback) {
							this.audioOutputDeviceChangeCallback(deviceId);
					}
					}
				);
				});
	} catch (e) {
		logger.error("SIPJSPhone:ondevicechange something went wrong during device change", e);
	}
	}

	_makeAudio(src) { const a = new Audio(src); return a; }

	registerPhoneEventListeners() {
		this.ctxSip.phone.start();
		this.ctxSip.phone.transport.stateChange.addListener((s) => {
			if (s === SIP.TransportState.Connected && !this.registerer) {
				this.registerer = new SIP.Registerer(this.ctxSip.phone, {expires:300, refreshFrequency: 80 });
				this.registerer.register();
			}
		});
	}

	registerWebRTCClient(sipAccountInfo, webrtcSIPPhoneEventDelegate) {
		this.webrtcSIPPhoneEventDelegate = webrtcSIPPhoneEventDelegate;
		this.init(sipAccountInfo, () => {
			this.setPreferredCodec(sipAccountInfo.preferredCodec);
			this.registerPhoneEventListeners(this.ctxSip);
		});
	}

	muteAction(bMute) {
		logger.log("webrtcSIPPhone: muteAction: ", [bMute]);
		// Always operate on the current session
		if (this.ctxSip && this.ctxSip.callActiveID && this.ctxSip.Sessions && this.ctxSip.Sessions[this.ctxSip.callActiveID]) {
			this.phone.sipMute(bMute);
		} else {
			logger.warn("webrtcSIPPhone: muteAction: No active session to mute/unmute");
		}
	}

}

export default SIPJSPhone;
