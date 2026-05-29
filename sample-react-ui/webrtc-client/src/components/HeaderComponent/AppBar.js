import React, { useCallback } from 'react';
import { Button } from '@material-ui/core';
import data from '../../phone.json';
import { useAuthContext } from '../../reducer/AuthContext';
import { useCallContext } from '../../context/CallContext';
import { useBroadcastChannel } from '../../context/BroadcastChannelContext';
import { useCallSession } from '../../hooks/useCallSession';
import { useSipClient } from '../../hooks/useSipClient';
import { useDiagnosticsFlow } from '../../hooks/useDiagnosticsFlow';
import { useTabManager } from '../../hooks/useTabManager';
import { getConfigArray } from '../../utils/localStorageHelpers';
import { styles } from './AppBarStyle';
import PhoneToolbar from './PhoneToolbar';
import PhoneRegisterMenu from './PhoneRegisterMenu';
import CallSnackbars from './CallSnackbars';
import IncomingCallSnackbar from './IncomingCallSnackbar';
import LoginView from '../LoginComponent/LoginView';
import ConfigPopup from '../SettingsComponent/ConfigPopup';
import DiagnosticsAskPopup from '../DiagnosticsComponent/DiagnosticsAskPopup';
import DiagnosticsView from '../DiagnosticsComponent/DiagnosticsView';
import DiagnosticsDevices from '../DiagnosticsComponent/DiagnosticsDevices';
import DiagnosticsReport from '../DiagnosticsComponent/DiagnosticsReport';

export default function PrimaryPhoneAppBar() {
  const classes = styles();
  const { userState } = useAuthContext();
  const { callState } = useCallContext();
  const { postMessage } = useBroadcastChannel();
  const configArray = getConfigArray();

  const sipRef = React.useRef({});

  const callSession = useCallSession({
    sendAutoRegistration: (...args) => sipRef.current.sendAutoRegistration?.(...args),
  });

  const sip = useSipClient({
    callListenerCallback: callSession.callListenerCallback,
    sessionCallback: callSession.sessionCallback,
  });
  sipRef.current = sip;

  useTabManager({ sendAutoRegistration: sip.sendAutoRegistration });

  const diagnostics = useDiagnosticsFlow({
    initialiseCallbacks: sip.initialiseCallbacks,
    updateSipAccountInfo: sip.updateSipAccountInfo,
    sipAccountInfoRef: sip.sipAccountInfoRef,
  });

  const handlePhoneLogin = useCallback(
    (event) => {
      callSession.handlePhoneLogin(event);
      sip.sendAutoRegistration(event.currentTarget.name);
    },
    [callSession, sip]
  );

  const handleLogout = useCallback(() => {
    sip.handleLogout(postMessage);
  }, [sip, postMessage]);

  return (
    <div className={classes.grow}>
      {userState.user !== null ? (
        <PhoneToolbar
          userState={userState}
          phoneData={data}
          configArray={configArray}
          onPhoneLogin={handlePhoneLogin}
          onConfig={callSession.handleConfig}
          onDiagnosticsAsk={diagnostics.handleDiagnosticsAsk}
          onLogout={handleLogout}
        />
      ) : (
        <Button aria-label="login-button" color="inherit" className={classes.button} onClick={callSession.handleLogin}>
          Dialer Login
        </Button>
      )}

      {callState.openLogin && (
        <div ref={diagnostics.imageRef}>
          <LoginView handleLogin={callSession.handleLogin} />
        </div>
      )}

      {callState.isPhoneLogin && (
        <PhoneRegisterMenu
          isPhoneLogin={callState.isPhoneLogin}
          anchorPhoneLoginEl={callState.anchorPhoneLoginEl}
          phoneName={callState.phoneName}
          userState={userState}
          outgoingNumber={callState.outgoingNumber}
          exWebClient={sip.exWebClient}
          onPhoneLoginClose={callSession.handlePhoneLoginClose}
          onRegister={sip.handleRegister}
          onOutgoingChange={callSession.setOutgoingNumber}
        />
      )}

      {callState.openConfig && (
        <div ref={diagnostics.imageRef}>
          <ConfigPopup />
        </div>
      )}

      {diagnostics.diagnosticsState.openDiagnosticsAsk && (
        <div ref={diagnostics.imageRef}>
          <DiagnosticsAskPopup
            handleDiagnosticsAskSubmit={diagnostics.handleDiagnosticsDevices}
            handleDiagnosticsAskClose={diagnostics.closeAllDiagnostics}
          />
        </div>
      )}

      {diagnostics.diagnosticsState.openDiagnosticsOps && (
        <div ref={diagnostics.imageRef}>
          <DiagnosticsView
            diagnosticsNetImageRef={diagnostics.diagnosticsNetImageRef}
            handleDiagnosticsOpsBack={diagnostics.handleDiagnosticsDevices}
            handleDiagnosticsOpsRetest={diagnostics.handleDiagnosticsOpsStart}
            handleDiagnosticsOpsSaveLogs={diagnostics.handleDiagnosticsOpsSaveLogs}
          />
        </div>
      )}

      {diagnostics.diagnosticsState.openDiagnosticsDevices && (
        <div ref={diagnostics.imageRef}>
          <DiagnosticsDevices
            diagnosticsDeviceImageRef={diagnostics.diagnosticsDeviceImageRef}
            micValue={diagnostics.diagnosticsState.micValue}
            speakerValue={diagnostics.diagnosticsState.speakerValue}
            micUserResponse={diagnostics.diagnosticsState.micUserResponse}
            speakerUserResponse={diagnostics.diagnosticsState.speakerResponse}
            handleDiagnosticsDevicesSkip={diagnostics.handleDiagnosticsOpsStart}
            handleDiagnosticsDevicesRetest={diagnostics.handleDiagnosticsDevicesStart}
            handleDiagnosticsDevicesSaveLogs={diagnostics.handleDiagnosticsDevicesSaveLogs}
            handleStopSpeakerTestSuccess={diagnostics.handleStopSpeakerTestSuccess}
            handleStopSpeakerTestFailure={diagnostics.handleStopSpeakerTestFailure}
            handleStopMicTestSuccess={diagnostics.handleStopMicTestSuccess}
            handleStopMicTestFailure={diagnostics.handleStopMicTestFailure}
            handleRestartSpeaker={diagnostics.handleRestartSpeaker}
            handleRestartMic={diagnostics.handleRestartMic}
          />
        </div>
      )}

      {diagnostics.diagnosticsState.openDiagnosticsReport && (
        <div ref={diagnostics.imageRef}>
          <DiagnosticsReport
            imageUrl={diagnostics.diagnosticsState.imageUrl}
            commentsRef={diagnostics.commentsRef}
            troubleShootReport={diagnostics.diagnosticsState.troubleShootReport}
            handleDiagnosticsReportCancel={diagnostics.handleDiagnosticsReportCancel}
            handleDiagnosticsReportSend={diagnostics.handleDiagnosticsReportSend}
          />
        </div>
      )}

      <CallSnackbars
        openDialer={callState.openDialer}
        callDialer={callState.callDialer}
        callObj={callState.callObj}
        callerState={callState.callerState}
        client={callState.client}
        call={sip.callRef.current}
        onDialerClose={callSession.handleDialerClose}
        onCall={callSession.handleCall}
        onCallDialerClose={callSession.handleCallDialerClose}
      />

      <IncomingCallSnackbar
        open={callState.openIncomingNotification}
        callMessage={callState.callMessage}
        postMessage={postMessage}
      />
    </div>
  );
}
