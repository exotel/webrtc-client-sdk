import React, { useEffect, useRef } from 'react';
import * as zip from "@zip.js/zip.js";
import Draggable from 'react-draggable';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Menu from '@material-ui/core/Menu';
import Button from '@material-ui/core/Button';
import SettingsIcon from '@material-ui/icons/Settings';
import DiagnosticsIcon from '@material-ui/icons/Build'
import PhoneIcon from '@material-ui/icons/Person';
import { Avatar, ListItem, Switch } from '@material-ui/core';
import { Snackbar } from '@material-ui/core';
import CallIcon  from '@material-ui/icons/Call';
import { Card } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { Cancel, ContactSupportOutlined } from '@material-ui/icons';
import axios from 'axios';
import { SnackbarContent, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core';
import { styles } from './AppBarStyle';
import DialPad from '../DialerComponent/DialPad';
import ModalView from '../ModalComponent/ModalView';
import { useAuthContext } from '../../reducer/AuthContext';
import LoginView from '../LoginComponent/LoginView';
import DiagnosticsView from '../DiagnosticsComponent/DiagnosticsView';
import DiagnosticsDevices from '../DiagnosticsComponent/DiagnosticsDevices';
import DiagnosticsReport from '../DiagnosticsComponent/DiagnosticsReport';
import ConfigPopup from '../SettingsComponent/ConfigPopup';
import DiagnosticsAskPopup from '../DiagnosticsComponent/DiagnosticsAskPopup';
import data from '../../phone.json';
import { uuid } from 'uuidv4';
import { FetchTabInfo } from '../../constants/common';
import { ExotelWebClient } from '@exotel/webrtc-sdk-diagnostics/src/webrtc-client-sdk/listeners/ExWebClient';
import logoSrc from '../../static/exotelLogo.jpg'
import { createRef, useState } from 'react'
import { useScreenshot, createFileName  } from 'use-react-screenshot'
import { strictEqual } from 'assert';
import html2canvas from "html2canvas";

export default function PrimaryPhoneAppBar(myPhoneDetails) {
  const classes = styles();
  const { userState, dispatch } = useAuthContext();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorPhoneLoginEl, setAnchorPhoneLoginEl] = React.useState(null);
  const [ isPhoneLogin, setPhoneLoginOpen ] = React.useState(false);
  const [ openLogin, setOpenLogin ] = React.useState(false);
  const [ callMessage, setMessage ] = React.useState('');
  const [ openConfig, setOpenConfig ] = React.useState(false);
  const [ openDiagnosticsAsk, setDiagnosticsAsk ] = React.useState(false);
  const [ openDiagnosticsOps, setDiagnosticsOps ] = React.useState(false);
  const [ openDiagnosticsDevices, setDiagnosticsDevices ] = React.useState(false);
  const [ openDiagnosticsReport, setDiagnosticsReport ] = React.useState(false);
  const [ openPhones, setOpenPhones ] = React.useState(false);
  const [ openDialer, setOpenDialer] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [ callObj, setCallObj ] = React.useState('');
  const [ callerState, setCallState ] = React.useState('');
  const [ phoneName, setPhoneName ] = React.useState('');
  const [ callDialer, setCallDialer ] = React.useState(false);
  const [ client, setClient ] = React.useState('');
  const channel = new BroadcastChannel('app-data');
  const [outgoingNumber, setOutgoing] = React.useState(' ');
  const [micValue, setMicValue] = React.useState(window.localStorage.getItem('micValue'));
  const [speakerValue, setSpeakerValue] = React.useState(window.localStorage.getItem('speakerValue'));
  const [micUserResponse, setMicResponse] = React.useState("");
  const [speakerResponse, setSpeakerResponse] = React.useState(window.localStorage.getItem(''));
  const [troubleShootReport, setTroubleshootReport] =  React.useState('');
  const diagnosticsNetImageRef = useRef(null)
  const diagnosticsDeviceImageRef = useRef(null)
  const imageRef = useRef(null)
  const commentsRef = useRef(null)
  const [diagnosticsNetImageUrl, setNetImageUrl] = React.useState("");
  const [diagnosticsDeviceImageUrl, setDeviceImageUrl] = React.useState("");
  const [imageUrl, setDiagImageUrl] = React.useState("");
  const [imageDiag, setImageDiag] = useState(null)
  const [errorDiag, setErrorDiag] = useState(null)    
  const [ configUpdated, setConfigUpdated ] = React.useState(false);
  var configArray = JSON.parse(window.localStorage.getItem('configObj'));
  var minMicStatus = 0;
  var minSpeakerStatus = 0;
  var maxMicStatus = 0;
  var maxSpeakerStatus = 0;
  var lastSpeakerTime = 0.0;
  var lastMicTime = 0.0;
  /**
   * Initialize all the singleton functions here
   */
  var exWebClient = new ExotelWebClient()
  var call;
  var sipAccountInfo;

  const isMenuOpen = Boolean(anchorEl);

  function update_sipAccountInfo() {
    /**
     * Create a register phone object with the phone number, accountSID, domain,username & pwd
     */

     const configObj = JSON.parse(userState.configObj);
     var index = 0;
     var filteredObj = configObj.find(function(item, i){
       if(item.Username === phoneName){
         index = i;
         return i;
       }
     });
     /**
      * generate a config object and pass as parameter for SIP registration
      */
     sipAccountInfo = {
           'userName': configObj[index].Username,
           'authUser': configObj[index].Username,
           'sipdomain': configObj[index].Domain,
           'domain': configObj[index].HostServer + ":" + configObj[index].Port,
           'displayname': configObj[index].DisplayName,
           'secret': configObj[index].Password,
           'port': configObj[index].Port,
           'security': configObj[index].Security
       }        
  }


  const takeScreenShotDirect = (node) => {
    var type = "image/jpeg"
    var quality = 1.0
    if (!node) {
      throw new Error('You should provide correct html node.')
    }

    console.log("taking snapshot on node ", node)

    return html2canvas(node, {
      width: 1800,
      height: 1200,
      allowTaint: true,
      logging: true
    }).then((canvas) => {
        console.log("html2canvas returned canvas ", canvas);
        const croppedCanvas = document.createElement('canvas')
        const croppedCanvasContext = croppedCanvas.getContext('2d')
        // init data
        const cropPositionTop = 0
        const cropPositionLeft = 0
        const cropWidth = canvas.width
        const cropHeight = canvas.height

        croppedCanvas.width = cropWidth
        croppedCanvas.height = cropHeight
        croppedCanvas.classList.add("diagnosticsCanvas");
        canvas.classList.add("diagnosticsCanvas");
        document.body.appendChild(canvas);
        croppedCanvasContext.drawImage(
          canvas,
          cropPositionLeft,
          cropPositionTop,
        )
        const base64Image = canvas.toDataURL(type, quality)
        setImageDiag(base64Image)
        croppedCanvas.style.display = "none";
        return base64Image
      }).catch((error) => {
        console.log("html2canvas error: ", error);
        setErrorDiag(error);
      })
  }

  const hideDiagnosticsCanvas = () => {
    var canvasList = document.getElementsByClassName("diagnosticsCanvas");
    for(let i = 0;i < canvasList.length; i++)
    {
      canvasList[i].style.display = "none";
    }      
  }

  const removeDiagnosticsCanvas = () => {
    var canvasList1 = document.getElementsByClassName("diagnosticsCanvas");

    for(let i = 0;i < canvasList1.length; i++)
    {
      console.log("by class canvas to remove:", canvasList1[i])
      canvasList1[i].style.display = "none";
      document.body.removeChild(canvasList1[i]);
    }
  }

  const downloadNetworkImage = (image, { name = "DiagnosticViews", extension = "jpeg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = name + "." + extension;
    document.body.appendChild(a);
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      a.dispatchEvent(event);
      document.body.removeChild(a);
    }); 
  };
  
  const downloadDeviceImage = (image, { name = "DiagnosticDevices", extension = "jpeg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = name + "." + extension;
    document.body.appendChild(a);
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      a.dispatchEvent(event);
      document.body.removeChild(a);
    }); 
  };  

  function downloadDiagComments(reportFileName) {
    var link = document.createElement('a');
    link.setAttribute('download', reportFileName);
    console.log("Download comments ", commentsRef.current.value)
    link.href = makeTextFile(commentsRef.current.value);
    document.body.appendChild(link);
    console.log("Troubleshoot Comments = ", troubleShootReport );
    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  
  }


  function downloadDiagTroubleshootlogs(reportFileName) {
    var troubleShootLogs;

    try {
      troubleShootLogs = window.localStorage.getItem('troubleShootReport')
      setTroubleshootReport(window.localStorage.getItem('troubleShootReport'))
    } catch {
      troubleShootLogs = "error in fetching troubleShootReport"
    }

    var link = document.createElement('a');
    link.setAttribute('download', reportFileName);
    link.href = makeTextFile(troubleShootLogs);
    document.body.appendChild(link);
    console.log("Troubleshoot Report = ", troubleShootLogs );
    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      document.body.removeChild(link);
    });
  
  }
  
  const downloadZipImageAsBlob = (zipBlobUrl, { name = "Diagnostics", extension = "zip" } = {}) => {
    const a = document.createElement("a");
    a.href = zipBlobUrl;
    a.download = name + "." + extension;
    document.body.appendChild(a);
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      a.dispatchEvent(event);
      document.body.removeChild(a);
    }); 
  };  

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  /**
   * If not logged in on click pop up comes up
   */
  const handleLogin = () => {
      setOpenLogin(!openLogin);
  }


  /**
   * When user clicks on logout
   */
  const handleLogout = () => {
    /**
     * Fetch all the registered users and then send un-register 
     */
    if(window.localStorage.getItem('registeredUsers') !== null){
      var registeredUsers = JSON.parse(window.localStorage.getItem('registeredUsers'));
      for(var x=0; x<registeredUsers.length; x++){
        /**
         * Fetch each phone name and send unregister
         */
         const configObj = JSON.parse(userState.configObj);
         var index = -1;
         var filteredObj = configObj.find(function(item, i){
           if(item.Username === registeredUsers[x].phoneName){
             index = i;
             return i;
           }
         });
         const sipAccountInfo = {
          'userName': registeredUsers[x].phoneName,
          'authUser': configObj[index].Username,
          'sipdomain': configObj[index].Domain,
          'domain': configObj[index].HostServer + ":" + configObj[index].Port,
          'displayname': configObj[index].DisplayName,
          'secret': configObj[index].Password,
          'accontName': registeredUsers[x].phoneName,
          'sipUri':"wss://" + configObj[index].Username + "@" + configObj[index].Domain+ ":" + configObj[index].Port,
          'security': configObj[index].Security,
          'port': configObj[index].Port,
          'contactHost': window.localStorage.getItem('contactHost')
      }
      let user_data = {
        phoneName:registeredUsers[x].phoneName,
        phoneNumber:registeredUsers[x].phoneName,
    }
      exWebClient.UnRegister(sipAccountInfo, exWebClient);
      dispatch({type:'DE_REGISTERED_SUCCESSFULLY', payload:user_data})
      }
    }
    let postMsg = {
      message: 'logout',
    }
    channel.postMessage(postMsg);
  }
  /**
   * Handles the config pop up
   */
  const handleConfig = () => {
    setOpenConfig(!openConfig)
  };

  const handleOpenPhone = (event) => {
    setOpenPhones(!openPhones);
    if(event.target.value !== undefined){
        /**
         * When user selects a phone show the same in the header bar, store the selected phone in localstorage
         */
         const phone_data = {
          selectedPhone: event.target.value
      }
      dispatch({type:'PHONE_SELECTED', payload:phone_data});
      /**
       * Open dialer pad
       */
      setOpenDialer(true);
    }
  };
  const handleDialerClose = () => {
    setOpenDialer(false);
    
  };

      /**
     * Call back listener, whenever there is an incoming call, this callback gets triggered
     * @param {call} callObj 
     * @param {*} eventType 
     */
       function CallListenerCallback(callObj, eventType, phone) {
        console.log('call back called....', callObj, 'event type.....', eventType, 'for phone...', phone);
        setCallObj(callObj);
        setClient(phone);
        let msg = {};
        switch(eventType) {
           /**
            * Create a callback in the dialpad and call the function here whenever this gets triggered
            */ 
            case 'incoming':
              setOpenDialer(true);              
              setCallState(callObj.callState);
              msg = {
                callNumber: callObj.remoteDisplayName,
                callState: 'incoming'
              };
              channel.postMessage(msg);
                break;
            case 'connected':
              setOpenDialer(false);
              setCallState(callObj.callState)
              msg = {
                callNumber: callObj.remoteDisplayName,
                callState: 'connected'
              };
              channel.postMessage(msg);
                break;
            case 'callEnded':
              setOpenDialer(false);
              setCallState('terminated');
              msg = {
                callNumber: '',
                callState: 'callEnded'
              };
              channel.postMessage(msg);
                break;
            case 'activeSession':
              setCallDialer(true);
              setCallState('activeSession')
                break;
        }
    };

    function SessionCallback(callState, phone) {
      /**
       * SessionCallback is triggered whenever the state of application changes due to an incoming call
       * which needs to be handled across tabs
       */
      switch(callState){
        case 'incoming':
          console.log('incoming call' + phone)
          /**
           * Display a different notification popup in case of child tabs
           */
          if(window.sessionStorage.getItem('activeSessionTab') !== 'parent0'){
            setOpen(true);
            const message = 'Incoming call from ' + phone + ' ,Switch tab to find dialpad'
            setMessage(message);
          }
        break;
        case 'callEnded':
          /**
           * When call is either accepted or rejected then this is gets shutdown
           */
          console.log('call ended' + phone)
          setOpen(false);
        break;
        case 'connected':
          /**
           * When call is connected close the notification popup on child tabs
           */
          console.log('call connected' + phone)
          setOpen(false);
        break;
        case 're-register':
          /**
           * In case if the main/parent tab is closed then make the subsequent tab in the tab list as the parent tab
           * and send register for the same and also make that tab as the master
           */
          let hashRes = phone.split(/:/);
          let hashRes1 = hashRes[0].split(/"/);
          if(window.sessionStorage.getItem('TabHash') == hashRes1[1]){
            console.log('Sending register on tab' + window.sessionStorage.getItem('TabHash'))
            const tabArray = JSON.parse(window.localStorage.getItem('tabs'));
            /**
             * Check for the array, in case if there is already master in the tab list then do not add to the list else add
             */
            var indx = tabArray.findIndex(item => item.tabID === "parent0");
            if(indx == -1){
              const tabArr = [];
              const tabData = {
              tabID: 'parent0',
              tabType: 'parent',
              tabStatus: 'active'
            };

             /** If master is already in the tabArray then do not push */
             tabArr.push(tabData);
             for(var x=0; x<tabArray.length; x++){
                tabArr.push(tabArray[x]); 
            }
            window.localStorage.setItem('tabs', JSON.stringify(tabArr));
          }
            window.sessionStorage.removeItem('activeSessionTab');
            window.sessionStorage.setItem('activeSessionTab', 'parent0');
            window.localStorage.removeItem('registeredUsers');
            sendAutoRegistration();
          }
          break;
        case 'logout':
            /** remove the whole of localstorage and session storage */
            window.sessionStorage.clear();
            window.localStorage.clear();
            dispatch({type:'LOGOUT', payload:''});
            window.location.href = '/';
          break;
        case 'login-successful':
          /** If successfully logged in and already multiple tabs are opened then send registration from 
           * parent tab
           */
          const loginObj = JSON.parse(phone);
          console.log('Login successful' + loginObj)
          window.sessionStorage.setItem('user', loginObj.phone);
          window.sessionStorage.setItem('isAuthenticated', true);
          if(window.sessionStorage.getItem('TabHash') == loginObj.tabHash){
            console.log('Set parent for that tab here while making other tabs as child')
            window.sessionStorage.setItem('activeSessionTab', 'parent0');
            sendAutoRegistration();
          }else {
            /** Fetch the activeSessionTab value and set the same */
            const tabArray = JSON.parse(window.localStorage.getItem('tabs'));
            var indx = tabArray.findIndex(item => item.tabType === "child");
            const tabID = tabArray[indx].tabID;
            window.sessionStorage.setItem('activeSessionTab', tabID);
          }
          window.location.href = window.location.pathname;
          break;
      }
  };
 

  function wsCallback(key, wsStatus, wsDescription) {
    console.log("websocket status = " + wsStatus + " websocket Description = " + wsDescription)
    if (wsStatus == 'connected') {
      window.localStorage.setItem('webrtcUrl', wsDescription);    
    }
  }

  function userRegCallback(userRegStatus, userRegDescription) {
    //setUserRegFlag
    var registeredUsers;
    var userRegistrationDescription = "";
    console.log("userReg status = " + userRegStatus + " userReg Description = " + userRegDescription)
    /* We reuse the registeredUsers list */
    if (window.localStorage.getItem('registeredUsers') !== null) {
		  var registeredUsers = JSON.parse(window.localStorage.getItem('registeredUsers'));

		  for (var x = 0; x < registeredUsers.length; x++) {
		  	userRegistrationDescription += registeredUsers[x].phoneName + ",";
		  }
  	} 
    window.localStorage.setItem('regUsers', userRegistrationDescription);
  }

  function tcpCallback(key, status, value) {
    window.localStorage.setItem(key, value);
    console.log("tcp status = " + status + " tcp Description = " + value)
  }

  function udpCallback(key, status, value) {
    window.localStorage.setItem(key, value);
    console.log("udp status = " + status + " udp Description = " + value)
  }

  function ipv6Callback(key, status, value) {
    window.localStorage.setItem(key, value);
    console.log("ipv6 status = " + status + " ipv6 Description = " + value)
  }

  function hostCallback(key, status, value) {
    window.localStorage.setItem(key, value);
    console.log("host status = " + status + " websocket Description = " + value)
  }

  function reflexCallback(key,status, value) {
    window.localStorage.setItem(key, value);
    console.log("reflex status = " + status + " reflex Description = " + value)
  }

  function saveDiagnosticsCallback(saveDiagStatus, saveDiagDescription) {
    //setSaveStatusFlag
    //console.log("diagnistics status = " + saveDiagStatus + " diagnistics Description = " + saveDiagDescription)
    window.localStorage.setItem('DiagnosticReport', saveDiagDescription)
  }

  function micStatusCallback(key, micStatus, micDescription) {

    let d = new Date()
    let currentTime = d.getMilliseconds();
    let diffTime = Math.abs(currentTime - lastMicTime);

    try {
    if (micDescription == "mic ok") {
      if ((parseFloat(micStatus))  > maxMicStatus)  {
        maxMicStatus = parseFloat(micStatus);
      }
      if ((parseFloat(micStatus))  > 0)  {
        minMicStatus = parseFloat(micStatus);
      }
      if (diffTime > 50) {
        lastMicTime = currentTime
        if (parseFloat(micStatus) > 0) {
          //if (parseFloat(micStatus) > minMicStatus) {
            window.localStorage.setItem("micValue", micStatus);    
            window.localStorage.setItem("micDescr", micDescription);            
            setMicValue(micStatus);
          //}
        }
      }
    } else {
      //setMicValue(micStatus);
    }
    } catch (e) {
      console.log("Exception in micStatusCallback", e)
    }
  }

  function speakerStatusCallback(key, speakerStatus, speakerDescription) {

    let d = new Date()
    let currentTime = d.getMilliseconds();
    let diffTime = Math.abs(currentTime - lastSpeakerTime);

    try {
    if (speakerDescription == "speaker ok") {
      if ((parseFloat(speakerStatus))  > maxSpeakerStatus)  {
        maxSpeakerStatus = parseFloat(speakerStatus);
      }
      if ((parseFloat(speakerStatus))  > 0)  {
        minSpeakerStatus = parseFloat(speakerStatus);
      }  
      
      if (diffTime > 50) {
        lastSpeakerTime = currentTime
        if (parseFloat(speakerStatus) > 0) {
          //if (parseFloat(speakerStatus) > minSpeakerStatus) {
            window.localStorage.setItem("speakerValue", speakerStatus);    
            window.localStorage.setItem("speakerDescr", speakerDescription); 
            setSpeakerValue(speakerStatus);
          //}
        }    
      }
    } else {
      //setSpeakerValue(speakerStatus);
    }
    } catch (e) {
      console.log("Exception in speakerStatusCallback", e)
    }

  }
  
  function keyValueSetCallback(key, status, value) {
    //console.log("keyValueSetCallback: key=[" + key + "] status=[" + status + "] value=[" + value + ']' )
    if (key == "wss") {
      wsCallback(key, status, value)
    } else if (key == "userReg") {
      userRegCallback(key, status, value)
    } else if (key == "speaker") {
      speakerStatusCallback(key, status, value)
    } else if (key == "mic") {
      micStatusCallback(key, status, value)
    } else if (key == "tcp") {
      tcpCallback(key, status, value)
    } else if (key == "udp") {
      udpCallback(key, status, value)
    } else if (key == "ipv6") {
      ipv6Callback(key, status, value)
    } else if (key == "host") {
      hostCallback(key, status, value)
    } else if (key == "srflx") {
      reflexCallback(key, status, value)
    } else if (key == "speakerInfo") {
      window.localStorage.setItem(key, status);
    } else if (key == "micInfo") {
      window.localStorage.setItem(key, status);
    } else {
      window.localStorage.setItem(key, value);
    } 
    //handleDiagnosticsOpsRefresh();    
  }  


    /**
     * Open the register menu
     * @param {*} event 
     */
    const handleDiagnosticsAsk = (event) => {
      setDiagnosticsAsk(true);
      setDiagnosticsOps(false);
      setDiagnosticsDevices(false);       
      setOpenConfig(false)
      exWebClient.initDiagnostics(saveDiagnosticsCallback, keyValueSetCallback);
      console.log("Initialized Diagnostics ....\n")
     };

  /**
   * Diagnostics Operations pop up comes up
   */
   const handleDiagnosticsOps = (event) => {
    /* Start Diagnostics Parallely for the initial screen */ 
    resetDiagnosticValues();
    sendDiagnosticsRequest(); 
    setDiagnosticsAsk(false);
    setDiagnosticsDevices(false);    
    setDiagnosticsOps(true);
  }

    /**
   * Diagnostics Devices pop up comes up
   */
     const handleDiagnosticsDevices = (event) => { 
      resetDiagnosticValues();           
      setDiagnosticsAsk(false);
      setDiagnosticsOps(false);
      setDiagnosticsDevices(true); 
      handleDiagnosticsDevicesStart();     
    }

   /**
   * If not logged in on click pop up comes up
   */
     const handleDiagnosticsOpsRefresh = (event) => {
      setDiagnosticsOps(false);
      setDiagnosticsDevices(false);  
      setDiagnosticsAsk(false);           
      setDiagnosticsOps(true);
    }
  
   /**
   * If not logged in on click pop up comes up
   */
    const handleDiagnosticsDevicesRefresh = (event) => {
      setDiagnosticsDevices(false);
      setDiagnosticsAsk(false);           
      setDiagnosticsDevices(true);
    }


    const handleDiagnosticsReport= () => {
      setDiagnosticsReport(true);
    }

    /**
     * Open the register menu
     * @param {*} event 
     */
    const handlePhoneLogin = (event) => {
        setPhoneLoginOpen(!isPhoneLogin);
        sendAutoRegistration(event.currentTarget.name)
        setPhoneName(event.currentTarget.name);
        setAnchorPhoneLoginEl(event.currentTarget);
    };
    /**
     * Closes the register menu
     */
    const handlePhoneLoginClose = () => {
      setPhoneLoginOpen(false);
      setAnchorPhoneLoginEl(null);
    };
    /**
     * Function is triggered when there is an activity on notification popup
     * @param {*} event 
     */
    const handleCall = (event) => {
      setCallDialer(event);
    };
    /**
     * When call ends, the dialer is closed
     */
    const handleCallDialerClose = () => {
      setCallDialer(false);
    }
    
  window.onload = (event) => {
    /** When page is reloaded the socket connection closes hence all the phones would be
     * unregistered
     */
    dispatch({type:'DE_REGISTERED_ALL_USERS', payload:''});
    /**
     * Whenever app is loaded then we consider it as a tab instance, and in case if there is already a tabHash
     * stored in session storage then update the value with new random digit
     */
    let hash = 'tab_' + +new Date();
    sessionStorage.setItem('TabHash',hash);
    let tabs = JSON.parse(localStorage.getItem('TabsOpen')||'{}');
    tabs[hash]=true;
    localStorage.setItem('TabsOpen',JSON.stringify(tabs));
    
  };
  /**
   * In case if there are no master tabs then current visible tab is to be made master hence this function
   */
  document.addEventListener("visibilitychange", function() {
    if(!document.hidden){
       /** check if there is any master in the tabs list, if no then only add the updated changes else don't */
    const tabArray = JSON.parse(window.localStorage.getItem('tabs'));
    const tabArr = [];
    var indx = tabArray.findIndex(item => item.tabID === "parent0");
    if(indx == -1){
      const tabData = {
      tabID: 'parent0',
      tabType: 'parent',
      tabStatus: 'active'
    };
    tabArr.push(tabData);
    for(var x=0; x<tabArray.length; x++){
      tabArr.push(tabArray[x]);
    }
    
    window.localStorage.setItem('tabs', JSON.stringify(tabArr));

    window.sessionStorage.removeItem('activeSessionTab');
    window.sessionStorage.setItem('activeSessionTab', 'parent0');
    window.localStorage.removeItem('registeredUsers');
    sendAutoRegistration();
     }
    }
});
  window.onclose = (event) => {
    let allTabs = localStorage.getItem('TabsOpen');
    let tabs = allTabs.split(/,/);
    window.localStorage.setItem('dummy', tabs.length);
    if(tabs.length == 1 && window.sessionStorage.getItem('activeSessionTab') == "parent0"){
      window.sessionStorage.clear();
      window.localStorage.clear();
      
    }
  };
  window.onbeforeunload = (event) => {
    /** If parent tab is being closed then get then remove the master details from localstorage */
    const tabArr = JSON.parse(window.localStorage.getItem('tabs'));
    if(tabArr.length > 1 && window.sessionStorage.getItem('activeSessionTab') == 'parent0') {
      var index = tabArr.findIndex(item => item.tabID === "parent0");
      tabArr.splice(index, 1);
      window.localStorage.removeItem('tabs');
      window.localStorage.setItem('tabs', JSON.stringify(tabArr));
    }
    /**
     * Whenever tab is closed then we delete the value from TabHash and TabsOpen list
     */
    let hash= sessionStorage.getItem('TabHash');
    let tabs = JSON.parse(localStorage.getItem('TabsOpen')||'{}');
    delete tabs[hash];
    localStorage.setItem('TabsOpen',JSON.stringify(tabs));
    /** We fetch the next tab details in the tabsopen list and post it across tabs using broadcast */
    let allTabs = localStorage.getItem('TabsOpen');
    let tabHash = allTabs.split(/,/);
    let parsedHash = tabHash[0].split(/{/);
    /** Here we are broadcasting across tabs stating that main tab is closed and this message needs to be broadcasted 
     * to all other tabs
     */
    let postMsg = {
      message: 're-register-needed',
      hashMsg: parsedHash[1]
    }
    channel.postMessage(postMsg);
  }

  function sendAutoRegistration(username) {
    if(userState.user !== null)
      for(var x=0; x<configArray.length; x++){
        /**
         * Read through the config object and send registration to each user if autoregistration is enabled
         */
         const sipAccountInfo = {
          'userName': configArray[x].Username,
          'authUser': configArray[x].Username,
          'sipdomain': configArray[x].Domain,
          'domain': configArray[x].HostServer + ":" + configArray[x].Port,
          'displayname': configArray[x].DisplayName,
          'secret': configArray[x].Password,
          'accontName': configArray[x].Username,
          'sipUri':"wss://" + configArray[x].Username + "@" + configArray[x].Domain+ ":" + configArray[x].Port,
          'security': configArray[x].Security,
          'port': configArray[x].Port,
          'contactHost': window.localStorage.getItem('contactHost')
        }
        /**
         * If already registered then do not send register and also check if the tab is master or slave
         * if slave then do not send autoregistration
         */
        if(window.localStorage.getItem('registeredUsers') !== null){
            const userObject = JSON.parse(window.localStorage.getItem('registeredUsers'));
            if(userObject.some(item => item.phoneName == configArray[x].Username)){

            } else {
              
              if(configArray[x].AutoRegistration && configArray[x].Username == username){
                  exWebClient.DoRegister();
                  break;
              } else if(!configArray[x].AutoRegistration){

              }else {
                  exWebClient.DoRegister();
              }
            }
        }else {
          if(configArray[x].AutoRegistration && configArray[x].Username == username){
              console.log("Sending registration request only for "  + sipAccountInfo['userName'])
              exWebClient.DoRegister();
            break;
            } else if(!configArray[x].AutoRegistration){
              console.log("Auto registration not enabled for "  + sipAccountInfo['userName'])
            }else {
              console.log("Sending registration request to sdk for "  + sipAccountInfo['userName'])
              exWebClient.DoRegister();
            }
        }
       
      }
  }

 function sendDiagnosticsRequest() {
    console.log("Start Network Diagnostics ..")
    /* TODO: The dictionary is reset because of refresh. */
    initialise_callbacks()
    exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback);
    var msg = exWebClient.startNetworkDiagnostics()
    return msg;
 }

 function initialise_callbacks() {
    update_sipAccountInfo();
    console.log("Initialising Webrtc\n")
    exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback);
    call = exWebClient.getCall()
}

  useEffect(() => {
    if (!configUpdated) {
      try {
        initialise_callbacks();
        setConfigUpdated(true);  
      } catch (e) {
        console.log("Cannot initialize callbacks for json ", userState.configObj)
      }
    }

    /** In case if there are no tabs mentioned in the localstorage then save this as original tab */
    console.log('setting activeSessionTab..............' + window.localStorage.getItem('tabs'))
    const tabs = JSON.parse(window.localStorage.getItem('tabs'));
    var index = -1
    if(tabs !== null){
      index = tabs.findIndex(item => item.tabID === "parent0");
    }
    
    if((window.localStorage.getItem('tabs') == null && window.localStorage.getItem('tabs') == undefined) || index == -1 ){
        const tabData = {
          tabID: 'parent0',
          tabType: 'parent',
          tabStatus: 'active'
        }
        /** Add the tabs dictionary into localstorage */
        const tabArr = [];
        tabArr.push(tabData);
        window.sessionStorage.setItem('activeSessionTab', 'parent0');
        window.localStorage.setItem('tabs', JSON.stringify(tabArr));
    } else if(tabs.length == 1 && tabs[0].tabID == "parent0"){
      sessionStorage.setItem('activeSessionTab', 'parent0');
    }
    /**
     * Fetch the added phone detail from REST api here, for now fetch from localstorage
     */
    if(window.localStorage.getItem('phoneData')!== null){
        const phoneObj = JSON.parse(window.localStorage.getItem('phoneData'));
        setPhoneName(phoneObj.username);
    }

    const tabInfo = FetchTabInfo(window.sessionStorage.getItem('activeSessionTab'))
    if(tabInfo !== null){
      setTimeout(() => {
        if(window.sessionStorage.getItem('activeSessionTab') == "parent0"){
          console.log('If active tab is master only then send auto registration')
            sendAutoRegistration();
        }
      }, 3000) 
    }
    exWebClient.SessionListener();
    call = exWebClient.getCall();
  },[configUpdated])

  /**
   * Customized switch for register
   */
  const MySwitch = withStyles({
    switchBase: {
        color: "white",
        opacity: 0.8,
        "&$checked": {
            color: "white",
            opacity: 1
        },
        "&$checked + $track": {
            backgroundColor: "green",
            opacity: 1
        },
        "&.MuiSwitch-colorSecondary.Mui-disabled + .MuiSwitch-track": {
            backgroundColor: "black"
        }
    },
    checked: {},
    track: {}
})(Switch);

  const menuId = 'primary-search-account-menu';

  const handleRegister = (event) => {
    /** Check if the user is already added into the register or not then decide 
     * whether register or unregister to be sent
     */

    /**
     * Create a register phone object with the phone number, accountSID, domain,username & pwd
     */

    const configObj = JSON.parse(userState.configObj);
    var index = -1;
    var filteredObj = configObj.find(function(item, i){
      if(item.Username === phoneName){
        index = i;
        return i;
      }
    });
    let wssport = configObj[index].Port;
    /**
     * generate a config object and pass as parameter for SIP registration
     */
    const sipAccountInfo = {
          'userName': event.target.value,
          'authUser': configObj[index].Username,
          'sipdomain': configObj[index].Domain,
          'domain': configObj[index].HostServer + ":" + wssport,
          'displayname': configObj[index].DisplayName,
          'secret': configObj[index].Password,
          'accontName': event.target.value,
          'sipUri':"wss://" + configObj[index].Username + "@" + configObj[index].Domain+ ":" + wssport,
          'security': configObj[index].Security,
          'port': wssport,
          'contactHost': window.localStorage.getItem('contactHost')
      }
    /**
     * look for the name in userState.userObj object, if it exists then it means user is registered else unregistered
     */
    let regUsers = userState.userObj;
    if(regUsers !== undefined && regUsers.length !== 0){
        /**
         * Check if the userObj contains the agentPhone
         */
        let userObj = JSON.parse(window.localStorage.getItem('registeredUsers'));
        if(userObj.some(item => item.phoneName == event.target.value)) {
            /**
             * Send de-register to the number
             */
             let user_data = {
                phoneName:event.target.value,
                phoneNumber:event.target.value,
            }
            exWebClient.UnRegister();
            dispatch({type:'DE_REGISTERED_SUCCESSFULLY', payload:user_data})
        } else {
            /**
             * Send register
             */
             exWebClient.DoRegister();
              /**
                 * As dummy redux, store the state in reducer, pass the whole object into redux
                 */
               let user_data = {
                phoneName:event.target.value,
                phoneNumber:event.target.value,
            }
            //dispatch({type:'REGISTERED_SUCCESSFULLY', payload:user_data})
        }
    } else {
        /**
         * Send register
         */
         exWebClient.DoRegister();
          /**
             * As dummy redux, store the state in reducer, pass the whole object into redux
             */
           let user_data = {
            phoneName:event.target.value,
            phoneNumber:event.target.value,
        }
        //dispatch({type:'REGISTERED_SUCCESSFULLY', payload:user_data})
    }
};

 /**
     * Whenever there is a change in registration state of any phone, this will be triggered
     * @param {event} state 
     */
  function RegisterEventCallBack (state, phone){
    /**
     * Based on the status of the state received against the agent phone, store the data into redux
     */
    console.log('Register event state.......', state, 'for number...', phone)
    if(state == "registered") {
        /**
         * Call the reducer function and store the details into the state obj
         */
        const user_data = {
            'phoneName': phone,
            'state': state
        };
        /**
         * Store into redux only if registration is successful
         */
        dispatch({type:'REGISTERED_SUCCESSFULLY', payload: user_data})
    } else {
      /**
       * If client gets de-registered
       */
      const user_data = {
        'phoneName': phone,
        'state': state
      };
        dispatch({type:'REGISTERED_UNSUCCESSFULLY', payload: user_data});
    }
};


var dataString
var myapiKey='73939b66be5f60af65dd06394cb8c25ae3f6f662a5827622'
var myapitoken='b24e0268db4cd021c69f18acd5cab322da20400912d167c5'
var mysubdomain='api.us3.qaexotel.com'
var mysid='ccplexopoc1m'
var myUrl = 'https://' + mysubdomain + '/v1/Accounts/' + mysid + '/Calls/connect/'
//var myUrlWithAuth = 'https://' + myapiKey + ':' + myapitoken + '@' + mysubdomain + '/v1/Accounts/' + mysid + '/Calls/connect/'

function makeCallAxios() {
  alert("Axios Call to " + outgoingNumber)
  var formJson = {
    'Url': 'http://my.exotel.com/' + mysid + '/exoml/start_voice/3515',
    'To': outgoingNumber,
    'CallerId': '08037071600'
  }  

  const headers = {
    'Authorization':'Basic ' + btoa(myapiKey + ':' + myapitoken),
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
   }


  axios.post(myUrl, formJson, { headers })
    .then(response => response.json())
    .then(result => {
      console.log('Success:', result);
    }).catch(error => {
      console.error('Error:', error);
    });    

}

function makeCall() {
    alert("Fetch Call to " + outgoingNumber)
    var formJson = {
      'Url': 'http://my.exotel.com/' + mysid + '/exoml/start_voice/3515',
      'To': outgoingNumber,
      'CallerId': '08037071600'
    }



    fetch(myUrl, {
      method: 'POST',
      credentials: 'include', // include, *same-origin, omit 
      referrerPolicy: 'same-origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url  
      //mode: 'no-cors', // no-cors, *cors, same-origin
      //cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      //redirect: 'follow', // manual, *follow, error
      headers: {
       'Authorization':'Basic ' + btoa(myapiKey + ':' + myapitoken),
       'Access-Control-Allow-Credentials': true,
       'Access-Control-Allow-Origin': '*',
       'Content-Type': 'application/json',
       'Accept': 'application/json',
       'X-PINGOTHER': 'pingpong'
      },      
      body: JSON.stringify(formJson)
    })
    .then(response => response.json())
    .then(result => {
      console.log('Success:', result);
    })
    .catch(error => {
      console.error('Error:', error);
    });    

  }

  function setOutgoingNumber(e) {
    setOutgoing(e.target.value) 
  }


const handleDiagnosticsOpsStart = (e) => {
  console.log("Stopping speaker test .... \n")
  exWebClient.stopSpeakerDiagnosticsTest()
  exWebClient.stopMicDiagnosticsTest()
  resetDiagnosticValues();
  handleDiagnosticsOps();  
  //sendDiagnosticsRequest();  
}

const handleDiagnosticsDevicesStart  = (e) => {
  console.log("handleDiagnosticsDevicesStart: Stopping speaker test .... \n")
  exWebClient.stopSpeakerDiagnosticsTest()
  console.log("handleDiagnosticsDevicesStart: Stopping mic test .... \n")
  exWebClient.stopMicDiagnosticsTest()
  console.log("Starting device diagnostics tests ...")
  minMicStatus = 0;
  minSpeakerStatus = 0;
  maxMicStatus = 0;
  maxSpeakerStatus = 0;
  lastSpeakerTime = 0.0
  lastMicTime = 0.0
  window.localStorage.setItem("micValue", 0);    
  window.localStorage.setItem("micDescr", "");            
  window.localStorage.setItem("speakerValue", 0);    
  window.localStorage.setItem("speakerDescr", "");            
  exWebClient.startMicDiagnosticsTest()
}

const handleStopSpeakerTestSuccess = (e) => {
  console.log("handleStopSpeakerTestSuccess: Stopping speaker test .... \n")
  exWebClient.stopSpeakerDiagnosticsTest('yes')
  setSpeakerResponse("Yes")
  takeScreenShotDirect(diagnosticsDeviceImageRef.current).then((url) => {
    setDeviceImageUrl(url);    
    hideDiagnosticsCanvas();
  });
  handleDiagnosticsOpsStart();
}

const handleStopSpeakerTestFailure = (e) => {
  console.log("handleStopSpeakerTestFailure: Stopping speaker test .... \n")
  exWebClient.stopSpeakerDiagnosticsTest('no')
  setSpeakerResponse("No")
  handleDiagnosticsOpsStart();  
}

const handleStopMicTestSuccess = (e) => {
  console.log("handleStopMicTestSuccess: Stopping mic test .... \n")
  exWebClient.stopMicDiagnosticsTest('yes')
  exWebClient.startSpeakerDiagnosticsTest()
  setMicResponse("Yes")
}

const handleStopMicTestFailure = (e) => {
  console.log("handleStopMicTestFailure: Stopping mic test .... \n")
  exWebClient.stopMicDiagnosticsTest('no')
  exWebClient.startSpeakerDiagnosticsTest()
  setMicResponse("No")
}

const handleDiagnosticsReportCancel = (e) => {
  removeDiagnosticsCanvas();
  window.location.href = window.location.pathname; 
  window.localStorage.setItem("speakerValue", 0);    
  window.localStorage.setItem("speakerDescr", ""); 
  window.localStorage.setItem("speakerValue", 0);    
  window.localStorage.setItem("speakerDescr", ""); 
  exWebClient.stopMicDiagnosticsTest()  
  exWebClient.startSpeakerDiagnosticsTest()  
}

const handleRestartSpeaker = e => {
  console.log("handleRestartSpeaker: Stopping speaker test .... \n")
  exWebClient.stopSpeakerDiagnosticsTest()
  console.log("handleRestartSpeaker: Starting speaker test .... \n")
  exWebClient.startSpeakerDiagnosticsTest()
};

const handleRestartMic = e => {
  console.log("handleRestartMic: Stopping mic test .... \n")
  exWebClient.stopMicDiagnosticsTest()
  console.log("handleRestartMic: Starting mic test .... \n")
  exWebClient.startMicDiagnosticsTest()
};


const handleDiagnosticsReportSend = async (isScreenCapture) => {

  console.log("handleDiagnosticsReportSend: Download files as blobs, screen capture: ", isScreenCapture)
  let b1;
  let b2;
  let b3;
  let b4;

  let f1 = "Diagnostics.txt"
  let f2 = "DiagnosticsComments.txt"
  let f3 = "DiagnosticsNet.jpeg"
  let f4 = "DiagnosticsDevices.jpeg"
  
  // use a BlobWriter to store with a ZipWriter the zip into a Blob object
  const blobWriter = new zip.BlobWriter("application/zip");
  const writer = new zip.ZipWriter(blobWriter);


  var troubleShootLogs;

  try {
    troubleShootLogs = window.localStorage.getItem('troubleShootReport')
    setTroubleshootReport(window.localStorage.getItem('troubleShootReport'))
  } catch {
    troubleShootLogs = "Cannot find troubleshoot report"
  }  

  try {
    b1  = new Blob([troubleShootLogs], {type: "text/plain"});

    try {
        await writer.add(f1, new zip.BlobReader(b1));

        console.log(" File " + f1 + " added to zip file");

    } catch {
        console.log(" File " + f1 + " could not be added to zip file blob ");
    }
  } catch {
    console.log(" File " + f1 + " could not be added to zip file blob - File Empty");
  }

  try {
    b2 = new Blob([commentsRef.current.value], {type: "text/plain"});

    try {
      await writer.add(f2, new zip.BlobReader(b2))
      console.log(" File " + f2 + " added to zip file");
    } catch {
        console.log(" File " + f2 + " could not be added to zip file blob ");
    }
  } catch {
    console.log(" File " + f2 + " could not be added to zip file blob - File Empty");
  }
  
  if (!isScreenCapture) {
    await writer.close();
    try {
      let blob =  blobWriter.getData();
      // save with Zip File
      downloadZipImageAsBlob(URL.createObjectURL(blob));
    } catch {
      console.log("handleDiagnosticsReportSend: Download the zipfile, failed, downloading individual files")
      downloadDiagTroubleshootlogs(f1)
      downloadDiagComments(f2)
    }    
  } else {

      await fetch(diagnosticsNetImageUrl).then(function(r) { 
        r.blob().then(async function(b) {
          b3 = b;
          try {
            await writer.add(f3, new zip.BlobReader(b3))
            console.log(" File " + f3 + " added to zip file");
          } catch {
            console.log(" File " + f3 + " could not be added to zip file");
          }
        });
      });

      await fetch(diagnosticsDeviceImageUrl).then(function(r) { 
        r.blob().then(async function(b) {
        b4 = b;
        try {
            await writer.add(f4, new zip.BlobReader(b4));
            console.log(" File " + f4 + " added to zip file");
            await writer.close();
            // close the writer
            try {
              let blob =  blobWriter.getData();
              // save with Zip File
              downloadZipImageAsBlob(URL.createObjectURL(blob));
            } catch {
              console.log("handleDiagnosticsReportSend: Download the zipfile, failed, downloading individual files")
              downloadNetworkImage(diagnosticsNetImageUrl)
              downloadDeviceImage(diagnosticsDeviceImageUrl)
              downloadDiagTroubleshootlogs(f1)
              downloadDiagComments(f2)
            }
        } catch {
            console.log(" File " + f4 + " could not be added to zip file");
            // close the writer
            console.log("handleDiagnosticsReportSend: Zip the blobs")
            await writer.close()
            try {
              let blob =  blobWriter.getData();
              // save with Zip File
              console.log("handleDiagnosticsReportSend: Download the zipfile")
              downloadZipImageAsBlob(URL.createObjectURL(blob));
            } catch {
              console.log("handleDiagnosticsReportSend: Download the zipfile, failed, downloading individual files")
              downloadNetworkImage(diagnosticsNetImageUrl)
              downloadDeviceImage(diagnosticsDeviceImageUrl)
              downloadDiagTroubleshootlogs(f1)
              downloadDiagComments(f2)          
            }
        }
      });
      });
  }


  console.log("handleDiagnosticsReportSend: Zip completed")
}

function resetDiagnosticValues()
{
  window.localStorage.setItem('udp', '');
  window.localStorage.setItem('tcp', '');
}

var textFile = null;


function makeTextFile (text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    return textFile;
};  

const handleDiagnosticsOpsSaveLogs = (e) => {
  e.preventDefault();
  const configData = {
  }
  
  const data = {
      configData: configData,
  }

  exWebClient.stopSpeakerDiagnosticsTest()
  exWebClient.stopMicDiagnosticsTest()

  takeScreenShotDirect(diagnosticsNetImageRef.current).then((url) => {
    setDiagImageUrl(url)
    setNetImageUrl(url);
    hideDiagnosticsCanvas();
  });

  handleDiagnosticsReport();
}


const handleDiagnosticsDevicesSaveLogs = (e)  => {
  e.preventDefault();
  const configData = {
  }
  
  const data = {
      configData: configData,
  }

  exWebClient.stopSpeakerDiagnosticsTest()
  exWebClient.stopMicDiagnosticsTest()

  takeScreenShotDirect(diagnosticsDeviceImageRef.current).then((url) => {
    setDiagImageUrl(url)
    setDeviceImageUrl(url);  
    hideDiagnosticsCanvas();
  });

  handleDiagnosticsReport();
}

  function renderPhoneLogin (){
      return  (
        <Grid container>
          {/** if user has added phone already then display nav bar else display login */}
          <Menu
          anchorEl={anchorPhoneLoginEl}
          id={menuId}
          keepMounted={false}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          className={classes.menu}
          open={isPhoneLogin}
          onClose={handlePhoneLoginClose}
          classes={{ paper: (phoneName == '')? null : classes.menuPaper }}
          style={{marginTop: 60}}>
          <Card elevation={0} className={classes.navBarCard}>
                      {(() => {
                                if(userState.userObj !== undefined && userState.userObj.length !== 0){
                                    let userObj = JSON.parse(window.localStorage.getItem('registeredUsers'));
                                    if(userObj !== null && userObj.some(val => val.phoneName == phoneName)){
                                        return(
                                          /* Did not work outside grid  */
                                          /* Did not work inside grid also */
                                          
                                          
                                          <div>
                                          <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start">
                                            <MySwitch value={phoneName} checked={true} color='secondary' onChange={handleRegister} />
                                            <Typography className={classes.options} style={{ marginLeft: 10 }}>Unregister</Typography>
                                          </Grid>
                                          {(window.localStorage.getItem('outgoingEnabled') == false || window.localStorage.getItem('outgoingEnabled') == null || window.localStorage.getItem('outgoingEnabled') == undefined)?
                                          null :
                                          <div>
                                          <input id="ocallNumber" name="ocallNumber" label="Outlined"  type="text"
                                          value={outgoingNumber} onChange={setOutgoingNumber} 
                                          variant="outlined" />                                            
                                          <Button id="ocallBtn1" label="Call1" onClick={makeCall}> Fetch Call </Button>                                            
                                          &nbsp;
                                          <Button id="ocallBtn2" label="Call2" onClick={makeCallAxios}> Axios Call </Button> 
                                          </div>
                                          }
                                                                                     

                                          </div>
                                          
                                          
                                                                                      
                                        )
                                    } else {
                                        return(

                                          
                                          <div>
                                          
                                          <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start">
                                            <MySwitch value={phoneName} checked={false} color='secondary' onChange={handleRegister} />
                                            <Typography className={classes.options} style={{ marginLeft: 10 }}>Register</Typography>
                                          </Grid>

                                          {(window.localStorage.getItem('outgoingEnabled') == false || window.localStorage.getItem('outgoingEnabled') == null || window.localStorage.getItem('outgoingEnabled') == undefined)?
                                          null :
                                          <div>
                                          <input id="ocallNumber" name="ocallNumber" label="Outlined"  type="text"
                                          value={outgoingNumber} onChange={setOutgoingNumber} 
                                          variant="outlined" />                                            
                                          <Button id="ocallBtn1" label="Call1" onClick={makeCall}> Fetch Call </Button>                                            
                                          &nbsp;
                                          <Button id="ocallBtn2" label="Call2" onClick={makeCallAxios}> Axios Call </Button> 
                                          </div>
                                          }                                           

                                          </div>
                                    )
                                    }
                                } else {
                                    return(


                                        <Grid container direction="row" alignItems="flex-start" justifyContent="flex-start">
                                          {/** If configData is missing then disable the button */}

                                          <MySwitch value={phoneName} disabled={(userState.configObj.length == 0) ? true : false} checked={false} color='secondary' onChange={handleRegister} />
                                          <Typography className={classes.options} style={{ marginLeft: 10, color: (userState.configObj.length === 0) ? 'gray' : '#2194FF' }}>Register</Typography>
                                        </Grid>
                                        )
                                        }
                                        })()}
                                      </Card>
          </Menu>
          </Grid>
      )
  }

  
  function isFlagSet(flagStr) {
    return window.localStorage.getItem(flagStr);
  }

  function  closeAllDiagnostics() {
    removeDiagnosticsCanvas();
    setDiagnosticsReport(false);
    setDiagnosticsOps(false);
    setDiagnosticsDevices(false);
    setDiagnosticsAsk(false);
    window.location.href = window.location.pathname; 
    window.localStorage.setItem("speakerValue", 0);    
    window.localStorage.setItem("speakerDescr", ""); 
    window.localStorage.setItem("speakerValue", 0);    
    window.localStorage.setItem("speakerDescr", ""); 
    exWebClient.stopMicDiagnosticsTest()  
    exWebClient.startSpeakerDiagnosticsTest()          
  }

  var hideUsers =  isFlagSet('hideUsers');
  var hideDiagnostics = isFlagSet('hideDiagnostics');
  var hideConfig = isFlagSet('hideConfig');
  var hideLogout = isFlagSet('hideLogout');

  /**
   * Renders all the phones pre configured in phone.json
   */
  const phones = data.map((value) => {

    return(
      <Grid container>
          {(userState.user == value.agentName)?


        <Grid container
          alignItems="center"
          justifyContent="center"
          direction="row" style={{flexWrap: 'nowrap' }}>


            {(hideUsers) ?  null:
            configArray.map((uas) => {
              return(
              <Grid  key={uuid()} item xs={10} lg={4} sm={4}>
                <IconButton style={{margin: '30px'}} aria-label="settings button" name={uas.Username} onClick={handlePhoneLogin}>
                  <PhoneIcon style={{color: '#2194FF'}} />
                </IconButton>
                <Typography style={{fontSize:11, color:'#2194FF'}}>
                  {uas.Username}
                </Typography>
            </Grid>
              )
            })}
            

          {(hideConfig)? null:
          <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleConfig}
              color="inherit"
            >
              <SettingsIcon style={{color:'#2194FF',marginRight:10}}/>
            </IconButton> }


            {(hideDiagnostics)?   null:
            <IconButton
              edge="end"
              aria-label="diagnosticsask"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleDiagnosticsAsk}
              color="inherit"
            >
            <DiagnosticsIcon style={{color:'#2194FF',marginRight:10}}/>
              
            </IconButton>}

            {(hideLogout)? null:    
            <Button aria-label="login-button" color="inherit" className={classes.button} onClick={handleLogout}>
              Logout
            </Button>}

        </Grid>
        :null
        }
        </Grid>
    )
  });

  const action = (
    <div>
      
    <Button style={{background:'white', color:'#E57373', textTransform:'none', margin:10}} onClick={function(){
      channel.postMessage("accept")
    }}>
      <Grid container
        direction="row">
        <CallIcon style={{marginTop:4, color:'green'}} />
            <Typography style={{fontSize:13, margin: 8}}>
                Accept
            </Typography>
      </Grid>
    </Button>
    <Button style={{background:'white', color:'#E57373', textTransform:'none'}} onClick={function(){
      channel.postMessage('reject')
      sessionCallback.initializeSession('callEnded', '');
      sessionCallback.triggerSessionCallback();
    }}> 
     <Grid container
    direction="row">
      <Cancel style={{marginTop:4,fontSize:25,fontWeight:'bold', color:'#E57373'}}/>
          <Typography style={{fontSize:13, margin: 8}}>
              Reject
          </Typography>
    </Grid>
    </Button>
    </div>
  )

  return (
    <div className={classes.grow}>
      {(userState.user !== null)?
      <div>
      <div position="sticky" className={classes.appbar}>
      <Toolbar>
        <div className={classes.grow} />
        {/** If user is logged in then display a phone button by fetching from JSON and add button */}
          <div className={classes.sectionDesktop}>
             <Grid container
              direction="row"> 
            {phones}
            </Grid>
          </div>
      </Toolbar>
    </div>
    </div>:
    <div>
     <Button aria-label="login-button" color="inherit" className={classes.button} onClick={handleLogin}>
     Dialer Login
</Button>
</div>
      }
      
      {(openLogin)?
      <div ref={imageRef}>
        {console.log(openLogin)}
          <LoginView handleLogin={handleLogin}/>
          </div>:null}
      {(isPhoneLogin)?
      <div ref={imageRef}>{renderPhoneLogin()}</div>:null}
      {(openConfig)?
        <div ref={imageRef}>
          <ConfigPopup/>
          </div>:null}
      {(openDiagnosticsAsk)?
        <div ref={imageRef}>
          <DiagnosticsAskPopup handleDiagnosticsAskSubmit={handleDiagnosticsDevices}  handleDiagnosticsAskClose={closeAllDiagnostics}/>
        </div>:null}    
      {(openDiagnosticsOps)?
        <div ref={imageRef}>
          <DiagnosticsView 
          diagnosticsNetImageRef = {diagnosticsNetImageRef}
          handleDiagnosticsOpsBack={handleDiagnosticsDevices}
          handleDiagnosticsOpsRetest={handleDiagnosticsOpsStart}
          handleDiagnosticsOpsSaveLogs={handleDiagnosticsOpsSaveLogs}/>
        </div>:null}   
        {(openDiagnosticsDevices)?
        <div ref={imageRef}>
          <DiagnosticsDevices 
          diagnosticsDeviceImageRef = {diagnosticsDeviceImageRef}
          micValue={micValue}
          speakerValue={speakerValue}
          micUserResponse={micUserResponse}
          speakerUserResponse={speakerResponse}
          handleDiagnosticsDevicesSkip={handleDiagnosticsOpsStart}
          handleDiagnosticsDevicesRetest={handleDiagnosticsDevicesStart}
          handleDiagnosticsDevicesSaveLogs={handleDiagnosticsDevicesSaveLogs}
          handleStopSpeakerTestSuccess={handleStopSpeakerTestSuccess}
          handleStopSpeakerTestFailure={handleStopSpeakerTestFailure}
          handleStopMicTestSuccess={handleStopMicTestSuccess}
          handleStopMicTestFailure={handleStopMicTestFailure}
          handleRestartSpeaker={handleRestartSpeaker}
          handleRestartMic={handleRestartMic}
          />
        </div>:null}    
        {(openDiagnosticsReport)?
        <div ref={imageRef}>
          <DiagnosticsReport 
          imageUrl={imageUrl}
          commentsRef={commentsRef}
          troubleShootReport={troubleShootReport}
          handleDiagnosticsReportCancel={handleDiagnosticsReportCancel}
          handleDiagnosticsReportSend={handleDiagnosticsReportSend}/>
        </div>:null}                                   
      {/** On call open the modal for notification */}
      <Draggable  component="span">
      <Snackbar
                open={openDialer}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                <SnackbarContent 
                  style={{backgroundColor:'#BDBDBD', marginBottom: 30}}
                  action={ModalView(handleDialerClose,handleCall, callObj, '', call, client, exWebClient)}/>
        </Snackbar>
        </Draggable>
        <Draggable  component="span">
        <Snackbar
                open={callDialer}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                >
                  
                <SnackbarContent 
                  style={{backgroundColor:'#616161', marginBottom: 30}}
                  action={DialPad(handleCallDialerClose, callObj, callerState, call, client,exWebClient)}/>
        </Snackbar>
      </Draggable>
      <Snackbar
        open={open}
        autoHideDuration={6000}
        >
         <SnackbarContent
          style={{backgroundColor:'#E57373', marginBottom: 30, color:'white'}}
          message={callMessage}
          action={action}/>
         </Snackbar>
    </div>
  );
}

