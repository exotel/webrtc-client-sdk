import React, { useEffect } from 'react';
import { Grid, Typography } from '@material-ui/core';
import { Cancel } from '@material-ui/icons';
import { Call } from '@material-ui/icons';

import './ModalStyle.css';

function ModalView(handleDialerClose,handleCall, callObj, callerState, call, client,exWebClient) {

    const channel = new BroadcastChannel('app-data');
    /**
     * If call is accepted then triggers callback in AppBar to open the dial pad
     */
    const handleDialer = () => {
        handleDialerClose();
        handleCall(true);
        if (!call) {
            call = exWebClient.getCall()
        }
        if (call) {        
            call.Answer();
        }
    }

    /**
     * If agent wants to reject the call
     */
    const rejectCall = () => {
        if (!call) {
            call = exWebClient.getCall()
        }
        if (call) {        
            call.Hangup();
        }
        handleDialerClose();
    }

useEffect(() => {
    /** In case if there is any dialer function then trigger this here */
    channel.onmessage = function (ev) { 
        if(ev.data == 'accept' && window.sessionStorage.getItem('activeSessionTab') == 'parent0'){ 
            handleDialer();
        }else if(ev.data == 'reject' && window.sessionStorage.getItem('activeSessionTab') == 'parent0'){
            rejectCall();
        }
     }
},[])

/**
 * Displays the agent phone that is receiving the call
 */
    return(
        <Grid container
            alignItems='flex-start'
            justifyContent='flex-start'
            direction='column'>
                <p className="p-dialer">{client}</p>
                <Grid container
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    direction='row'>
                    <p className="p-message">Incoming call from </p>
                    <p className="p-call-msg">{callObj.remoteDisplayName}</p>
                </Grid>
                <Grid container
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    direction='row'>
                         <button className="go-to-receiver" onClick={handleDialer} >
                        <Grid container
                            direction="row">
                         <Call style={{marginTop:4, color:'green'}} />
                          <Typography style={{fontSize:13, margin: 8}}>
                              Accept
                          </Typography>
                        </Grid>
                        </button>
                        <button className="go-to-receiver" onClick={rejectCall}>
                        <Grid container
                            direction="row">
                            <Cancel style={{marginTop:4,fontSize:25,fontWeight:'bold', color:'#E57373'}}/>
                            <Typography style={{fontSize:13, margin: 8}}>
                              Reject
                          </Typography>
                        </Grid>
                    </button>
                    
                </Grid>
                
        </Grid>
    )
};
export default ModalView;