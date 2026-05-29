import React from 'react';
import { Grid, IconButton, Typography, Button } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import DiagnosticsIcon from '@material-ui/icons/Build';
import PhoneIcon from '@material-ui/icons/Person';
import { uuid } from 'uuidv4';
import { styles } from './AppBarStyle';
import { isFlagSet } from '../../utils/localStorageHelpers';

export default function PhoneToolbar({
  userState,
  phoneData,
  configArray,
  onPhoneLogin,
  onConfig,
  onDiagnosticsAsk,
  onLogout,
}) {
  const classes = styles();
  const hideUsers = isFlagSet('hideUsers');
  const hideDiagnostics = isFlagSet('hideDiagnostics');
  const hideConfig = isFlagSet('hideConfig');
  const hideLogout = isFlagSet('hideLogout');

  if (!userState.user) {
    return null;
  }

  return (
    <div position="sticky" className={classes.appbar}>
      <Grid container direction="row">
        {phoneData.map((value) =>
          userState.user === value.agentName ? (
            <Grid
              key={value.agentName}
              container
              alignItems="center"
              justifyContent="center"
              direction="row"
              style={{ flexWrap: 'nowrap' }}
            >
              {!hideUsers &&
                configArray.map((uas) => (
                  <Grid key={uas.Username} item xs={10} lg={4} sm={4}>
                    <IconButton
                      style={{ margin: '30px' }}
                      aria-label="settings button"
                      name={uas.Username}
                      onClick={onPhoneLogin}
                    >
                      <PhoneIcon style={{ color: '#2194FF' }} />
                    </IconButton>
                    <Typography style={{ fontSize: 11, color: '#2194FF' }}>{uas.Username}</Typography>
                  </Grid>
                ))}
              {!hideConfig && (
                <IconButton edge="end" aria-label="settings" onClick={onConfig} color="inherit">
                  <SettingsIcon style={{ color: '#2194FF', marginRight: 10 }} />
                </IconButton>
              )}
              {!hideDiagnostics && (
                <IconButton edge="end" aria-label="diagnostics" onClick={onDiagnosticsAsk} color="inherit">
                  <DiagnosticsIcon style={{ color: '#2194FF', marginRight: 10 }} />
                </IconButton>
              )}
              {!hideLogout && (
                <Button aria-label="logout-button" color="inherit" className={classes.button} onClick={onLogout}>
                  Logout
                </Button>
              )}
            </Grid>
          ) : null
        )}
      </Grid>
    </div>
  );
}
