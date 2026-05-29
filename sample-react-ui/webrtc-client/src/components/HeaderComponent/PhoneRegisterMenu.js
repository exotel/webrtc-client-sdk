import React from 'react';
import { Grid, Typography, Menu, Card, Button, Switch } from '@material-ui/core';
import { withStyles } from '@material-ui/core';
import { styles } from './AppBarStyle';
import AudioDeviceMenu from './AudioDeviceMenu';
import axios from 'axios';

const MySwitch = withStyles({
  switchBase: {
    color: 'white',
    opacity: 0.8,
    '&$checked': { color: 'white', opacity: 1 },
    '&$checked + $track': { backgroundColor: 'green', opacity: 1 },
    '&.MuiSwitch-colorSecondary.Mui-disabled + .MuiSwitch-track': { backgroundColor: 'black' },
  },
  checked: {},
  track: {},
})(Switch);

const myapiKey = '73939b66be5f60af65dd06394cb8c25ae3f6f662a5827622';
const myapitoken = 'b24e0268db4cd021c69f18acd5cab322da20400912d167c5';
const mysubdomain = 'api.us3.qaexotel.com';
const mysid = 'ccplexopoc1m';
const myUrl = `https://${mysubdomain}/v1/Accounts/${mysid}/Calls/connect/`;

function OutgoingCallControls({ outgoingNumber, onOutgoingChange }) {
  const outgoingEnabled = window.localStorage.getItem('outgoingEnabled');
  if (outgoingEnabled === 'false' || !outgoingEnabled) {
    return null;
  }
  return (
    <div>
      <input
        id="ocallNumber"
        name="ocallNumber"
        type="text"
        value={outgoingNumber}
        onChange={onOutgoingChange}
      />
      <Button id="ocallBtn1" onClick={() => makeCall(outgoingNumber)}>
        Fetch Call
      </Button>
      &nbsp;
      <Button id="ocallBtn2" onClick={() => makeCallAxios(outgoingNumber)}>
        Axios Call
      </Button>
    </div>
  );
}

function makeCall(outgoingNumber) {
  alert(`Fetch Call to ${outgoingNumber}`);
  const formJson = {
    Url: `http://my.exotel.com/${mysid}/exoml/start_voice/3515`,
    To: outgoingNumber,
    CallerId: '08037071600',
  };
  fetch(myUrl, {
    method: 'POST',
    credentials: 'include',
    referrerPolicy: 'same-origin',
    headers: {
      Authorization: `Basic ${btoa(`${myapiKey}:${myapitoken}`)}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(formJson),
  })
    .then((response) => response.json())
    .then((result) => console.log('Success:', result))
    .catch((error) => console.error('Error:', error));
}

function makeCallAxios(outgoingNumber) {
  alert(`Axios Call to ${outgoingNumber}`);
  const formJson = {
    Url: `http://my.exotel.com/${mysid}/exoml/start_voice/3515`,
    To: outgoingNumber,
    CallerId: '08037071600',
  };
  axios
    .post(myUrl, formJson, {
      headers: {
        Authorization: `Basic ${btoa(`${myapiKey}:${myapitoken}`)}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .then((response) => response.json())
    .then((result) => console.log('Success:', result))
    .catch((error) => console.error('Error:', error));
}

function RegisterSwitchRow({ checked, disabled, label, phoneName, onRegister }) {
  const classes = styles();
  return (
    <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start">
      <MySwitch value={phoneName} checked={checked} disabled={disabled} color="secondary" onChange={onRegister} />
      <Typography className={classes.options} style={{ marginLeft: 10, color: disabled ? 'gray' : '#2194FF' }}>
        {label}
      </Typography>
    </Grid>
  );
}

export default function PhoneRegisterMenu({
  isPhoneLogin,
  anchorPhoneLoginEl,
  phoneName,
  userState,
  outgoingNumber,
  exWebClient,
  onPhoneLoginClose,
  onRegister,
  onOutgoingChange,
}) {
  const classes = styles();
  const registeredUsers = JSON.parse(window.localStorage.getItem('registeredUsers') || '[]');
  const isRegistered = registeredUsers.some((val) => val.phoneName === phoneName);
  const hasRegisteredUsers = userState.userObj !== undefined && userState.userObj.length !== 0;

  let registerRow;
  if (hasRegisteredUsers) {
    registerRow = (
      <>
        <RegisterSwitchRow
          checked={isRegistered}
          label={isRegistered ? 'Unregister' : 'Register'}
          phoneName={phoneName}
          onRegister={onRegister}
        />
        <OutgoingCallControls outgoingNumber={outgoingNumber} onOutgoingChange={onOutgoingChange} />
      </>
    );
  } else {
    registerRow = (
      <RegisterSwitchRow
        checked={false}
        disabled={userState.configObj.length === 0}
        label="Register"
        phoneName={phoneName}
        onRegister={onRegister}
      />
    );
  }

  return (
    <Menu
      anchorEl={anchorPhoneLoginEl}
      keepMounted={false}
      transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      className={classes.menu}
      open={isPhoneLogin}
      onClose={onPhoneLoginClose}
      classes={{ paper: phoneName === '' ? null : classes.menuPaper }}
      style={{ marginTop: 60 }}
    >
      <Card elevation={0} className={classes.navBarCard}>
        {registerRow}
        {exWebClient && <AudioDeviceMenu exWebClient={exWebClient} />}
      </Card>
    </Menu>
  );
}
