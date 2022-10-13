import { diagnosticsCallback } from "../../listeners/Callback";
import { webrtcLogger } from "./WebrtcLogger"

var logger = webrtcLogger()
var speakerNode;
var micNode;
var audioTrack;
var thisBrowserName = "";
var intervalID;

var speakerTestTone = document.createElement("audio");  
var eventMapper = { sipml5: {}, sipjs: {} };
eventMapper.sipjs.started = "WS_TEST_PASS";
eventMapper.sipjs.failed_to_start = "WS_TEST_FAIL";
eventMapper.sipjs.transport_error = "WS_TEST_FAIL";
eventMapper.sipjs.connected_REGISTER = "USER_REG_TEST_PASS";
eventMapper.sipjs.terminated_REGISTER = "USER_REG_TEST_FAIL";

eventMapper.sipml5.started = "WS_TEST_PASS";
eventMapper.sipml5.failed_to_start = "WS_TEST_FAIL";
eventMapper.sipml5.transport_error = "WS_TEST_FAIL";
eventMapper.sipml5.connected_REGISTER = "USER_REG_TEST_PASS";
eventMapper.sipml5.terminated_REGISTER = "USER_REG_TEST_FAIL";

var candidateProcessData = {};
//var webrtcSIPPhoneInterface_ =  new webrtcSIPPhoneInterface()
var webrtcSDK = require('../../webrtc-sdk-core/webrtcsdk');
var webrtcSIPPhone = webrtcSDK.webrtcSIPPhone;
// var webrtcSIPPhoneInterface_ =  require('../../../webrtc-sdk-core/webrtcSIPPhoneInterface')

export var ameyoWebRTCTroubleshooter = {
  js_yyyy_mm_dd_hh_mm_ss: function () {
    var now = new Date();
    var year = "" + now.getFullYear();
    var month = "" + (now.getMonth() + 1);
    if (month.length == 1) {
      month = "0" + month;
    }
    var day = "" + now.getDate();
    if (day.length == 1) {
      day = "0" + day;
    }
    var hour = "" + now.getHours();
    if (hour.length == 1) {
      hour = "0" + hour;
    }
    var minute = "" + now.getMinutes();
    if (minute.length == 1) {
      minute = "0" + minute;
    }
    var second = "" + now.getSeconds();
    if (second.length == 1) {
      second = "0" + second;
    }
    return (
      year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
    );
  },

  addToTrobuleshootReport: function (type, message) {
    var timestamp = this.js_yyyy_mm_dd_hh_mm_ss();
    //window.loggingInLocalStorage(type,message);
    var msg =
      "[" +
      timestamp +
      "] " +
      "[" +
      type +
      "] TROUBLESHOOTER_FSM_REPORT: " +
      message +
      "\n";
    //if(window.addLogToTroubleshootReport) {
    //this.addLogToTroubleshootReport
    logger.log(msg);
    var oldMsg = window.localStorage.getItem('troubleShootReport')
    if (oldMsg) {
    msg = oldMsg + msg
    }
    window.localStorage.setItem('troubleShootReport', msg)
    diagnosticsCallback.triggerDiagnosticsSaveCallback('troubleShootReport', msg)
    //}
  },

  getBrowserData: function () {
    var agent = navigator.userAgent;
    var browserName = navigator.appName;
    var version = "" + parseFloat(navigator.appVersion);
    var offsetName;
    var offsetVersion;
    var ix;
    if ((offsetVersion = agent.indexOf("Edge")) !== -1) {
      browserName = "Microsoft Edge";
      version = agent.substring(offsetVersion + 5);
    } else if ((offsetVersion = agent.indexOf("Chrome")) !== -1) {
      browserName = "Chrome";
      version = agent.substring(offsetVersion + 7);
    } else if ((offsetVersion = agent.indexOf("MSIE")) !== -1) {
      browserName = "Microsoft Internet Explorer"; // Older IE versions.
      version = agent.substring(offsetVersion + 5);
    } else if ((offsetVersion = agent.indexOf("Trident")) !== -1) {
      browserName = "Microsoft Internet Explorer"; // Newer IE versions.
      version = agent.substring(offsetVersion + 8);
    } else if ((offsetVersion = agent.indexOf("Firefox")) !== -1) {
      browserName = "Firefox";
      version = agent.substring(offsetVersion + 8);
    } else if ((offsetVersion = agent.indexOf("Safari")) !== -1) {
      browserName = "Safari";
      version = agent.substring(offsetVersion + 7);
      if ((offsetVersion = agent.indexOf("Version")) !== -1) {
        version = agent.substring(offsetVersion + 8);
      }
    } else if (
      (offsetName = agent.lastIndexOf(" ") + 1) <
      (offsetVersion = agent.lastIndexOf("/"))
    ) {
      // For other browsers 'name/version' is at the end of userAgent
      browserName = agent.substring(offsetName, offsetVersion);
      version = agent.substring(offsetVersion + 1);
      if (browserName.toLowerCase() === browserName.toUpperCase()) {
        browserName = navigator.appName;
      }
    } // Trim the version string at semicolon/space if present.
    if ((ix = version.indexOf(";")) !== -1) {
      version = version.substring(0, ix);
    }
    if ((ix = version.indexOf(" ")) !== -1) {
      version = version.substring(0, ix);
    }

    this.addToTrobuleshootReport(
      "INFO",
      "Browser: " +
        browserName +
        "/" +
        version +
        ", Platform: " +
        navigator.platform
    );
    thisBrowserName = browserName;
    if (browserName == "Chrome") {
      this.setDeviceNames();
    }
    return browserName + "/" + version;
  },

  stopSpeakerTesttone: function () {
    speakerTestTone = webrtcSIPPhone.getSpeakerTestTone();
    speakerTestTone.pause();
  },

  stopSpeakerTesttoneWithSuccess: function () {
    this.stopSpeakerTest();
    this.sendDeviceTestingEvent("SPEAKER_TEST_PASS");
    this.addToTrobuleshootReport("INFO", "Speaker device testing is successfull");         
    this.addToTrobuleshootReport("INFO", "Speaker device testing is completed");
  },

  stopSpeakerTesttoneWithFailure: function () {
    this.stopSpeakerTest();
    this.sendDeviceTestingEvent("SPEAKER_TEST_FAIL");
    this.addToTrobuleshootReport("INFO", "Speaker device testing is failed");         
    this.addToTrobuleshootReport("INFO", "Speaker device testing is completed");
  },

  startSpeakerTest: function () {
    var parent = this;       

    try {
    intervalID = setInterval(function(){

          try {
          speakerTestTone = webrtcSIPPhone.getSpeakerTestTone();
          /* Close last pending tracks.. */
          logger.log("close last track")
          speakerTestTone.pause();
          parent.closeAudioTrack();  
      
          parent.addToTrobuleshootReport("INFO", "Speaker device testing is started");
          logger.log("speakerTestTone : play start", speakerTestTone);
      
          speakerTestTone.addEventListener("ended", function(event) {
            logger.log("speakerTestTone : tone iteration ended");
          });

          logger.log("start new track")

          var playPromise = speakerTestTone.play();
  
          if (playPromise !== undefined) {
            playPromise.then(_ => {
              logger.log("speakerTestTone : promise successfull");
            })
            .catch(error => {
              // Auto-play was prevented
              // Show paused UI.
              logger.log("speakerTestTone : failed" , error) ;
            });
          }	    
    
          var stream;
          var browserVersion;
          var browserName;

          try {
            browserVersion = parent.getBrowserData();
            browserName = browserVersion.trim().split('/')[0];
          } catch {
            browserName = "Firefox"
          }
          logger.log("browserVersion = [" + browserVersion + "] browserName = [" + browserName + "]\n")

          if (browserName == "Firefox") {
            stream = speakerTestTone.mozCaptureStream();
          } else {
            stream = speakerTestTone.captureStream();
          }
          parent.fillStreamSpeaker(stream, "speaker");
        } catch {
          logger.log("No speakertone to test..\n")
        }
    //Enable this for tone loop - Start     
    }, 1000)
    } catch (e) {
      logger.log("speakerTestTone : start failed" , e) ;
    }
    //Enable this for tone loop - End     

  },

  stopSpeakerTest: function () {
    var parent = this;       
    speakerTestTone = webrtcSIPPhone.getSpeakerTestTone();
    //Enable this for tone loop - Start
    try {
      clearInterval(intervalID) 
      intervalID = 0
    //Enable this for tone loop - End
      speakerTestTone.pause();
      parent.closeAudioTrack();      
      parent.addToTrobuleshootReport("INFO", "Speaker device testing is stopped");
  //Enable this for tone loop - Start     
    } catch (e) {
          logger.log("speakerTestTone : stop failed" , e) ;
    }    
  //Enable this for tone loop - End     
},

  startMicTest: function () {
    this.closeAudioTrack();
    this.addToTrobuleshootReport(
      "INFO",
      "Microphone device testing is inprogress"
    );
    var constraints = { audio: true, video: false };
    var parent = this;

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (mediaStream) {
        var tracks = mediaStream.getTracks();
        for (let i = 0; i < tracks.length; i++) {
          var track = tracks[i];
          parent.addToTrobuleshootReport(
            "INFO",
            "Device track settings: " +
              "len: " +
              tracks.length +
              ", id:" +
              track.getSettings().deviceId +
              ", kind: " +
              track.kind +
              ", label:" +
              track.label
          );
          //parent.setMicName(track.label);
          if (thisBrowserName != "Chrome") {
            //parent.setSpeakerName("Default");
          }
          audioTrack = track;
        }
        parent.fillStreamMicrophone(mediaStream, "mic");
      })
      .catch(function (error) {
        parent.addToTrobuleshootReport(
          "WARNING",
          "Microphone device testing failed"
        );
        parent.sendDeviceTestingEvent("MICROPHONE_TEST_FAIL");
        parent.addToTrobuleshootReport(
          "WARNING",
          "Error: " + error.message + ", name: " + error.name
        );
      });
  },

  stopMicTest: function () {
    this.closeAudioTrack();    
    this.addToTrobuleshootReport("INFO", "Mic device testing is stopped");
  },  

  stopMicTestSuccess: function () {
    this.closeAudioTrack();    
    this.addToTrobuleshootReport(
      "INFO",
      "Microphone device testing is successful"
    );
    this.sendDeviceTestingEvent("MICROPHONE_TEST_PASS");
    this.addToTrobuleshootReport("INFO", "Mic device testing is completed");
  },  
  
  stopMicTestFailure: function () {
    this.closeAudioTrack();    
    this.addToTrobuleshootReport(
      "INFO",
      "Microphone device testing is failure"
    );
    this.sendDeviceTestingEvent("MICROPHONE_TEST_FAIL");    
    this.addToTrobuleshootReport("INFO", "Mic device testing is failure");
    this.addToTrobuleshootReport("INFO", "Mic device testing is completed");
  },  

  setDeviceNames: function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      this.addToTrobuleshootReport("INFO", "enumerateDevices() not supported.");
      return;
    }
    var mediaDeviceId;
    var parent = this;
    navigator.mediaDevices
      .enumerateDevices()
      .then(function (deviceInfos) {
        for (let i = 0; i !== deviceInfos.length; ++i) {
          parent.addToTrobuleshootReport(
            "INFO",
            "Device: " +
              deviceInfos[i].kind +
              ", label: " +
              deviceInfos[i].label +
              ", id:" +
              deviceInfos[i].deviceId
          );
          if (deviceInfos[i].deviceId == "default") {
            if (deviceInfos[i].kind == "audiooutput") {
              var speakerName = deviceInfos[i].label;
              diagnosticsCallback.triggerKeyValueSetCallback("speakerInfo", deviceInfos[i].label, "speakerInfo")
            } else if (deviceInfos[i].kind == "audioinput") {
              var micName = deviceInfos[i].label;
              diagnosticsCallback.triggerKeyValueSetCallback("micInfo", deviceInfos[i].label, "micInfo")
            }
          }
        }
      })
      .catch(function (error) {
        parent.addToTrobuleshootReport(
          "INFO",
          "Error: " + error.message + ", name: " + error.name
        );
      });
  },

  closeAudioTrack: function () {
    logger.log("In close audio track..")
    if (audioTrack) {
      audioTrack.stop();
      audioTrack = undefined;
    }
    if (micNode) {
      micNode.disconnect();
      micNode = undefined;
    }
    if (speakerNode) {
      speakerNode.disconnect();
      speakerNode = undefined;
    }
  },

  fillStreamMicrophone: function (stream, outDevice) {
    try {
      var audioContext = new AudioContext();
    var analyser = audioContext.createAnalyser();
    var source = audioContext.createMediaStreamSource(stream);
    micNode = audioContext.createScriptProcessor(2048, 1, 1);
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyser.connect(micNode);
    micNode.connect(audioContext.destination);
    micNode.onaudioprocess = function () {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;
      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += array[i];
      }
      var average = values / length;
      //diagnosticsCallback.triggerDiagnosticsMicStatusCallback(average, "mic ok");
      diagnosticsCallback.triggerKeyValueSetCallback("mic", average, "mic ok")
      if (average > 9) {
        //fillMicColors(Math.round(average));
      }
    };
    } catch (e) {
      logger.log("Media source not available for mic test ..")
      average = 0;
      //diagnosticsCallback.triggerDiagnosticsMicStatusCallback(average, "mic error");      
      diagnosticsCallback.triggerKeyValueSetCallback("mic", average, "mic error")
    }
  },

  fillStreamSpeaker: function (stream, outDevice) {
    try {
    var audioContext = new AudioContext();
    var analyser = audioContext.createAnalyser();
    var source = audioContext.createMediaStreamSource(stream);
    speakerNode = audioContext.createScriptProcessor(2048, 1, 1);
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;
    source.connect(analyser);
    analyser.connect(speakerNode);
    speakerNode.connect(audioContext.destination);
    speakerNode.onaudioprocess = function () {
      var array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      var values = 0;
      var length = array.length;
      for (var i = 0; i < length; i++) {
        values += array[i];
      }
      var average = values / length;
      diagnosticsCallback.triggerKeyValueSetCallback("speaker", average, "speaker ok");    
    };
    } catch (e) {
      logger.log("Media source not available for speaker test ..")
      average = 0;
      diagnosticsCallback.triggerKeyValueSetCallback("speaker", average, "speaker error");    
    }
  },

  setUserRegTroubleshootData: function(txtUser) {
    logger.log("No explicit registration sent during testing...")
  },

  setWSTroubleshootData: function(txtWsStatus) {
	  //Already done during init, no need to do again. 
    let txtWSSUrl = webrtcSIPPhone.getWSSUrl();
    diagnosticsCallback.triggerKeyValueSetCallback("wss", txtWsStatus, txtWSSUrl)
  },

  startWSAndUserRegistrationTest: function () {
	try {  
   	this.startNetworkProtocolTest();
	} catch (e) {
		logger.log(e);
	}
  },

  sendEventToWebRTCTroubleshooter: function (eventType, sipMethod) {
    if (sipMethod == "CONNECTION") {
      eventType = eventType + "_" + sipMethod;
    }

    if (eventMapper.hasOwnProperty(webRTCPhoneEngine)) {
      this.addToTrobuleshootReport("INFO", "WebRTCPhoneEvent " + eventType);
      var mapper = eventMapper[webRTCPhoneEngine];
      if (mapper.hasOwnProperty(eventType)) {
        this.sendNetworkTestingEvent(mapper[eventType]);
        this.addToTrobuleshootReport(
          "INFO",
          "TroubleshooterEvent " + mapper[eventType]
        );
      }
    }
  },

  noop: function () {},

  sendNetworkTestingEvent: function (event) {
    this.addToTrobuleshootReport("INFO", "NETWORK EVENT =  " + event);
  },

  sendDeviceTestingEvent: function (event) {
    this.addToTrobuleshootReport("INFO", "DEVICE EVENT =  " + event);
  },

  setTroubleshootCandidateData: function (key, status, value) {
    logger.log(
      "Candidate Data \n\t key = " + key + " status = " + status + "\n\tValue = " + value + "\n\n"
    );
    diagnosticsCallback.triggerKeyValueSetCallback(key, status, value);
  },

  startCandidatesForTroubleshoot: function () {
    var keys = ["udp", "tcp", "ipv6", "host", "srflx"];
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      this.setTroubleshootCandidateData(key, "waiting", "");
    }
  },  

  proccessCandidatesForTroubleshoot: function (candidates) {
    candidateProcessData = {
      udp: false,
      udpCandidates: [],
      tcp: false,
      tcpCandidates: [],
      ipv6: false,
      ipv6Candidates: [],
      host: false,
      hostCandidates: [],
      srflx: false,
      srflxCandidates: [],
    };

    var keys = ["udp", "tcp", "ipv6", "host", "srflx"];
    var success_status = ["connected", "connected", "connected", "connected", "connected"];
    var failure_status = ["disconnected", "disconnected", "disconnected", "disconnected", "disconnected"];

    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i].candidate;
      this.addToTrobuleshootReport("INFO", "Gathered candidate " + candidate);
      var candidateData = candidate.split(" ");
      var protocolType = candidateData[2];
      var candidateType = candidateData[7];
      var address = candidateData[4];

      if (protocolType == "udp" || protocolType == "UDP") {
        candidateProcessData.udp = true;
        candidateProcessData.udpCandidates.push(candidate);
        if (candidate.length > 0) {       
          this.sendNetworkTestingEvent("UDP_TEST_COMPLETE");
        }
      } else if (protocolType == "tcp" || protocolType == "TCP") {
        candidateProcessData.tcp = true;
        candidateProcessData.tcpCandidates.push(candidate);
        this.sendNetworkTestingEvent("TCP_TEST_COMPLETE");
      }

      try {
      if (address.includes(":")  || address.includes("-") ) {
        candidateProcessData.ipv6 = true;
        candidateProcessData.ipv6Candidates.push(candidate);
        this.sendNetworkTestingEvent("IPV6_TEST_COMPLETE");
      }
      } catch (e) {
        this.sendNetworkTestingEvent("IPV6_TEST_COMPLETE");
      } 

      if (candidateType == "host") {
        candidateProcessData.host = true;
        candidateProcessData.hostCandidates.push(candidate);
        this.sendNetworkTestingEvent("HOST_CON_TEST_COMPLETE");
      } else if (candidateType == "srflx") {
        candidateProcessData.srflx = true;
        candidateProcessData.srflxCandidates.push(candidate);
        this.sendNetworkTestingEvent("REFLEX_CON_TEST_COMPLETE");
      }
    }


    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (candidateProcessData.hasOwnProperty(key)) {
        var candidates = candidateProcessData[key + "Candidates"];
        if (candidates.length == 0) {
          this.setTroubleshootCandidateData(key, failure_status[j], "");
          logger.log("empty candidates:" + candidates);
        } else {
          var cmsg = "found  candidates " + candidates.length + "\n";
          for (var k = 0; k < candidates.length; k++) {
            this.setTroubleshootCandidateData(key, success_status[j], candidates[k]);
            cmsg = cmsg + candidates[k] + "\n";
          }
          logger.log(cmsg);
        }
      }
    }

  },

  isCandidateGathered: function (type) {
    if (candidateProcessData.hasOwnProperty(type)) {
      if (candidateProcessData[type]) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },

  startNetworkProtocolTest: function () {
    var parent = this;
    this.sendNetworkTestingEvent("UDP_TEST_STARTING");
    this.sendNetworkTestingEvent("TCP_TEST_STARTING");
    this.sendNetworkTestingEvent("IPV6_TEST_STARTING");
    this.sendNetworkTestingEvent("HOST_CON_TEST_STARTING");
    this.sendNetworkTestingEvent("REFLEX_CON_TEST_STARTING");
    this.addToTrobuleshootReport("INFO", "Gathering ICE candidates ");

    this.startCandidatesForTroubleshoot()    

    var configuration = {
      iceServers: [
        {
          url: "stun:stun.l.google.com:19302",
        },
      ],
    };
    var pc = new RTCPeerConnection(configuration);
    var candidates = [];

    pc.addEventListener("icecandidate", function (e) {
      if (e.candidate) {
        candidates.push(e.candidate);
      }
    });

    pc.addEventListener("iceconnectionstatechange", function (e) {
      logger.log("ice connection state: " + pc.iceConnectionState);
    });

    pc.addEventListener("icegatheringstatechange", function (e) {
      parent.setWSTroubleshootData('connected');

      parent.addToTrobuleshootReport(
        "INFO",
        "ice gathering state: " + e.target.iceGatheringState
      );

      if (e.target.iceGatheringState == "complete") {
        parent.proccessCandidatesForTroubleshoot(candidates);
        if (pc) {
          pc.close();
        }
      }
    });

    var createOfferParams = { offerToReceiveAudio: 1 };
    pc.createOffer(createOfferParams).then(function (offer) {
      pc.setLocalDescription(offer).then(parent.noop, parent.noop);
    }, parent.noop);
  },
};

//ameyoWebRTCTroubleshooter.getBrowserData();
