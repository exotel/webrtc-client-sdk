const exWebClient = new exotelSDK.ExotelWebClient();


var call = null;


function initSDK() {
    isInitialized = true;
    var sipInfo = JSON.parse(phone)[0]

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
    exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback)
}

function UserAgentRegistration() {
    console.log("Test.js: Calling DoRegister")
    exWebClient.DoRegister();
}

var toggleRegister = true;
function registerToggle() {
    let toggler = toggleRegister;
    toggleRegister = !toggleRegister;
    if (toggler) {
        UserAgentRegistration();
        document.getElementById("registerButton").innerHTML = "STOP";
    } else {
        console.log("doing unregistration");
        exWebClient.UnRegister();
        document.getElementById("registerButton").innerHTML = "START";
    }
}

function CallListenerCallback(callObj, eventType, sipInfo) {
    call = exWebClient.getCall();
    document.getElementById("call_status").innerHTML = eventType;
}

function CurrentInputDeviceCallback(currentInputDevice) {
    console.log("Current input device: ", currentInputDevice);
    document.getElementById("current_input_device").innerHTML = currentInputDevice;
}

function CurrentOutputDeviceCallback(currentOutputDevice) {
    console.log("Current output device: ", currentOutputDevice);
    document.getElementById("current_output_device").innerHTML = currentOutputDevice;
}

function RegisterEventCallBack(state, sipInfo) {
    document.getElementById("status").innerHTML = state;
    //exWebClient.setPreferredCodec("opus")
    exWebClient.registerAudioDeviceChangeCallback(function (deviceId) {
        console.log(`demo:audioInputDeviceCallback device changed to ${deviceId}`);
    }, function (deviceId) {
        console.log(`demo:audioOutputDeviceCallback device changed to ${deviceId}`);
    });


  // --- NEW: once registered, apply UI volumes to SDK ---
  if (String(state).toLowerCase() === "registered") {
    const pct = id => {
      const el = document.getElementById(id);
      return el ? Math.max(0, Math.min(1, Number(el.value) / 100)) : 1;
    };

    // Global notif volumes -> all accounts
    ["ringtone", "ringbacktone", "beeptone", "dtmftone"].forEach(t => {
      try { exWebClient.setSoundVolume(t, pct(`slider-${t}`)); } catch {}
    });

    // Per-account call volume
    try { exWebClient.setAudioOutputVolume("audioRemote", pct("slider-call-acc1")); } catch {}
  }
}

function SessionCallback(state, sipInfo) {
    console.log('Session state:', state, 'for number...', sipInfo);
}

function toggleMuteButton() {
    if (call) {
        call.MuteToggle();
        if (document.getElementById("muteButton").innerHTML === "UNMUTE") {
            document.getElementById("muteButton").innerHTML = "MUTE";
        } else {
            document.getElementById("muteButton").innerHTML = "UNMUTE";
        }
    }
}

function acceptCall() {
    if (call) {
        call.Answer();
    }
}

function rejectCall() {
    if (call) {
        call.Hangup();
    }
}

function toggleHoldButton() {
    if (call) {
        call.HoldToggle();
        if (document.getElementById("holdButton").innerHTML === "UNHOLD") {
            document.getElementById("holdButton").innerHTML = "HOLD";
        } else {
            document.getElementById("holdButton").innerHTML = "UNHOLD";
        }
    }
}

function sendDTMF(digit) {
    if (call) {
        call.sendDTMF(digit);
    }
}

// Function to change input device change
function changeAudioInputDevice() {
    const selectedDeviceId = document.getElementById('inputDevices').value;
    exWebClient.changeAudioInputDevice(
        selectedDeviceId,
        () => console.log(`Input device changed successfully`),
        (error) => console.log(`Failed to change input device: ${error}`)
    );
}

function downloadLogs() {
    exWebClient.downloadLogs();
}

// Function to change output device change
function changeAudioOutputDevice() {
    const selectedDeviceId = document.getElementById('outputDevices').value;
    exWebClient.changeAudioOutputDevice(
        selectedDeviceId,
        () => console.log(`Output device changed successfully`),
        (error) => console.log(`Failed to change output device: ${error}`)
    );
}

//populate the device dropdowns
async function populateDeviceDropdowns() {

    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputDevices = devices.filter(device => device.kind === 'audioinput');
    const outputDevices = devices.filter(device => device.kind === 'audiooutput');
    const defaultInputDevice = inputDevices.find(device => device.deviceId === "default");
    const defaultOutputDevice = outputDevices.find(device => device.deviceId === "default");

        const inputDropdown  = document.getElementById('inputDevices');
        const outputDropdown = document.getElementById('outputDevices');
        if (!inputDropdown || !outputDropdown) {   // page section not present
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
        if (device.groupId == defaultInputDevice.groupId) {
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
        if (device.groupId == defaultOutputDevice.groupId) {
            option.selected = true;
        }
        option.textContent = device.label || `Output Device ${device.deviceId}`;
        outputDropdown.appendChild(option);
    });
}

// Populate dropdowns when the page loads
window.addEventListener('load', populateDeviceDropdowns);

navigator.mediaDevices.addEventListener('devicechange', populateDeviceDropdowns);

window.addEventListener('load', () => {
  initSDK();
  populateDeviceDropdowns(); 
});

// Diagnostics callbacks
function diagnosticsReportCallback(saveStatus, saveData) {
    logDiagnostics("Report: " + saveStatus + "\n" + saveData);
}
function diagnosticsKeyValueCallback(key, status, description) {
    logDiagnostics("Key: " + key + ", Status: " + status + ", Desc: " + description);
}
function logDiagnostics(msg) {
    var ta = document.getElementById('diagnosticsLog');
    if (ta) ta.value += msg + "\n";
}
// Diagnostics API wrappers
function initDiagnostics() {
    exWebClient.initDiagnostics(diagnosticsReportCallback, diagnosticsKeyValueCallback);
    logDiagnostics("Diagnostics initialized");
}
function closeDiagnostics() {
    exWebClient.closeDiagnostics();
    logDiagnostics("Diagnostics closed");
}
function startSpeakerDiagnosticsTest() {
    exWebClient.startSpeakerDiagnosticsTest();
    logDiagnostics("Speaker test started");
}
function stopSpeakerDiagnosticsTest(result) {
    if (typeof result === 'undefined') {
        exWebClient.stopSpeakerDiagnosticsTest();
        logDiagnostics("Speaker test stopped (no result)");
    } else {
        exWebClient.stopSpeakerDiagnosticsTest(result);
        logDiagnostics("Speaker test stopped with result: " + result);
    }
}
function startMicDiagnosticsTest() {
    exWebClient.startMicDiagnosticsTest();
    logDiagnostics("Mic test started");
}
function stopMicDiagnosticsTest(result) {
    if (typeof result === 'undefined') {
        exWebClient.stopMicDiagnosticsTest();
        logDiagnostics("Mic test stopped (no result)");
    } else {
        exWebClient.stopMicDiagnosticsTest(result);
        logDiagnostics("Mic test stopped with result: " + result);
    }
}
function startNetworkDiagnostics() {
    exWebClient.startNetworkDiagnostics();
    logDiagnostics("Network diagnostics started");
}
function stopNetworkDiagnostics() {
    exWebClient.stopNetworkDiagnostics();
    logDiagnostics("Network diagnostics stopped");
}

function testBadInputDeviceId() {
    exWebClient.changeAudioInputDevice('bad-device-id',
        () => logDiagnostics('Input device changed (unexpected)'),
        (err) => logDiagnostics('Input device error: ' + err)
    );
}
function testBadOutputDeviceId() {
    exWebClient.changeAudioOutputDevice('bad-device-id',
        () => logDiagnostics('Output device changed (unexpected)'),
        (err) => logDiagnostics('Output device error: ' + err)
    );
}
function testMultipleDeviceCallbacks() {
    exWebClient.registerAudioDeviceChangeCallback(
        function(deviceId) { logDiagnostics('First input callback: ' + deviceId); },
        function(deviceId) { logDiagnostics('First output callback: ' + deviceId); }
    );
    exWebClient.registerAudioDeviceChangeCallback(
        function(deviceId) { logDiagnostics('Second input callback: ' + deviceId); },
        function(deviceId) { logDiagnostics('Second output callback: ' + deviceId); }
    );
    logDiagnostics('Registered two audio device change callbacks. Now plug/unplug a device to test.');
}

function muteCall() {
    if (call) {
        call.Mute();
        logDiagnostics('Mute called');
    } else {
        logDiagnostics('No active call to mute');
    }
}
function unmuteCall() {
    if (call) {
        call.UnMute();
        logDiagnostics('UnMute called');
    } else {
        logDiagnostics('No active call to unmute');
    }
}


// ----- volume helpers -----
function _percentToUnit(v) {
    const n = Number(v);
    if (Number.isNaN(n)) return 1.0;
    return Math.max(0, Math.min(1, n / 100));
}
  
  // Global notifications: apply to ALL accounts present on the page
  
  
  // Per-account call volumes
  function onCallVolumeChange1(percent) {
    const value = _percentToUnit(percent);
    try { exWebClient.setCallAudioOutputVolume( value); } catch (e) {
        console.error(`Failed to set call audio output volume: ${e}`);
    }
  }
    
  // Initialize slider positions from SDK (optional but nice)
  function initVolumeSliders() {
    // Initialize Account 1 sliders
    try {
      const r = Math.round((exotelSDK.ExotelWebClient.getAudioOutputVolume('ringtone') ?? 1) * 100);
      const rb = Math.round((exotelSDK.ExotelWebClient.getAudioOutputVolume('ringbacktone') ?? 1) * 100);
      const b = Math.round((exotelSDK.ExotelWebClient.getAudioOutputVolume('beeptone') ?? 1) * 100);
      const d = Math.round((exotelSDK.ExotelWebClient.getAudioOutputVolume('dtmftone') ?? 1) * 100);
      const c1 = Math.round((exWebClient.getAudioOutputVolume('audioRemote') ?? 1) * 100);
  
      const s = id => document.getElementById(id);
      if (s('slider-ringtone')) s('slider-ringtone').value = r;
      if (s('slider-ringbacktone')) s('slider-ringbacktone').value = rb;
      if (s('slider-beeptone'))     s('slider-beeptone').value = b;
      if (s('slider-dtmftone'))     s('slider-dtmftone').value = d;
      if (s('slider-call-acc1')) s('slider-call-acc1').value = c1;
    } catch (_) {}
  
    // If a second account exists, set its call slider too
    try {
      if (window.exWebClient2) {
        const s = id => document.getElementById(id);
        if (s('slider-call-acc2')) s('slider-call-acc2').value = c2;
      }
    } catch (_) {}
    
    // Initialize Account 2 sliders if available
    try { if (window.initVolumeSliders2) window.initVolumeSliders2(); } catch (_) {}
  }
