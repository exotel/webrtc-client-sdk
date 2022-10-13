import React , { useEffect } from 'react';
import { TextField } from "@material-ui/core";
import { Grid } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { Button } from '@material-ui/core';
import { styles } from './styles';
import { useAuthContext } from '../../reducer/AuthContext';

function ConfigContent({value}) {
    const [ sipUser, setSipUser ] = React.useState(value+1);
    const [ username, setUsername ] = React.useState('');
    const [ password, setPassword ] = React.useState('');
    const [ domain, setDomain ] = React.useState('');
    const [ accountSID, setAccountSid ] = React.useState('');
    const [ hostname, setHostname ] = React.useState('');
    const [ callTimeout, setCallTimeout ] = React.useState('');
    const { userState, dispatch } = useAuthContext();
    const [ disabled, setDisabled] = React.useState(false);

    const classes = styles();

    useEffect(() => {
        /**
         * Fetch the details from localstorage and show it in the form
         */
        const account = window.localStorage.getItem('configObj')
        if(userState.configObj.length !== 0 && userState.configObj !== undefined){
            /**
             * above statement means there is data, hence parse the data object
             */
            const accountDetails = JSON.parse(account); // We get the array
            /**
             * In case if the array length is not same as index then do nothing and also
             * make sure if account number matches with the index
             */
            // if(accountDetails.length <= value && accountDetails !== undefined &&
            //     !(accountDetails.some(item => item.AccountNo == value))) {
            //     /**
            //      * when accounts are less than the tabs
            //      */
            // } else  if(accountDetails.some(item => item.AccountNo == value)){
            // var index = accountDetails.findIndex(item => item.AccountNo == value);
            // }
            setUsername(accountDetails[value].Username);
            setPassword(accountDetails[value].Password);
            setDomain(accountDetails[value].Domain);
            setAccountSid(accountDetails[value].AccountSID);
            setHostname(accountDetails[value].HostServer + ":" + accountDetails[value].Port);
            setCallTimeout(accountDetails[value].CallTimeout);
        }
        initUsername();
    },[])

    const initUsername = () => {
        const phoneObj = JSON.parse(window.localStorage.getItem('phoneData'));
        if(phoneObj !== null && phoneObj !== undefined){
            setUsername(phoneObj.username);
            setPassword(phoneObj.password);
            setHostname(phoneObj.proxy);
            setDomain(phoneObj.proxy)
            setDisabled(true);
            return;
        }
    }

    const handleInputChange = (event) => {
        switch(event.target.name){
            case "Username":
                    setUsername(event.currentTarget.value);
                break;
            case "Password":
                    setPassword(event.currentTarget.value);
                break;
            case "Domain":
                    setDomain(event.currentTarget.value);
                break;
            case "AccountSID":
                    setAccountSid(event.currentTarget.value);
                break;
            case "HostServer":
                    setHostname(event.currentTarget.value);
                break;
            case "CallTimeout":
                    setCallTimeout(event.currentTarget.value);
                break;
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const port = hostname.split(':');
        const configData = {
        "Username": username,
        "DisplayName": username,
        "HostServer": port[0],
        "Domain": domain,
        "Port":port[1],
        "Password":password,
        "CallTimeout":1000,
        "Security": "wss",
        "AccountSID": accountSID,
        "AccountNo":username
        }
        const data = {
            configData: configData,
            index: value
        }
        /**
         * Store all the data into a localstorage for time being through redux
         */
            dispatch({type:'CONFIGURATION_MODIFIED', payload:JSON.stringify(data)})
            window.location.href = window.location.pathname;
    }


    return(
        <div>
            <Grid container 
                alignItems="center"
                justifyContent="center"
                direction="column">
                    <Typography className={classes.header}> Configuration of Account {sipUser}</Typography>
            <form onSubmit={handleSubmit}>
            <TextField
                label="Username" name="Username" required variant="outlined" value={username} onChange={handleInputChange} className={classes.textField}
                disabled={disabled}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}
                InputLabelProps={{
                    className: classes.floatingLabelFocusStyle
                  }}/>
              <TextField
                label="Password" name="Password" required variant="outlined" value={password} onChange={handleInputChange} type="password" className={classes.textField}
                disabled={disabled}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}/>
                 <TextField
                label="Domain" name="Domain" required variant="outlined" value={domain} onChange={handleInputChange} focused className={classes.textField}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}/>
              <TextField
                label="AccountSID" name="AccountSID" required variant="outlined" value={accountSID} onChange={handleInputChange} focused className={classes.textField}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}/>
              <TextField
                label="Host Server:Port" name="HostServer" required variant="outlined" value={hostname} onChange={handleInputChange} focused className={classes.textField}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}/>
              <TextField
                label="Call Timeout" name="CallTimeout" required variant="outlined" value={callTimeout} onChange={handleInputChange} focused className={classes.textField}
                InputProps={{
                    className: classes.input,
                    classes: {
                        notchedOutline:classes.input
                    }
                }}/>
            </form>
            <Grid item xs={12} lg={6} sm={4}>
            <Grid container
                direction="row">
              <Button className={classes.button} onClick={handleSubmit}>
                  Save
              </Button>
              <Button className={classes.button} >
                  Reset
              </Button>
            </Grid>
            </Grid>
        </Grid>
        </div>
    )
};
export default ConfigContent;