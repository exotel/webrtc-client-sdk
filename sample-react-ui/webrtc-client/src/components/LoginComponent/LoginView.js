import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import data from '../../phone.json';
import logo from '../../static/exotel_logo.png';
import './LoginStyle.css';
import { useAuthContext } from '../../reducer/AuthContext';

function LoginView({ handleLogin }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [accountSid, setAccountSid] = React.useState('');
  const { dispatch } = useAuthContext();
  const [open, setOpen] = React.useState(true);
  const channel = new BroadcastChannel('app-data');

  const handleSubmit = (e) => {
    e.preventDefault();
    for (let x = 0; x < data.length; x++) {
      if (
        username === data[x].agentName &&
        password === data[x].agentPwd &&
        data[x].AccountSID.value === accountSid
      ) {
        const configData = data[x].AccountSID.ua;
        dispatch({ type: 'CONFIGURATION_ADDED', payload: configData });
        dispatch({ type: 'LOGIN_SUCCESSFUL', payload: { username } });
        handleLogin();
        channel.postMessage({
          message: 'login-successful',
          tabHash: window.sessionStorage.getItem('TabHash'),
        });
      }
    }
  };

  const handleClose = () => {
    setOpen(!open);
    window.location.href = window.location.pathname;
  };

  const handleChange = (e) => {
    switch (e.target.name) {
      case 'Username':
        setUsername(e.target.value);
        break;
      case 'Password':
        setPassword(e.target.value);
        break;
      case 'AccountSid':
        setAccountSid(e.target.value);
        break;
      default:
        break;
    }
  };

  return (
    <div className="container">
      <Dialog open={open} onClose={handleClose}>
        <div className="login-card">
          <div className="header-container">
            <img src={logo} alt="exotelLogo" className="header-image" width={70} height={30} />
            <h1 className="login-header">Login</h1>
          </div>
          <form className="textfield-container" onSubmit={handleSubmit}>
            <input type="text" placeholder="Username" name="Username" className="textfield" onChange={handleChange} />
            <input type="password" placeholder="Password" name="Password" className="textfield" onChange={handleChange} />
            <input type="text" placeholder="AccountSid" name="AccountSid" className="textfield" onChange={handleChange} />
            <a className="link">Forgot password?</a>
            <input type="submit" value="submit" className="submit-btn" />
          </form>
        </div>
      </Dialog>
    </div>
  );
}

export default LoginView;
