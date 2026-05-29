import React, { useEffect } from 'react';
import { Grid, Typography } from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import { Call } from '@material-ui/icons';
import { withWebRtcClient } from '../../hocs/withWebRtcClient';
import { withBroadcastChannel } from '../../hocs/withBroadcastChannel';
import './ModalStyle.css';

function ModalView({
  onDialerClose,
  onCall,
  callObj,
  call,
  client,
  exWebClient,
  channel,
}) {
  const handleDialer = () => {
    onDialerClose();
    onCall(true);
    const activeCall = call || exWebClient.getCall();
    if (activeCall) {
      activeCall.Answer();
    }
  };

  const rejectCall = () => {
    const activeCall = call || exWebClient.getCall();
    if (activeCall) {
      activeCall.Hangup();
    }
    onDialerClose();
  };

  useEffect(() => {
    channel.onmessage = (ev) => {
      if (ev.data === 'accept' && window.sessionStorage.getItem('activeSessionTab') === 'parent0') {
        handleDialer();
      } else if (ev.data === 'reject' && window.sessionStorage.getItem('activeSessionTab') === 'parent0') {
        rejectCall();
      }
    };
  }, []);

  return (
    <Grid container alignItems="flex-start" justifyContent="flex-start" direction="column">
      <p className="p-dialer">{client}</p>
      <Grid container alignItems="flex-start" justifyContent="flex-start" direction="row">
        <p className="p-message">Incoming call from </p>
        <p className="p-call-msg">{callObj?.remoteDisplayName}</p>
      </Grid>
      <Grid container alignItems="flex-start" justifyContent="flex-start" direction="row">
        <button type="button" className="go-to-receiver" onClick={handleDialer}>
          <Grid container direction="row">
            <Call style={{ marginTop: 4, color: 'green' }} />
            <Typography style={{ fontSize: 13, margin: 8 }}>Accept</Typography>
          </Grid>
        </button>
        <button type="button" className="go-to-receiver" onClick={rejectCall}>
          <Grid container direction="row">
            <Cancel style={{ marginTop: 4, fontSize: 25, fontWeight: 'bold', color: '#E57373' }} />
            <Typography style={{ fontSize: 13, margin: 8 }}>Reject</Typography>
          </Grid>
        </button>
      </Grid>
    </Grid>
  );
}

export default withBroadcastChannel(withWebRtcClient(ModalView));
