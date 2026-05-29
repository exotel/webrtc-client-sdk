import React, { useEffect } from 'react';
import {
  TextField,
  Grid,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Divider,
} from '@material-ui/core';
import { styles } from './styles';
import { useAuthContext } from '../../reducer/AuthContext';
import { DEFAULT_AUDIO_CONFIG } from '@exotel/webrtc-shared';

function ConfigContent({ value }) {
  const [sipUser, setSipUser] = React.useState(value + 1);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [domain, setDomain] = React.useState('');
  const [accountSID, setAccountSid] = React.useState('');
  const [hostname, setHostname] = React.useState('');
  const [callTimeout, setCallTimeout] = React.useState('');
  const [noiseSuppression, setNoiseSuppression] = React.useState(
    DEFAULT_AUDIO_CONFIG.audioProcessing.noiseSuppression
  );
  const [echoCancellation, setEchoCancellation] = React.useState(
    DEFAULT_AUDIO_CONFIG.audioProcessing.echoCancellation
  );
  const [autoGainControl, setAutoGainControl] = React.useState(
    DEFAULT_AUDIO_CONFIG.audioProcessing.autoGainControl
  );
  const [autoAudioDeviceChange, setAutoAudioDeviceChange] = React.useState(
    DEFAULT_AUDIO_CONFIG.autoAudioDeviceChange
  );
  const [preferredCodec, setPreferredCodec] = React.useState(DEFAULT_AUDIO_CONFIG.preferredCodec);
  const [customDspMode, setCustomDspMode] = React.useState(DEFAULT_AUDIO_CONFIG.customAudioProcessing.mode);
  const { userState, dispatch } = useAuthContext();
  const [disabled, setDisabled] = React.useState(false);

  const classes = styles();

  const loadAudioFields = (accountDetails) => {
    const entry = accountDetails[value] || {};
    const audio = entry.audioProcessing || DEFAULT_AUDIO_CONFIG.audioProcessing;
    setNoiseSuppression(Boolean(audio.noiseSuppression));
    setEchoCancellation(audio.echoCancellation !== false);
    setAutoGainControl(audio.autoGainControl !== false);
    setAutoAudioDeviceChange(Boolean(entry.autoAudioDeviceChange));
    setPreferredCodec(entry.preferredCodec || '');
    setCustomDspMode(entry.customAudioProcessing?.mode || 'off');
  };

  useEffect(() => {
    const account = window.localStorage.getItem('configObj');
    if (userState.configObj.length !== 0 && userState.configObj !== undefined) {
      const accountDetails = JSON.parse(account);
      setUsername(accountDetails[value].Username);
      setPassword(accountDetails[value].Password);
      setDomain(accountDetails[value].Domain);
      setAccountSid(accountDetails[value].AccountSID);
      setHostname(accountDetails[value].HostServer + ':' + accountDetails[value].Port);
      setCallTimeout(accountDetails[value].CallTimeout);
      loadAudioFields(accountDetails);
    }
    initUsername();
  }, []);

  const initUsername = () => {
    const phoneObj = JSON.parse(window.localStorage.getItem('phoneData'));
    if (phoneObj !== null && phoneObj !== undefined) {
      setUsername(phoneObj.username);
      setPassword(phoneObj.password);
      setHostname(phoneObj.proxy);
      setDomain(phoneObj.proxy);
      setDisabled(true);
    }
  };

  const handleInputChange = (event) => {
    switch (event.target.name) {
      case 'Username':
        setUsername(event.currentTarget.value);
        break;
      case 'Password':
        setPassword(event.currentTarget.value);
        break;
      case 'Domain':
        setDomain(event.currentTarget.value);
        break;
      case 'AccountSID':
        setAccountSid(event.currentTarget.value);
        break;
      case 'HostServer':
        setHostname(event.currentTarget.value);
        break;
      case 'CallTimeout':
        setCallTimeout(event.currentTarget.value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const port = hostname.split(':');
    const configData = {
      Username: username,
      DisplayName: username,
      HostServer: port[0],
      Domain: domain,
      Port: port[1],
      Password: password,
      CallTimeout: callTimeout || 1000,
      Security: 'wss',
      AccountSID: accountSID,
      AccountNo: username,
      audioProcessing: {
        noiseSuppression,
        echoCancellation,
        autoGainControl,
      },
      autoAudioDeviceChange,
      customAudioProcessing: {
        enabled: customDspMode !== 'off',
        mode: customDspMode,
      },
    };
    if (preferredCodec) {
      configData.preferredCodec = preferredCodec;
    }
    const data = {
      configData,
      index: value,
    };
    dispatch({ type: 'CONFIGURATION_MODIFIED', payload: JSON.stringify(data) });
    window.location.href = window.location.pathname;
  };

  return (
    <div>
      <Grid container alignItems="center" justifyContent="center" direction="column">
        <Typography className={classes.header}> Configuration of Account {sipUser}</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="Username"
            required
            variant="outlined"
            value={username}
            onChange={handleInputChange}
            className={classes.textField}
            disabled={disabled}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
            InputLabelProps={{ className: classes.floatingLabelFocusStyle }}
          />
          <TextField
            label="Password"
            name="Password"
            required
            variant="outlined"
            value={password}
            onChange={handleInputChange}
            type="password"
            className={classes.textField}
            disabled={disabled}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
          />
          <TextField
            label="Domain"
            name="Domain"
            required
            variant="outlined"
            value={domain}
            onChange={handleInputChange}
            focused
            className={classes.textField}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
          />
          <TextField
            label="AccountSID"
            name="AccountSID"
            required
            variant="outlined"
            value={accountSID}
            onChange={handleInputChange}
            focused
            className={classes.textField}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
          />
          <TextField
            label="Host Server:Port"
            name="HostServer"
            required
            variant="outlined"
            value={hostname}
            onChange={handleInputChange}
            focused
            className={classes.textField}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
          />
          <TextField
            label="Call Timeout"
            name="CallTimeout"
            required
            variant="outlined"
            value={callTimeout}
            onChange={handleInputChange}
            focused
            className={classes.textField}
            InputProps={{
              className: classes.input,
              classes: { notchedOutline: classes.input },
            }}
          />

          <Divider style={{ margin: '16px 0', width: '100%' }} />
          <Typography className={classes.header} style={{ fontSize: 14 }}>
            Audio quality (optional)
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
                color="primary"
              />
            }
            label="Noise suppression"
          />
          <FormControlLabel
            control={
              <Switch
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
                color="primary"
              />
            }
            label="Echo cancellation"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
                color="primary"
              />
            }
            label="Auto gain control"
          />
          <FormControlLabel
            control={
              <Switch
                checked={autoAudioDeviceChange}
                onChange={(e) => setAutoAudioDeviceChange(e.target.checked)}
                color="primary"
              />
            }
            label="Auto switch mic/speaker on plug/unplug"
          />

          <FormControl variant="outlined" className={classes.textField} fullWidth style={{ marginTop: 8 }}>
            <InputLabel id="codec-select-label">Preferred codec</InputLabel>
            <Select
              labelId="codec-select-label"
              value={preferredCodec}
              onChange={(e) => setPreferredCodec(e.target.value)}
              label="Preferred codec"
            >
              <MenuItem value="">Default (no preference)</MenuItem>
              <MenuItem value="opus">Opus</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" className={classes.textField} fullWidth style={{ marginTop: 8 }}>
            <InputLabel id="dsp-select-label">Custom DSP</InputLabel>
            <Select
              labelId="dsp-select-label"
              value={customDspMode}
              onChange={(e) => setCustomDspMode(e.target.value)}
              label="Custom DSP"
            >
              <MenuItem value="off">Off</MenuItem>
              <MenuItem value="light">Light (high-pass + compressor)</MenuItem>
              <MenuItem value="rnnoise">RNNoise pilot (worklet)</MenuItem>
            </Select>
          </FormControl>
        </form>
        <Grid item xs={12} lg={6} sm={4}>
          <Grid container direction="row">
            <Button className={classes.button} onClick={handleSubmit}>
              Save
            </Button>
            <Button className={classes.button}>Reset</Button>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}

export default ConfigContent;
