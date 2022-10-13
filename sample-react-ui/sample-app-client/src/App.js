import logo from './logo.svg';
import './App.css';
//import { Routes } from '@exotel/webrtc_client_app/dist/routes/index';
//import { WebrtcApp } from '@exotel/webrtc_client_app/dist/routes/index';
import { WebrtcApp } from '@exotel/webrtc_client_app_diagnostics/dist/routes/index';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Avatar } from '@mui/material';
import { Typography } from '@mui/material';
import { Grid } from '@mui/material';



function App() {
  window.localStorage.setItem('hideUsers', true)
  //window.localStorage.setItem('hideConfig', true)
  window.localStorage.setItem('hideLogout', true)
  return (
    <AppBar style={{background: 'white', color: 'black', flex: 1, display:'flex'}}>
        <Toolbar>
          <Grid container
            justifyContent="space-between" // Add it here :) 
            direction="row"
            alignItems="center">
              <Grid item>
                <div style={{display:'flex', direction:'row'}}>
              <Avatar alt="Exotel" src="/exotelLogo.jpg" style={{margin:'20px'}}/>
                <Typography style={{margin: '20px', fontSize:'30px'}}>
                  Webrtc Gaudim
                </Typography>
                </div>
        </Grid>
        <Grid item>
        <WebrtcApp/>
        </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

export default App;
