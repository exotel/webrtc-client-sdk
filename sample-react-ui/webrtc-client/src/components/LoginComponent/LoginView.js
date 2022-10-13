import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Dialog  from '@material-ui/core/Dialog';
import data from '../../phone.json';
import logo from '../../static/exotel_logo.png';

import './LoginStyle.css';
import {
  useAuthContext,
  login
} from '../../reducer/AuthContext';

function LoginView({handleLogin}) {

  const [ username, setUsername ] = React.useState('');
  const [ password, setPassword ] = React.useState('');
  const [accountSid, setAccountSid] = React.useState('');
  const { dispatch } = useAuthContext();
  const [ open, setOpen ] = React.useState(true);
  const channel = new BroadcastChannel('app-data');

  const handleSubmit = (e) => {
    e.preventDefault();
    /**
     * Call the API to verify the user credentials from the phone.json file
     */
    for(var x=0; x<data.length; x++){
      if(username == data[x].agentName && password == data[x].agentPwd && data[x].AccountSID.value == accountSid){

        /**
         * Time being store the configuration into config object in localStorage
         */
           const configData = data[x].AccountSID.ua;
           dispatch({type:'CONFIGURATION_ADDED', payload:configData});


        const userState = {
          username: username
        }
        dispatch({type:'LOGIN_SUCCESSFUL', payload: userState});
        handleLogin();
        /**
         * In case if other tabs are already open, if there are 2 or more tabs then remove from 
         */
         let postMsg = {
          message: 'login-successful',
          tabHash: window.sessionStorage.getItem('TabHash')
        }
          channel.postMessage(postMsg);
      }
    }
  };
  const handleClose = () => {
    setOpen(!open);
    window.location.href = window.location.pathname;
  }

  /**
   * Handle the changes in the username/password/accountsid text field
   * @param {*} e 
   */
  const handleChange = (e) => {
    switch(e.target.name){
      case 'Username':
        setUsername(e.target.value);
      break;
      case 'Password':
        setPassword(e.target.value);
      break;
      case 'AccountSid':
        setAccountSid(e.target.value);
      break;
    }
  }


   return(
       <div className="container">
           <Dialog
              open={open}
              onClose={handleClose}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
           <div className="login-card">
               <div className="header-container">
                    <img src={logo} alt="exotelLogo" className="header-image" width={70} height={30}/>
                    <h1 className="login-header">Login</h1>
               </div>
               <div>
                  <form className="textfield-container" onSubmit={handleSubmit}>
                    <input type="text" placeholder="Username" name="Username" className="textfield" onChange={handleChange}/>
                    <input type="password" placeholder="Password" name="Password" className="textfield" onChange={handleChange}/>
                    <input type="text" placeholder="AccountSid" name="AccountSid" className="textfield" onChange={handleChange}/>
                    <a className="link">Forgot password?</a>
                    <input type="submit" value="submit" className="submit-btn"/>
                  </form>
                </div>
           </div>
           </Dialog>
       </div>
   )
}
export default LoginView;