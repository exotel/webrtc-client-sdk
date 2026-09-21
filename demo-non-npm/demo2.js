const exWebClient2 = new exotelSDK.ExotelWebClient();


var call2 = null;
var isInitialized2 = false;

function initSDK2() {
    isInitialized2 = true;
    var sipInfo = JSON.parse(phone2)[0];

    var sipAccountInfo = {
        'userName': sipInfo.Username,
        'authUser': sipInfo.Username,
        'sipdomain': sipInfo.Domain,
        'domain': sipInfo.HostServer + ":" + sipInfo.Port,
        'displayname': sipInfo.DisplayName,
        'secret': sipInfo.Password,
        'port': sipInfo.Port,
        'security': sipInfo.Security,
        'endpoint': sipInfo.EndPoint
    };
    exWebClient2.initWebrtc(sipAccountInfo, RegisterEventCallBack2, CallListenerCallback2, SessionCallback2);
}

function UserAgentRegistration2() {
    console.log("demo2.js: Calling DoRegister");
    exWebClient2.DoRegister();
}

var toggleRegister2 = true;
function registerToggle2() {
    let toggler = toggleRegister2;
    toggleRegister2 = !toggleRegister2;
    if (toggler) {
        UserAgentRegistration2();
        document.getElementById("registerButton2").innerHTML = "STOP";
    } else {
        console.log("doing unregistration for demo2");
        exWebClient2.UnRegister();
        document.getElementById("registerButton2").innerHTML = "START";
    }
}

function CallListenerCallback2(callObj, eventType, sipInfo) {
    call2 = exWebClient2.getCall();
    document.getElementById("call_status2").innerHTML = eventType;
}

function RegisterEventCallBack2(state, sipInfo) {
    document.getElementById("status2").innerHTML = state;
    exWebClient2.setPreferredCodec("opus");
    
    // Register audio device callbacks after initialization
    exWebClient2.registerAudioDeviceChangeCallback(
        deviceId => console.log(`demo2:input device changed to ${deviceId}`),
        deviceId => console.log(`demo2:output device changed to ${deviceId}`)
    );
}

function SessionCallback2(state, sipInfo) {
    console.log('demo2: Session state:', state, 'for number...', sipInfo);
}

function acceptCall2() {
    if (call2) {
        call2.Answer();
    }
}

function rejectCall2() {
    if (call2) {
        call2.Hangup();
    }
}

function toggleMuteButton2() {
    if (call2) {
        call2.MuteToggle();
        const btn = document.getElementById("muteButton2");
        btn.innerHTML = (btn.innerHTML === "UNMUTE") ? "MUTE" : "UNMUTE";
    }
}

function toggleHoldButton2() {
    if (call2) {
        call2.HoldToggle();
        const btn = document.getElementById("holdButton2");
        btn.innerHTML = (btn.innerHTML === "UNHOLD") ? "HOLD" : "UNHOLD";
    }
}

function sendDTMF2(digit) {
    if (call2) {
        call2.sendDTMF(digit);
    }
}

function downloadLogs2() {
    exWebClient2.downloadLogs();
}

// Function to change output device for account 2
function changeAudioOutputDevice2() {
    const selectedDeviceId = document.getElementById('outputDevices2').value;
    exWebClient2.changeAudioOutputDevice(
        selectedDeviceId,
        () => console.log(`Account 2: Output device changed successfully`),
        (error) => console.log(`Account 2: Failed to change output device: ${error}`)
    );
}

// Function to change input device for account 2
function changeAudioInputDevice2() {
    const selectedDeviceId = document.getElementById('inputDevices2').value;
    exWebClient2.changeAudioInputDevice(
        selectedDeviceId,
        () => console.log(`Account 2: Input device changed successfully`),
        (error) => console.log(`Account 2: Failed to change input device: ${error}`)
    );
}

// Function to populate device dropdowns for account 2
async function populateDeviceDropdowns2() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputDevices = devices.filter(device => device.kind === 'audioinput');
    const outputDevices = devices.filter(device => device.kind === 'audiooutput');
    const defaultInputDevice = inputDevices.find(device => device.deviceId === "default");
    const defaultOutputDevice = outputDevices.find(device => device.deviceId === "default");

    const inputDropdown  = document.getElementById('inputDevices2');
    const outputDropdown = document.getElementById('outputDevices2');
    if (!inputDropdown || !outputDropdown) {   
        return;
    }
    inputDropdown.innerHTML  = "";
    outputDropdown.innerHTML = "";
    inputDevices.forEach(device => {
        if (device.deviceId == "" || device.deviceId == "default") {
            return;
        }
        const option = document.createElement('option');
        option.value = device.deviceId;
        if (defaultInputDevice && device.groupId == defaultInputDevice.groupId) {
            option.selected = true;
        }
        option.textContent = device.label || `Input Device ${device.deviceId}`;
        inputDropdown.appendChild(option);
    });

    outputDevices.forEach(device => {
        if (device.deviceId == "" || device.deviceId == "default") {
            return;
        }
        const option = document.createElement('option');
        option.value = device.deviceId;
        if (defaultOutputDevice && device.groupId == defaultOutputDevice.groupId) {
            option.selected = true;
        }
        option.textContent = device.label || `Output Device ${device.deviceId}`;
        outputDropdown.appendChild(option);
    });
}

window.addEventListener('load', () => {
    initSDK2();
    populateDeviceDropdowns2();
    initVolumeSliders2();
});
navigator.mediaDevices.addEventListener('devicechange', populateDeviceDropdowns2);

// ----- Account 2 volume helpers -----
function _percentToUnit2(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 1.0;
  return Math.max(0, Math.min(1, n / 100));
}

// Account 2 call volume
function onCallVolumeChange2(percent) {
  const value = _percentToUnit2(percent);
  try { exWebClient2.setCallAudioOutputVolume( value); } catch (_) {}
}

// Initialize Account 2 volume sliders
function initVolumeSliders2() {
  try {
    const c2 = Math.round((exWebClient2.getAudioOutputVolume('audioRemote') ?? 1) * 100);
    const s = id => document.getElementById(id);
    if (s('slider-call-acc2')) s('slider-call-acc2').value = c2;
  } catch (_) {}
}
