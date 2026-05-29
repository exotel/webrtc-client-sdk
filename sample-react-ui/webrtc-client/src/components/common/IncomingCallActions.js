import React from 'react';
import { Grid, Typography, Button } from '@material-ui/core';
import { Cancel, Call as CallIcon } from '@material-ui/icons';
import { sessionCallback } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/Callback';

export default function IncomingCallActions({ postMessage, variant = 'snackbar' }) {
  const acceptStyle =
    variant === 'snackbar'
      ? { background: 'white', color: '#E57373', textTransform: 'none', margin: 10 }
      : undefined;
  const rejectStyle =
    variant === 'snackbar' ? { background: 'white', color: '#E57373', textTransform: 'none' } : undefined;

  return (
    <div>
      <Button
        style={acceptStyle}
        className={variant === 'modal' ? 'go-to-receiver' : undefined}
        onClick={() => postMessage('accept')}
      >
        <Grid container direction="row">
          <CallIcon style={{ marginTop: 4, color: 'green' }} />
          <Typography style={{ fontSize: 13, margin: 8 }}>Accept</Typography>
        </Grid>
      </Button>
      <Button
        style={rejectStyle}
        className={variant === 'modal' ? 'go-to-receiver' : undefined}
        onClick={() => {
          postMessage('reject');
          sessionCallback.initializeSession('callEnded', '');
          sessionCallback.triggerSessionCallback();
        }}
      >
        <Grid container direction="row">
          <Cancel style={{ marginTop: 4, fontSize: 25, fontWeight: 'bold', color: '#E57373' }} />
          <Typography style={{ fontSize: 13, margin: 8 }}>Reject</Typography>
        </Grid>
      </Button>
    </div>
  );
}
