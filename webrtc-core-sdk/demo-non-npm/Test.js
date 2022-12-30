function ExDelegationHandler(exClient_) {
    var exClient = exClient_;
    this.setTestingMode = function(mode) {
        console.log("delegationHandler: setTestingMode\n");
    }

    this.onCallStatSipJsSessionEvent = function(ev) {
        console.log("delegationHandler: onCallStatSipJsSessionEvent\n");
    }

    this.sendWebRTCEventsToFSM = function(eventType, sipMethod) {
        console.log("delegationHandler: sendWebRTCEventsToFSM\n");
        console.log("delegationHandler: eventType\n", eventType);
        console.log("delegationHandler: sipMethod\n", sipMethod);
        if (sipMethod == "CONNECTION") {
            exClient.registerEventCallback(eventType, exClient.userName)
        } else if (sipMethod == "CALL") {
            exClient.callEventCallback(eventType, exClient.userName,exClient.call)
        }
    }

    this.playBeepTone = function() {
        console.log("delegationHandler: playBeepTone\n");
    }

    this.onStatPeerConnectionIceGatheringStateChange = function(iceGatheringState) {
        console.log("delegationHandler: onStatPeerConnectionIceGatheringStateChange\n");
    }

    this.onCallStatIceCandidate = function(ev,icestate) {
        console.log("delegationHandler: onCallStatIceCandidate\n");
    }

    this.onCallStatNegoNeeded = function(icestate) {
        console.log("delegationHandler: onCallStatNegoNeeded\n");
    }

    this.onCallStatSignalingStateChange = function(cstate) {
        console.log("delegationHandler: onCallStatSignalingStateChange\n");
    }

    this.onStatPeerConnectionIceConnectionStateChange = function() {
        console.log("delegationHandler: onStatPeerConnectionIceConnectionStateChange\n");
    }

    this.onStatPeerConnectionConnectionStateChange = function() {
        console.log("delegationHandler: onStatPeerConnectionConnectionStateChange\n");
    }

    this.onGetUserMediaSuccessCallstatCallback = function() {
        console.log("delegationHandler: onGetUserMediaSuccessCallstatCallback\n");
    }

    this.onGetUserMediaErrorCallstatCallback = function() {
        console.log("delegationHandler: onGetUserMediaErrorCallstatCallback\n");
    }

    this.onCallStatAddStream = function() {
        console.log("delegationHandler: onCallStatAddStream\n");
    }

    this.onCallStatRemoveStream = function() {
        console.log("delegationHandler: onCallStatRemoveStream\n");
    }

    this.setWebRTCFSMMapper = function(stack) {
        console.log("delegationHandler: setWebRTCFSMMapper : Initialisation complete \n");
    }

    this.onCallStatSipJsTransportEvent = function() {
        console.log("delegationHandler: onCallStatSipJsTransportEvent\n");
    }

    this.onCallStatSipSendCallback = function() {
        console.log("delegationHandler: onCallStatSipSendCallback\n");
    }

    this.onCallStatSipRecvCallback = function() {
        console.log("delegationHandler: onCallStatSipRecvCallback\n");
    }

    this.stopCallStat = function() {
        console.log("delegationHandler: stopCallStat\n");
    }

    this.onRecieveInvite = function() {
        console.log("delegationHandler: onRecieveInvite\n");
    }

    this.onPickCall = function() {
        console.log("delegationHandler: onPickCall\n");
    }

    this.onRejectCall = function() {
        console.log("delegationHandler: onRejectCall\n");
    }

    this.onCreaterAnswer = function() {
        console.log("delegationHandler: onCreaterAnswer\n");
    }

    this.onSettingLocalDesc = function() {
        console.log("delegationHandler: onSettingLocalDesc\n");
    }

    this.initGetStats = function(pc, callid, username) {
        console.log("delegationHandler: initGetStats\n");
    }

    this.onRegisterWebRTCSIPEngine = function(engine) {
        console.log("delegationHandler: onRegisterWebRTCSIPEngine, engine=\n", engine);
    }    
}

 function ExSynchronousHandler() {

    this.onFailure = function() {
        console.log("synchronousHandler: onFailure, phone is offline.\n");
    }

    this.onResponse = function() {
        console.log("synchronousHandler: onResponse, phone is connected.\n");
    }
}

 class ExotelWebClient  {

     registerEventCallback =(event, phone, param) => {
        
	    console.log("Dialer: registerEventCallback: Received ---> " + event + 'phone....', phone + 'param....', param)
        document.getElementById("status").innerHTML = event;
        if (event === "connected"){
            document.getElementById("registerButton").innerHTML = "UNREGISTER";
        } else {
            document.getElementById("registerButton").innerHTML = "REGISTER";
        }

    };
    
    callEventCallback =(event, phone, param) => {
	    console.log("Dialer: callEventCallback: Received ---> " + event + 'param sent....' + param + 'for phone....' + phone)
        document.getElementById("call_status").innerHTML = event;
    };
    
    diagnosticEventCallback =(event, phone, param) => {
        webrtcTroubleshooterEventBus.sendDiagnosticEvent(event, phone, param)
    };
}

var ExClient = new ExotelWebClient();

function UserAgentRegistration() {
    var phone = JSON.parse(document.getElementById('phone').textContent)[0]

	var sipAccountInfo= {
		'userName':  phone.Username,
		'authUser': phone.Username,
		'sipdomain': phone.Domain,
		'domain': phone.HostServer + ":" + phone.Port,
		'displayname': phone.DisplayName,
		'secret': phone.Password,
		'port': phone.Port,
		'security': phone.Security,
        'endpoint':phone.EndPoint
	  };
	sipAccountInfo["sipUri"] = "wss://" + sipAccountInfo["userName"] + "@" + sipAccountInfo["sipdomain"] + ":" + sipAccountInfo["port"];
	sipAccountInfo["accountSid"] = "exotel1";
    var delegationHandler = new ExDelegationHandler(ExClient);
    var synchronousHandler = new ExSynchronousHandler(ExClient);
	webrtcSDK.webrtcSIPPhone.registerPhone("sipjs",delegationHandler);
    webrtcSDK.webrtcSIPPhone.registerWebRTCClient(sipAccountInfo, synchronousHandler);
}

function registerToggle() {
    if(document.getElementById("registerButton").innerHTML === "REGISTER") {
        UserAgentRegistration();
    } else {
        webrtcSDK.webrtcSIPPhone.sipUnRegisterWebRTC();
    }
    
}

function toggleMuteButton() {
    webrtcSDK.webrtcSIPPhone.webRTCMuteUnmute(null);
    if(document.getElementById("muteButton").innerHTML === "UNMUTE"){
        document.getElementById("muteButton").innerHTML = "MUTE";
    } else {
        document.getElementById("muteButton").innerHTML = "UNMUTE";
    }
}

function acceptCall() {
    webrtcSDK.webrtcSIPPhone.pickCall();
}

function rejectCall() {
    webrtcSDK.webrtcSIPPhone.rejectCall();
}

function toggleHoldButton() {
    webrtcSDK.webrtcSIPPhone.holdCall();
    if(document.getElementById("holdButton").innerHTML === "UNHOLD"){
        document.getElementById("holdButton").innerHTML = "HOLD";
    } else {
        document.getElementById("holdButton").innerHTML = "UNHOLD";
    }
}