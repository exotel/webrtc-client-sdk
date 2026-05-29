import { useCallback, useRef } from 'react';
import { useWebRtcClient } from '../context/WebRtcClientContext';
import { useDiagnosticsContext } from '../context/DiagnosticsContext';
import { useCallContext } from '../context/CallContext';
import {
  takeScreenShotDirect,
  hideDiagnosticsCanvas,
  removeDiagnosticsCanvas,
} from '../utils/diagnosticsScreenshot';
import { buildDiagnosticsReportZip } from '../utils/diagnosticsReportZip';

export function useDiagnosticsFlow({ initialiseCallbacks, updateSipAccountInfo, sipAccountInfoRef }) {
  const exWebClient = useWebRtcClient();
  const { callDispatch } = useCallContext();
  const {
    diagnosticsState,
    diagnosticsDispatch,
    diagnosticsNetImageRef,
    diagnosticsDeviceImageRef,
    imageRef,
    commentsRef,
  } = useDiagnosticsContext();

  const micCounters = useRef({
    minMicStatus: 0,
    maxMicStatus: 0,
    lastMicTime: 0,
    minSpeakerStatus: 0,
    maxSpeakerStatus: 0,
    lastSpeakerTime: 0,
  });

  const keyValueSetCallback = useCallback(
    (key, status, value) => {
      if (key === 'wss' && status === 'connected') {
        window.localStorage.setItem('webrtcUrl', value);
      } else if (key === 'userReg') {
        const registeredUsers = JSON.parse(window.localStorage.getItem('registeredUsers') || '[]');
        let userRegistrationDescription = '';
        registeredUsers.forEach((u) => {
          userRegistrationDescription += `${u.phoneName},`;
        });
        window.localStorage.setItem('regUsers', userRegistrationDescription);
      } else if (key === 'speaker') {
        handleSpeakerStatus(status, value);
      } else if (key === 'mic') {
        handleMicStatus(status, value);
      } else if (key === 'speakerInfo' || key === 'micInfo') {
        window.localStorage.setItem(key, status);
      } else {
        window.localStorage.setItem(key, value);
      }
    },
    []
  );

  const handleMicStatus = (micStatus, micDescription) => {
    const counters = micCounters.current;
    const currentTime = new Date().getMilliseconds();
    const diffTime = Math.abs(currentTime - counters.lastMicTime);

    if (micDescription === 'mic ok') {
      if (parseFloat(micStatus) > counters.maxMicStatus) {
        counters.maxMicStatus = parseFloat(micStatus);
      }
      if (parseFloat(micStatus) > 0) {
        counters.minMicStatus = parseFloat(micStatus);
      }
      if (diffTime > 50 && parseFloat(micStatus) > 0) {
        counters.lastMicTime = currentTime;
        window.localStorage.setItem('micValue', micStatus);
        window.localStorage.setItem('micDescr', micDescription);
        diagnosticsDispatch({ type: 'SET_MIC_VALUE', payload: micStatus });
      }
    }
  };

  const handleSpeakerStatus = (speakerStatus, speakerDescription) => {
    const counters = micCounters.current;
    const currentTime = new Date().getMilliseconds();
    const diffTime = Math.abs(currentTime - counters.lastSpeakerTime);

    if (speakerDescription === 'speaker ok') {
      if (parseFloat(speakerStatus) > counters.maxSpeakerStatus) {
        counters.maxSpeakerStatus = parseFloat(speakerStatus);
      }
      if (parseFloat(speakerStatus) > 0) {
        counters.minSpeakerStatus = parseFloat(speakerStatus);
      }
      if (diffTime > 50 && parseFloat(speakerStatus) > 0) {
        counters.lastSpeakerTime = currentTime;
        window.localStorage.setItem('speakerValue', speakerStatus);
        window.localStorage.setItem('speakerDescr', speakerDescription);
        diagnosticsDispatch({ type: 'SET_SPEAKER_VALUE', payload: speakerStatus });
      }
    }
  };

  const saveDiagnosticsCallback = useCallback((_saveDiagStatus, saveDiagDescription) => {
    window.localStorage.setItem('DiagnosticReport', saveDiagDescription);
  }, []);

  const resetDiagnosticValues = useCallback(() => {
    window.localStorage.setItem('udp', '');
    window.localStorage.setItem('tcp', '');
  }, []);

  const sendDiagnosticsRequest = useCallback(() => {
    updateSipAccountInfo();
    initialiseCallbacks();
    return exWebClient.startNetworkDiagnostics();
  }, [exWebClient, initialiseCallbacks, updateSipAccountInfo]);

  const handleDiagnosticsAsk = useCallback(() => {
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_ASK', payload: true });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_OPS', payload: false });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_DEVICES', payload: false });
    callDispatch({ type: 'SET_OPEN_CONFIG', payload: false });
    exWebClient.initDiagnostics(saveDiagnosticsCallback, keyValueSetCallback);
  }, [callDispatch, diagnosticsDispatch, exWebClient, keyValueSetCallback, saveDiagnosticsCallback]);

  const handleDiagnosticsDevicesStart = useCallback(() => {
    exWebClient.stopSpeakerDiagnosticsTest();
    exWebClient.stopMicDiagnosticsTest();
    micCounters.current = {
      minMicStatus: 0,
      maxMicStatus: 0,
      lastMicTime: 0,
      minSpeakerStatus: 0,
      maxSpeakerStatus: 0,
      lastSpeakerTime: 0,
    };
    window.localStorage.setItem('micValue', 0);
    window.localStorage.setItem('micDescr', '');
    window.localStorage.setItem('speakerValue', 0);
    window.localStorage.setItem('speakerDescr', '');
    exWebClient.startMicDiagnosticsTest();
  }, [exWebClient]);

  const handleDiagnosticsDevices = useCallback(() => {
    resetDiagnosticValues();
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_ASK', payload: false });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_OPS', payload: false });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_DEVICES', payload: true });
    handleDiagnosticsDevicesStart();
  }, [diagnosticsDispatch, handleDiagnosticsDevicesStart, resetDiagnosticValues]);

  const handleDiagnosticsOps = useCallback(() => {
    resetDiagnosticValues();
    sendDiagnosticsRequest();
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_ASK', payload: false });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_DEVICES', payload: false });
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_OPS', payload: true });
  }, [diagnosticsDispatch, resetDiagnosticValues, sendDiagnosticsRequest]);

  const handleDiagnosticsOpsStart = useCallback(() => {
    exWebClient.stopSpeakerDiagnosticsTest();
    exWebClient.stopMicDiagnosticsTest();
    resetDiagnosticValues();
    handleDiagnosticsOps();
  }, [exWebClient, handleDiagnosticsOps, resetDiagnosticValues]);

  const handleDiagnosticsReport = useCallback(() => {
    diagnosticsDispatch({ type: 'SET_OPEN_DIAGNOSTICS_REPORT', payload: true });
  }, [diagnosticsDispatch]);

  const closeAllDiagnostics = useCallback(() => {
    removeDiagnosticsCanvas();
    diagnosticsDispatch({ type: 'CLOSE_ALL_DIAGNOSTICS' });
    window.location.href = window.location.pathname;
    window.localStorage.setItem('speakerValue', 0);
    window.localStorage.setItem('speakerDescr', '');
    exWebClient.stopMicDiagnosticsTest();
    exWebClient.startSpeakerDiagnosticsTest();
  }, [diagnosticsDispatch, exWebClient]);

  const handleDiagnosticsOpsSaveLogs = useCallback(
    (e) => {
      e.preventDefault();
      exWebClient.stopSpeakerDiagnosticsTest();
      exWebClient.stopMicDiagnosticsTest();
      takeScreenShotDirect(diagnosticsNetImageRef.current).then((url) => {
        diagnosticsDispatch({ type: 'SET_IMAGE_URL', payload: url });
        diagnosticsDispatch({ type: 'SET_NET_IMAGE_URL', payload: url });
        hideDiagnosticsCanvas();
      });
      handleDiagnosticsReport();
    },
    [diagnosticsDispatch, diagnosticsNetImageRef, exWebClient, handleDiagnosticsReport]
  );

  const handleDiagnosticsDevicesSaveLogs = useCallback(
    (e) => {
      e.preventDefault();
      exWebClient.stopSpeakerDiagnosticsTest();
      exWebClient.stopMicDiagnosticsTest();
      takeScreenShotDirect(diagnosticsDeviceImageRef.current).then((url) => {
        diagnosticsDispatch({ type: 'SET_IMAGE_URL', payload: url });
        diagnosticsDispatch({ type: 'SET_DEVICE_IMAGE_URL', payload: url });
        hideDiagnosticsCanvas();
      });
      handleDiagnosticsReport();
    },
    [diagnosticsDispatch, diagnosticsDeviceImageRef, exWebClient, handleDiagnosticsReport]
  );

  const handleDiagnosticsReportSend = useCallback(
    async (isScreenCapture) => {
      const troubleShootLogs = window.localStorage.getItem('troubleShootReport') || '';
      diagnosticsDispatch({ type: 'SET_TROUBLESHOOT_REPORT', payload: troubleShootLogs });
      await buildDiagnosticsReportZip({
        troubleShootLogs,
        comments: commentsRef.current?.value,
        diagnosticsNetImageUrl: diagnosticsState.diagnosticsNetImageUrl,
        diagnosticsDeviceImageUrl: diagnosticsState.diagnosticsDeviceImageUrl,
        isScreenCapture,
      });
    },
    [commentsRef, diagnosticsDispatch, diagnosticsState]
  );

  const handleDiagnosticsReportCancel = useCallback(() => {
    removeDiagnosticsCanvas();
    window.location.href = window.location.pathname;
    window.localStorage.setItem('speakerValue', 0);
    window.localStorage.setItem('speakerDescr', '');
    exWebClient.stopMicDiagnosticsTest();
    exWebClient.startSpeakerDiagnosticsTest();
  }, [exWebClient]);

  const handleStopSpeakerTestSuccess = useCallback(() => {
    exWebClient.stopSpeakerDiagnosticsTest('yes');
    diagnosticsDispatch({ type: 'SET_SPEAKER_RESPONSE', payload: 'Yes' });
    takeScreenShotDirect(diagnosticsDeviceImageRef.current).then((url) => {
      diagnosticsDispatch({ type: 'SET_DEVICE_IMAGE_URL', payload: url });
      hideDiagnosticsCanvas();
    });
    handleDiagnosticsOpsStart();
  }, [diagnosticsDeviceImageRef, diagnosticsDispatch, exWebClient, handleDiagnosticsOpsStart]);

  const handleStopSpeakerTestFailure = useCallback(() => {
    exWebClient.stopSpeakerDiagnosticsTest('no');
    diagnosticsDispatch({ type: 'SET_SPEAKER_RESPONSE', payload: 'No' });
    handleDiagnosticsOpsStart();
  }, [diagnosticsDispatch, exWebClient, handleDiagnosticsOpsStart]);

  const handleStopMicTestSuccess = useCallback(() => {
    exWebClient.stopMicDiagnosticsTest('yes');
    exWebClient.startSpeakerDiagnosticsTest();
    diagnosticsDispatch({ type: 'SET_MIC_RESPONSE', payload: 'Yes' });
  }, [diagnosticsDispatch, exWebClient]);

  const handleStopMicTestFailure = useCallback(() => {
    exWebClient.stopMicDiagnosticsTest('no');
    exWebClient.startSpeakerDiagnosticsTest();
    diagnosticsDispatch({ type: 'SET_MIC_RESPONSE', payload: 'No' });
  }, [diagnosticsDispatch, exWebClient]);

  const handleRestartSpeaker = useCallback(() => {
    exWebClient.stopSpeakerDiagnosticsTest();
    exWebClient.startSpeakerDiagnosticsTest();
  }, [exWebClient]);

  const handleRestartMic = useCallback(() => {
    exWebClient.stopMicDiagnosticsTest();
    exWebClient.startMicDiagnosticsTest();
  }, [exWebClient]);

  return {
    diagnosticsState,
    diagnosticsNetImageRef,
    diagnosticsDeviceImageRef,
    imageRef,
    commentsRef,
    handleDiagnosticsAsk,
    handleDiagnosticsOps,
    handleDiagnosticsDevices,
    handleDiagnosticsOpsStart,
    handleDiagnosticsDevicesStart,
    handleDiagnosticsReport,
    closeAllDiagnostics,
    handleDiagnosticsOpsSaveLogs,
    handleDiagnosticsDevicesSaveLogs,
    handleDiagnosticsReportSend,
    handleDiagnosticsReportCancel,
    handleStopSpeakerTestSuccess,
    handleStopSpeakerTestFailure,
    handleStopMicTestSuccess,
    handleStopMicTestFailure,
    handleRestartSpeaker,
    handleRestartMic,
  };
}
