import {webrtcTroubleshooterEventBus} from './DiagnosticsListener';
import {ameyoWebRTCTroubleshooter} from '../../listeners/Callback';

declare global {
	interface Window {
        FSM:any
        deviceTestingFSM:any
        networkTestingFSM:any
        startMicTest:any
        startSpeakerTest:any
        sendDeviceTestingEvent:any
        sendNetworkTestingEvent:any
    }
}

class AmeyoWebrtcTroubleshooterFSM { 

    constructor(){
        this.addDeviceTestingFSMTransitions();
        this.addNetworkTestingFSMTransitions();
        window.deviceTestingFSM = this.deviceTestingFSM;
        window.networkTestingFSM = this.networkTestingFSM;
        window.sendDeviceTestingEvent = this.sendDeviceTestingEventForFSM;
        window.sendNetworkTestingEvent = this.sendNetworkTestingEventForFSM;
    }
    
    deviceTestingFSM:any = new window.FSM("INITIAL_STATE", { name: "Device testing FSM" });
    networkTestingFSM:any = new window.FSM("INITIAL_STATE", { name: "Network testing FSM" });

    addDeviceTestingFSMTransitions=()=>{
        this.deviceTestingFSM.addTransition(
            'MICROPHONE_TEST_STARTING',
            'INITIAL_STATE', 
            null, 
            'MICROPHONE_TEST_STARTED', 
            this.startMicTest
        );
        this.deviceTestingFSM.addTransition(
            'MICROPHONE_TEST_PASS',
            'MICROPHONE_TEST_STARTED', 
            null,
            'MICROPHONE_TEST_PASSED', 
            this.microphoneSuccessCallback
            );


        this.deviceTestingFSM.addTransition(
            'MICROPHONE_TEST_FAIL',
            'MICROPHONE_TEST_STARTED',
            null,
            'MICROPHONE_TEST_FAILED', 
            this.microphoneFailureCallback
        );
        this.deviceTestingFSM.addTransition(
            'PROCEED',
            'MICROPHONE_TEST_PASSED', 
            null, 
            'MICROPHONE_TEST_DONE',
            this.microphoneTestDoneCallback
        );
        this.deviceTestingFSM.addTransition(
            'PROCEED',
            'MICROPHONE_TEST_FAILED', 
            null, 
            'MICROPHONE_TEST_DONE',
            this.microphoneTestDoneCallback
        );
        this.deviceTestingFSM.addTransition(
            'SPEAKER_TEST_STARTNG',
            'MICROPHONE_TEST_DONE', 
            null, 
            'SPEAKER_TEST_STARTED',
            this.startSpeakerTest
        );
        this.deviceTestingFSM.addTransition(
            'SPEAKER_TEST_PASS',
            'SPEAKER_TEST_STARTED', 
            null, 
            'SPEAKER_TEST_PASSED',
            this.speakerSuccessCallback
        );
        this.deviceTestingFSM.addTransition(
            'SPEAKER_TEST_FAIL',
            'SPEAKER_TEST_STARTED', 
            null, 
            'SPEAKER_TEST_FAILED',
            this.speakerFailureCallback
        );
        this.deviceTestingFSM.addTransition(
            'PROCEED',
            'SPEAKER_TEST_PASSED',
            null, 
            'SPEAKER_TEST_DONE',
            this.speakerTestDoneCallback
        );
        this.deviceTestingFSM.addTransition(
            'PROCEED',
            'SPEAKER_TEST_FAILED', 
            null, 
            'SPEAKER_TEST_DONE',
            this.speakerTestDoneCallback
        );
    }

    startMicTest =()=>{
        ameyoWebRTCTroubleshooter.startMicTest();
    }

    startSpeakerTest=()=>{
        ameyoWebRTCTroubleshooter.startSpeakerTest();
    }

    microphoneSuccessCallback=()=>{
        this.deviceTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.microphoneTestSuccessEvent();
    }

    microphoneFailureCallback=()=>{
        this.deviceTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.microphoneTestFailedEvent();
    }

    microphoneTestDoneCallback=()=>{
        webrtcTroubleshooterEventBus.microphoneTestDoneEvent();
    }

    speakerSuccessCallback=()=>{
        this.deviceTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.speakerTestSuccessEvent();
    }

    speakerFailureCallback=()=>{
        this.deviceTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.speakerTestFailedEvent();
    }

    speakerTestDoneCallback=()=>{
        webrtcTroubleshooterEventBus.speakerTestDoneEvent();
    }

    addNetworkTestingFSMTransitions=()=>{

        this.networkTestingFSM.addTransition(
            'WS_TEST_STARTING',
            'INITIAL_STATE', 
            null, 
            'WS_TEST_STARTED',
            this.startWebsocketTesting
        );
        this.networkTestingFSM.addTransition(
            'WS_TEST_PASS',
            'WS_TEST_STARTED', 
            null, 
            'WS_TEST_PASSED',
            this.wsPassCallback
        );
        this.networkTestingFSM.addTransition(
            'WS_TEST_FAIL',
            'WS_TEST_STARTED', 
            null, 
            'WS_TEST_FAILED',
            this.wsFailCallback
        );
        this.networkTestingFSM.addTransition(
            'PROCEED',
            'WS_TEST_PASSED', 
            null, 
            'WS_TEST_DONE',
            this.wsTestDoneCallback
        );
        this.networkTestingFSM.addTransition(
            'PROCEED',
            'WS_TEST_FAILED', 
            null, 
            'WS_TEST_DONE',
            this.wsTestDoneCallback
        );
        this.networkTestingFSM.addTransition(
            'USER_REG_TEST_STARTING',
            'WS_TEST_DONE', 
            null, 
            'USER_REG_TEST_STARTED', 
            null
        );
        this.networkTestingFSM.addTransition(
            'USER_REG_TEST_PASS',
            'USER_REG_TEST_STARTED', 
            null, 
            'USER_REG_TEST_PASSED',
            this.userRegPassCallback
        );
        this.networkTestingFSM.addTransition(
            'USER_REG_TEST_FAIL',
            'USER_REG_TEST_STARTED', 
            null, 
            'USER_REG_TEST_FAILED',
            this.userRegFailCallback
        );
        this.networkTestingFSM.addTransition(
            'PROCEED',
            'USER_REG_TEST_PASSED', 
            null, 
            'USER_REG_TEST_DONE',
            this.userRegDoneCallback
        );
        this.networkTestingFSM.addTransition(
            'PROCEED',
            'USER_REG_TEST_FAILED', 
            null, 
            'USER_REG_TEST_DONE',
            this.userRegDoneCallback
        );
        this.networkTestingFSM.addTransition(
            'UDP_TEST_STARTING',
            'USER_REG_TEST_DONE', 
            null, 
            'UDP_TEST_STARTED', 
            this.startNetworkProtocolTesting
        );
        this.networkTestingFSM.addTransition(
            'UDP_TEST_COMPLETE',
            'UDP_TEST_STARTED', 
            null, 
            'UDP_TEST_COMPLETED',
            this.udpCompletedCallback
        );
        this.networkTestingFSM.addTransition(
            'TCP_TEST_STARTING',
            'UDP_TEST_COMPLETED', 
            null, 
            'TCP_TEST_STARTED', 
            null
        );
        this.networkTestingFSM.addTransition(
            'TCP_TEST_COMPLETE',
            'TCP_TEST_STARTED', 
            null, 
            'TCP_TEST_COMPLETED',
            this.tcpCompletedCallback
        );
        this.networkTestingFSM.addTransition(
            'IPV6_TEST_STARTING',
            'TCP_TEST_COMPLETED', 
            null, 
            'IPV6_TEST_STARTED',
            null
        );
        this.networkTestingFSM.addTransition(
            'IPV6_TEST_COMPLETE',
            'IPV6_TEST_STARTED', 
            null, 
            'IPV6_TEST_COMPLETED',
            this.ipv6CompletedCallback
        );
        this.networkTestingFSM.addTransition(
            'HOST_CON_TEST_STARTING',
            'IPV6_TEST_COMPLETED', 
            null, 
            'HOST_CON_TEST_STARTED',
            null
        );
        this.networkTestingFSM.addTransition(
            'HOST_CON_TEST_COMPLETE',
            'HOST_CON_TEST_STARTED', 
            null,
            'HOST_CON_TEST_COMPLETED', 
            this.hostCandidateCompletedCallback
        );
        this.networkTestingFSM.addTransition(
            'REFLEX_CON_TEST_STARTING',
            'HOST_CON_TEST_COMPLETED', 
            null,
            'REFLEX_CON_TEST_STARTED', 
            null
        );
        this.networkTestingFSM.addTransition(
            'REFLEX_CON_TEST_COMPLETE',
            'REFLEX_CON_TEST_STARTED', 
            null,
            'REFLEX_CON_TEST_COMPLETED', 
            this.reflexCandidateCompletedCallback
        );


        
    }

    startNetworkProtocolTesting=()=>{
        ameyoWebRTCTroubleshooter.startNetworkProtocolTest();
    }

    startWebsocketTesting=()=>{
    	ameyoWebRTCTroubleshooter.startWsTesting(); 
    } 
    
    wsPassCallback=()=>{
        this.networkTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.wsConTestSuccessEvent();
    }

    wsFailCallback=()=>{
        this.networkTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.wsConTestFailedEvent();
    }

    wsTestDoneCallback=()=>{
        webrtcTroubleshooterEventBus.wsConTestDoneEvent();
    }

    userRegPassCallback=()=>{
        this.networkTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.userRegTestSuccessEvent();
    }

    userRegFailCallback=()=>{
        this.networkTestingFSM.sendEvent('PROCEED', null);
        webrtcTroubleshooterEventBus.userRegTestFailedEvent();
    }

    userRegDoneCallback=()=>{
        webrtcTroubleshooterEventBus.userRegTestDoneEvent();
        this.networkTestingFSM.sendEvent('UDP_TEST_STARTING',null);
    }

    udpCompletedCallback=()=>{
        webrtcTroubleshooterEventBus.udpTestCompletedEvent();
    }

    tcpCompletedCallback=()=>{
        webrtcTroubleshooterEventBus.tcpTestCompletedEvent();
    }

    ipv6CompletedCallback=()=>{
        webrtcTroubleshooterEventBus.ipv6TestCompletedEvent();
    }

    hostCandidateCompletedCallback=()=>{
        webrtcTroubleshooterEventBus.hostCandidateTestCompletedEvent();
    }

    reflexCandidateCompletedCallback=()=>{
    	webrtcTroubleshooterEventBus.reflexCandidateTestCompletedEvent();
    }



    sendDeviceTestingEventForFSM=(event:string)=> {
        this.deviceTestingFSM.sendEvent(event.toUpperCase(), null);
    }

    sendNetworkTestingEventForFSM=(event:string)=> {
        this.networkTestingFSM.sendEvent(event.toUpperCase(), null);
    }    
    
    
    
    
    restFSM(){
        if(this.deviceTestingFSM.currentState === 'SPEAKER_TEST_PASSED' || this.deviceTestingFSM.currentState === 'SPEAKER_TEST_STARTED')
            ameyoWebRTCTroubleshooter.stopSpeakerTesttone();
        
        this.deviceTestingFSM = new window.FSM("INITIAL_STATE", { name: "Device testing FSM" });
        this.networkTestingFSM = new window.FSM("INITIAL_STATE", { name: "Network testing FSM" });
        this.addDeviceTestingFSMTransitions();
        this.addNetworkTestingFSMTransitions();
        window.deviceTestingFSM = this.deviceTestingFSM;
        window.networkTestingFSM = this.networkTestingFSM;
    }

}

const ameyoWebrtcTroubleshooterFSMInstance= new AmeyoWebrtcTroubleshooterFSM();

export default ameyoWebrtcTroubleshooterFSMInstance;




