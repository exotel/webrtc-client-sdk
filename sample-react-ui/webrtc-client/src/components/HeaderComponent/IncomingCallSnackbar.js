import React from 'react';
import { Snackbar, SnackbarContent } from '@material-ui/core';
import IncomingCallActions from '../common/IncomingCallActions';

export default function IncomingCallSnackbar({ open, callMessage, postMessage }) {
  return (
    <Snackbar open={open} autoHideDuration={6000}>
      <SnackbarContent
        style={{ backgroundColor: '#E57373', marginBottom: 30, color: 'white' }}
        message={callMessage}
        action={<IncomingCallActions postMessage={postMessage} variant="snackbar" />}
      />
    </Snackbar>
  );
}
