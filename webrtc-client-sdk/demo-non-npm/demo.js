const  exWebClient = new exotelSDK.ExotelWebClient();
var call = null;
var sipInfo = JSON.parse(phone)[0];
let params = (new URL(document.location)).searchParams;
let username = params.get("username");
username = username ? username  : sipInfo.Username;
let secret = params.get("secret");
secret = secret ? secret : sipInfo.Password;
console.log("username "+username+"&secret= "+secret);
function UserAgentRegistration() {
  
	var sipAccountInfo= {
		'userName':  username,
		'authUser': username,
		'sipdomain': sipInfo.Domain,
		'domain': sipInfo.HostServer + ":" + sipInfo.Port,
		'displayname': username,
		'secret': secret,
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
    document.getElementById("call_status").innerHTML = eventType +"  "+phone;
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