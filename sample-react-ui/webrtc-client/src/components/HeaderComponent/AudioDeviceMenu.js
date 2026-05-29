import { useCallback, useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@material-ui/core';

export function useAudioDevices(exWebClient) {
  const [inputDevices, setInputDevices] = useState([]);
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('default');
  const [selectedOutputId, setSelectedOutputId] = useState('default');

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter((d) => d.kind === 'audioinput'));
      setOutputDevices(devices.filter((d) => d.kind === 'audiooutput'));
    } catch (error) {
      console.warn('enumerateDevices failed', error);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
    return undefined;
  }, [refreshDevices]);

  useEffect(() => {
    if (!exWebClient?.registerAudioDeviceChangeCallback) {
      return undefined;
    }
    exWebClient.registerAudioDeviceChangeCallback(
      (deviceId) => setSelectedInputId(deviceId || 'default'),
      (deviceId) => setSelectedOutputId(deviceId || 'default'),
      () => refreshDevices()
    );
    return undefined;
  }, [exWebClient, refreshDevices]);

  const changeInputDevice = useCallback(
    (deviceId) => {
      if (!exWebClient?.changeAudioInputDevice) {
        return;
      }
      exWebClient.changeAudioInputDevice(
        deviceId,
        () => setSelectedInputId(deviceId),
        (err) => console.warn('changeAudioInputDevice failed', err),
        true
      );
    },
    [exWebClient]
  );

  const changeOutputDevice = useCallback(
    (deviceId) => {
      if (!exWebClient?.changeAudioOutputDevice) {
        return;
      }
      exWebClient.changeAudioOutputDevice(
        deviceId,
        () => setSelectedOutputId(deviceId),
        (err) => console.warn('changeAudioOutputDevice failed', err),
        true
      );
    },
    [exWebClient]
  );

  return {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    changeInputDevice,
    changeOutputDevice,
    refreshDevices,
  };
}

export default function AudioDeviceMenu({ exWebClient }) {
  const {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    changeInputDevice,
    changeOutputDevice,
  } = useAudioDevices(exWebClient);

  if (!exWebClient) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220, padding: 8 }}>
      <Typography variant="caption" style={{ color: '#2194FF' }}>
        Audio devices
      </Typography>
      <FormControl variant="outlined" size="small" fullWidth>
        <InputLabel id="mic-select-label">Microphone</InputLabel>
        <Select
          labelId="mic-select-label"
          value={selectedInputId}
          onChange={(e) => changeInputDevice(e.target.value)}
          label="Microphone"
        >
          <MenuItem value="default">System default</MenuItem>
          {inputDevices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${device.deviceId.slice(0, 6)}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl variant="outlined" size="small" fullWidth>
        <InputLabel id="speaker-select-label">Speaker</InputLabel>
        <Select
          labelId="speaker-select-label"
          value={selectedOutputId}
          onChange={(e) => changeOutputDevice(e.target.value)}
          label="Speaker"
        >
          <MenuItem value="default">System default</MenuItem>
          {outputDevices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${device.deviceId.slice(0, 6)}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
