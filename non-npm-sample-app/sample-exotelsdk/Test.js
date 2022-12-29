const  exWebClient = new exotelSDK.ExotelWebClient();
var call = null;
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
    exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback)
    console.log("Test.js: Calling DoRegister")
    exWebClient.DoRegister();
}

function CallListenerCallback(callObj, eventType, phone) {
    call = exWebClient.getCall();
    document.getElementById("call_status").innerHTML = eventType;
 }

  function RegisterEventCallBack (state, phone){
     document.getElementById("status").innerHTML = state;
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