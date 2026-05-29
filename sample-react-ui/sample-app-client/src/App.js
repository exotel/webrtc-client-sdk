import logo from './logo.svg';
import './App.css';
import { WebrtcApp } from '@exotel/webrtc_client_app_diagnostics/dist/routes/index';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Avatar, Typography, Grid } from '@mui/material';

function App() {
  window.localStorage.setItem('hideUsers', true);
  window.localStorage.setItem('hideLogout', true);
  return (
    <AppBar style={{ background: 'white', color: 'black', flex: 1, display: 'flex' }}>
      <Toolbar>
        <Grid container justifyContent="space-between" direction="row" alignItems="center">
          <Grid item>
            <div style={{ display: 'flex', direction: 'row' }}>
              <Avatar alt="Exotel" src="/exotelLogo.jpg" style={{ margin: '20px' }} />
              <Typography style={{ margin: '20px', fontSize: '30px' }}>Webrtc Gaudim</Typography>
            </div>
          </Grid>
          <Grid item>
            <WebrtcApp />
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

export default App;
