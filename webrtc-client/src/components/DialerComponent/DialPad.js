import React, { useEffect } from 'react';
import { useStopwatch } from 'react-timer-hook';

import { IconButton } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { MicOff, Pause, PlayArrow }from '@material-ui/icons';
import { Mic} from '@material-ui/icons';
//import { PauseCircleOutline } from '@material-ui/icons';
//import { PlayCircleOutline } from '@material-ui/icons';
import { CallEnd } from '@material-ui/icons';
import { Call } from '@material-ui/icons';
import { PhonePaused } from '@material-ui/icons';
//import { VolumeOff } from '@material-ui/icons';
//import { VolumeUp } from '@material-ui/icons';
import Typography from '@material-ui/core/Typography';

import { styles } from './styles';
import { sessionCallback } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/Callback';
import { timerSession } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/Callback';
//import { PauseCircle, PlayCircle } from '@mui/icons-material';

function DialPad(handleCallDialerClose, callObj, callerState, call, client, exWebClient) {
    const classes = styles();
    const [callState, setCallState] = React.useState({
        connected:true,
        disconnected:true,
        hold:false
    });
    const [ callHold, setCallHold ] = React.useState(false);
    const [callNumber, setCallNumber] = React.useState('');
    const [callMsg, setCallMsg] = React.useState('');
    const [ offset, setOffset ] = React.useState(0);
    const [ mute, setMute ] = React.useState(false);
    const stopwatchOffset = new Date(); 
        stopwatchOffset.setSeconds(stopwatchOffset.getSeconds() + parseInt(offset));
    let {
        seconds,
        minutes,
        hours,
        start,
        pause,
        reset,
      } = useStopwatch({ autoStart: false, offsetTimestamp: (stopwatchOffset > new Date())? stopwatchOffset: null});

      const formatTime = (time) => {
        return String(time).padStart(2, '0')
      }
    
      /**
       * Based on the event state, the dialer function is set
       */
    useEffect(() => {
        switch(callerState){
            case 'incoming':
                setCallState({
                    connected:false,
                    disconnected:true,
                    hold:false
                });
                setCallMsg("Incoming call to");
                setCallNumber(callObj.remoteDisplayName)
                break;
            case 'terminated':
                handleDisconnect();
                handleCallDialerClose();
                break;
            case 'connected':
                setCallNumber(callObj.remoteDisplayName);
                setCallState({
                    connected:true,
                    disconnected:false,
                    hold: true
                });
                window.localStorage.setItem('currentState', 'accepted');
                start();
                break;
            case 'activeSession':
                setCallNumber(callObj.remoteDisplayName);
                setCallState({
                    connected:true,
                    disconnected:false,
                    hold: true
                });
                if(window.localStorage.getItem('callTimer') !== null && window.localStorage.getItem('callTimer') !== '0:0:0'){
                    var hms = window.localStorage.getItem('callTimer');
                    var a = hms.split(':'); // split it at the colons
    
                    // minutes are worth 60 seconds. Hours are worth 60 minutes.
                    var second = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
                    setOffset(second);
                    setCallMsg('');
                    start();
                }
                break;
            default:
                break;
        }
        //sessionCallback.initializeSessionCallback(SessionCallback)
    },[callerState]);

    function SessionCallback() {
        /**
         * Store all the data into session storage if there is any active call
         */

    }
        /**
         * Event listener called when disconnect is clicked
         */
        const handleDisconnect = () => {
            /**
             * Disabled the buttons and reset's the timer
             */
            setCallState({
                connected:true,
                disconnected:true,
                hold:false
            });
            setCallNumber('');
            setCallHold(false);
            
            
            window.localStorage.removeItem('callTimer');
            window.localStorage.setItem('CALL_FLUSH', Date.now().toString())
            window.localStorage.removeItem('CALL_FLUSH')
            window.localStorage.removeItem('callDetails');
            window.localStorage.removeItem('currentState');
            reset();
        };
        const handleCallDisconnect = () => {
            if (!call) {
                call = exWebClient.getCall()
            }
            if (call) {
            call.Hangup();
            }
            handleDisconnect();
        }
        /**
         * Event listener called when user clicks on mute button
         */
        const handleMute = () => {
            /**
             * Performs mute and unmute
             */
            if (!call) {
                call = exWebClient.getCall()
            }
            if (call) {            
            call.MuteToggle();
            }
            setMute(!mute);
        };
        /**
         * Event listener called when user clicks on the hold button
         */
        const handleHold = () => {
            /**
             * Enables connect button
             */
            setCallHold(!callHold);
            if (!call) {
                call = exWebClient.getCall()
            }
            if (call) {
            call.HoldToggle();
            }

        };

    return(
        <div>
            <Grid container
                alignItems="flex-start"
                justifyContent="flex-start">
                    <Typography component="span" style={{fontSize:13}}>
                        Incoming call to {client}
                    </Typography>
                    </Grid>
             <Grid container
                alignItems="center"
                justifyContent="center"
                direction="column">
                    {(() => {
                            if(callNumber == ''){
                                return(
                                    <p className="p-call-status">Currently no active calls</p>
                                )
                            }else {
                                let callTimer = formatTime(hours) + ":" + formatTime(minutes) + ":" + formatTime(seconds);
                                //let callTimer = hours + ":" + minutes + ":" + seconds;
                                /**
                                 * If call is active then do not rewrite the localstorage object
                                 */
                                
                                if(!("callDetails" in window.localStorage) && window.localStorage.getItem('currentState') == 'accepted'){
                                    const callDetails = callObj;
                                 window.localStorage.setItem('callDetails', JSON.stringify(callDetails));   
                                    
                                } else{
                                   /** Else do not update the local storage values as call is already accepted */
                              
                                   timerSession.setCallTimer(callTimer);
                                   callTimer = timerSession.getTimer();
                                }
                                return(
                                    <Grid container
                                        direction="column"
                                        justifyContent="center"
                                        alignItems="center">
                                    <Typography component="span" className="p-call-status" style={{fontSize:17, margin: 10}}> {callNumber}</Typography>
                                    <Typography component="span" className="p-call-status" >{callTimer}</Typography>
                                    </Grid>
                                )
                            }
                        })()}
                         {(callHold)?
                            <p className="p-call-status">
                                Call on hold
                            </p>:<p className="p-call-status">&nbsp;&nbsp;</p>}
             </Grid>
             <Grid container
                alignItems="center"
                direction="row"
                justifyContent="center">
                    {/** Displays all the call related buttons */}
                        <IconButton className={classes.iconbutton} disabled={false} style={{backgroundColor:(true)? '#A9A9A9':'rgb(180, 61, 61)'}} onClick={handleMute} >
                            {mute? 
                            <MicOff style={{color:'red'}}/>:
                            <Mic style={{color:'red'}}/>}
                        </IconButton>
                        <IconButton className={classes.iconbutton} style={{backgroundColor:(callHold)? '#1B5E20':'rgb(207, 184, 55)'}} onClick={handleHold}>
                            {!(callHold)?
                            <Pause style={{color:'white'}}/>:
                            <PlayArrow style={{color:'white'}}/>}     
                        </IconButton>
                        <IconButton disabled={callState.disconnected}  className={classes.iconbutton} style={{backgroundColor:(callState.disconnected)? '#A9A9A9':'rgb(180, 61, 61)'}} onClick={handleCallDisconnect}>
                            <CallEnd style={{color:'white'}}/>
                        </IconButton>
                </Grid>
        </div>
    )
};
export default DialPad;
