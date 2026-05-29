import React from 'react';
import Draggable from 'react-draggable';
import { Snackbar, SnackbarContent } from '@material-ui/core';
import ModalView from '../ModalComponent/ModalView';
import DialPad from '../DialerComponent/DialPad';

export default function CallSnackbars({
  openDialer,
  callDialer,
  callObj,
  callerState,
  client,
  call,
  onDialerClose,
  onCall,
  onCallDialerClose,
}) {
  return (
    <>
      <Draggable component="span">
        <Snackbar open={openDialer} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <SnackbarContent
            style={{ backgroundColor: '#BDBDBD', marginBottom: 30 }}
            action={
              <ModalView
                onDialerClose={onDialerClose}
                onCall={onCall}
                callObj={callObj}
                call={call}
                client={client}
              />
            }
          />
        </Snackbar>
      </Draggable>
      <Draggable component="span">
        <Snackbar open={callDialer} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <SnackbarContent
            style={{ backgroundColor: '#616161', marginBottom: 30 }}
            action={
              <DialPad
                onCallDialerClose={onCallDialerClose}
                callObj={callObj}
                callerState={callerState}
                call={call}
                client={client}
              />
            }
          />
        </Snackbar>
      </Draggable>
    </>
  );
}
