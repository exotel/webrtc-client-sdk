import React, { useEffect } from 'react';
import { useStopwatch } from 'react-timer-hook';
import { IconButton } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { MicOff, Pause, PlayArrow, CallEnd, Mic } from '@material-ui/icons';
import Typography from '@material-ui/core/Typography';
import { timerSession } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/Callback';
import { withWebRtcClient } from '../../hocs/withWebRtcClient';
import { styles } from './styles';

function DialPad({
  onCallDialerClose,
  callObj,
  callerState,
  call,
  client,
  exWebClient,
}) {
  const classes = styles();
  const [callState, setCallState] = React.useState({
    connected: true,
    disconnected: true,
    hold: false,
  });
  const [callHold, setCallHold] = React.useState(false);
  const [callNumber, setCallNumber] = React.useState('');
  const [offset, setOffset] = React.useState(0);
  const [mute, setMute] = React.useState(false);
  const stopwatchOffset = new Date();
  stopwatchOffset.setSeconds(stopwatchOffset.getSeconds() + parseInt(offset, 10));
  const { seconds, minutes, hours, start, reset } = useStopwatch({
    autoStart: false,
    offsetTimestamp: stopwatchOffset > new Date() ? stopwatchOffset : null,
  });

  const formatTime = (time) => String(time).padStart(2, '0');

  const handleDisconnect = () => {
    setCallState({ connected: true, disconnected: true, hold: false });
    setCallNumber('');
    setCallHold(false);
    window.localStorage.removeItem('callTimer');
    window.localStorage.setItem('CALL_FLUSH', Date.now().toString());
    window.localStorage.removeItem('CALL_FLUSH');
    window.localStorage.removeItem('callDetails');
    window.localStorage.removeItem('currentState');
    reset();
  };

  useEffect(() => {
    switch (callerState) {
      case 'incoming':
        setCallState({ connected: false, disconnected: true, hold: false });
        setCallNumber(callObj?.remoteDisplayName);
        break;
      case 'terminated':
        handleDisconnect();
        onCallDialerClose();
        break;
      case 'connected':
        setCallNumber(callObj?.remoteDisplayName);
        setCallState({ connected: true, disconnected: false, hold: true });
        window.localStorage.setItem('currentState', 'accepted');
        start();
        break;
      case 'activeSession':
        setCallNumber(callObj?.remoteDisplayName);
        setCallState({ connected: true, disconnected: false, hold: true });
        if (
          window.localStorage.getItem('callTimer') !== null &&
          window.localStorage.getItem('callTimer') !== '0:0:0'
        ) {
          const hms = window.localStorage.getItem('callTimer');
          const parts = hms.split(':');
          const second = +parts[0] * 60 * 60 + +parts[1] * 60 + +parts[2];
          setOffset(second);
          start();
        }
        break;
      default:
        break;
    }
  }, [callerState]);

  const getActiveCall = () => call || exWebClient.getCall();

  const handleCallDisconnect = () => {
    const activeCall = getActiveCall();
    if (activeCall) {
      activeCall.Hangup();
    }
    handleDisconnect();
  };

  const handleMute = () => {
    const activeCall = getActiveCall();
    if (activeCall) {
      activeCall.MuteToggle();
    }
    setMute(!mute);
  };

  const handleHold = () => {
    setCallHold(!callHold);
    const activeCall = getActiveCall();
    if (activeCall) {
      activeCall.HoldToggle();
    }
  };

  return (
    <div>
      <Grid container alignItems="flex-start" justifyContent="flex-start">
        <Typography component="span" style={{ fontSize: 13 }}>
          Incoming call to {client}
        </Typography>
      </Grid>
      <Grid container alignItems="center" justifyContent="center" direction="column">
        {callNumber === '' ? (
          <p className="p-call-status">Currently no active calls</p>
        ) : (
          <Grid container direction="column" justifyContent="center" alignItems="center">
            {(() => {
              let callTimer = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
              if (
                !('callDetails' in window.localStorage) &&
                window.localStorage.getItem('currentState') === 'accepted'
              ) {
                window.localStorage.setItem('callDetails', JSON.stringify(callObj));
              } else {
                timerSession.setCallTimer(callTimer);
                callTimer = timerSession.getTimer();
              }
              return (
                <>
                  <Typography component="span" className="p-call-status" style={{ fontSize: 17, margin: 10 }}>
                    {callNumber}
                  </Typography>
                  <Typography component="span" className="p-call-status">
                    {callTimer}
                  </Typography>
                </>
              );
            })()}
          </Grid>
        )}
        {callHold ? (
          <p className="p-call-status">Call on hold</p>
        ) : (
          <p className="p-call-status">&nbsp;&nbsp;</p>
        )}
      </Grid>
      <Grid container alignItems="center" direction="row" justifyContent="center">
        <IconButton
          className={classes.iconbutton}
          disabled={false}
          style={{ backgroundColor: '#A9A9A9' }}
          onClick={handleMute}
        >
          {mute ? <MicOff style={{ color: 'red' }} /> : <Mic style={{ color: 'red' }} />}
        </IconButton>
        <IconButton
          className={classes.iconbutton}
          style={{ backgroundColor: callHold ? '#1B5E20' : 'rgb(207, 184, 55)' }}
          onClick={handleHold}
        >
          {!callHold ? <Pause style={{ color: 'white' }} /> : <PlayArrow style={{ color: 'white' }} />}
        </IconButton>
        <IconButton
          disabled={callState.disconnected}
          className={classes.iconbutton}
          style={{ backgroundColor: callState.disconnected ? '#A9A9A9' : 'rgb(180, 61, 61)' }}
          onClick={handleCallDisconnect}
        >
          <CallEnd style={{ color: 'white' }} />
        </IconButton>
      </Grid>
    </div>
  );
}

export default withWebRtcClient(DialPad);
