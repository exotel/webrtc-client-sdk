const  exWebClient = new exotelSDK.ExotelWebClient();
var call = null;
function UserAgentRegistration() {
    var sipInfo = JSON.parse(phone)[0];
	var sipAccountInfo= {
		'userName':  sipInfo.Username,
		'authUser': sipInfo.Username,
		'sipdomain': sipInfo.Domain,
		'domain': sipInfo.HostServer + ":" + sipInfo.Port,
		'displayname': sipInfo.DisplayName,
		'secret': sipInfo.Password,
		'port': sipInfo.Port,
		'security': sipInfo.Security,
        'endpoint':sipInfo.EndPoint
	  };
    exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback)
    console.log("Test.js: Calling DoRegister")
    exWebClient.DoRegister();
}

function registerToggle() {
    if(document.getElementById("registerButton").innerHTML === "REGISTER") {
        UserAgentRegistration();
    } else {
        exWebClient.unregister();
    }
}

function CallListenerCallback(callObj, eventType, phone) {
    call = exWebClient.getCall();
    document.getElementById("call_status").innerHTML = eventType;
 }

  function RegisterEventCallBack (state, phone){
    document.getElementById("status").innerHTML = state;
     if (state === 'registered') {
        document.getElementById("registerButton").innerHTML = "UNREGISTER";
     } else {
        document.getElementById("registerButton").innerHTML = "REGISTER";
     }

  }

  function SessionCallback(state, phone) {
     console.log('Session state:', state, 'for number...', phone);    
 }

function toggleMuteButton() {
    if(call){
        call.Mute();
        if(document.getElementById("muteButton").innerHTML === "UNMUTE"){
            document.getElementById("muteButton").innerHTML = "MUTE";
        } else {
            document.getElementById("muteButton").innerHTML = "UNMUTE";
        }
    }
}

function acceptCall() {
    if(call) {
        call.Answer();
    }
}

function rejectCall() {
    if(call) {
        call.Hangup();
    }
}

function toggleHoldButton() {
    if(call) {
        call.HoldToggle();
        if(document.getElementById("holdButton").innerHTML === "UNHOLD"){
            document.getElementById("holdButton").innerHTML = "HOLD";
        } else {
            document.getElementById("holdButton").innerHTML = "UNHOLD";
        }
    }
}