import './App.css';
import data from './phone.json';
import React, { useEffect, useRef} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import { styled } from '@mui/material/styles';
import { ExotelWebClient} from '@exotel-npm-dev/webrtc-client-sdk';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  boxShadow: "none"
}));

var unregisterWait = "false";

function App() {
  const [phone, setPhoneData ] = React.useState('');
  const [tabValue, setTabValue] = React.useState(0);
  const [ registrationData, setRegistrationData ] = React.useState("Not Registered");
  const [ diagnosticsValue, setDiagnostics ] = React.useState("Diagnostics Info");
  const [ diagnosticsLogsData, setDiagnosticsLogs ] = React.useState("Diagnostics Logs");
  const [ diagnosticsSpeakerValue, setDiagnosticsSpeakerValue ] = React.useState("");
  const [ diagnosticsMicValue, setDiagnosticsMicValue ] = React.useState("");
  const [ diagnosticsWssValue, setDiagnosticsWssValue ] = React.useState("");
  const [ diagnosticsTcpValue, setDiagnosticsTcpValue ] = React.useState("");
  const [ diagnosticsUdpValue, setDiagnosticsUdpValue ] = React.useState("");
  const [ diagnosticsHostValue, setDiagnosticsHostValue ] = React.useState("");
  const [ diagnosticsReflexValue, setDiagnosticsReflexValue ] = React.useState("");
  const [ diagnosticsRegValue, setDiagnosticsRegValue ] = React.useState("");
  const [ rows, setRows ] = React.useState([]);
  const [ configUpdated, setConfigUpdated ] = React.useState(false);
  const [ callInfo, setCallInfo ] = React.useState("No Call Info");
  const [ callObject, setCallObject ] = React.useState("");
  const [ callEvent, setCallEvent ] = React.useState("");
  const [ callFrom, setCallFrom ] = React.useState("");
  const [ call, setCall ] = React.useState("");
  const [ regState, setRegState ] = React.useState(false);
  const [ diagState, setDiagState ] = React.useState(false);
  const [ diagMicTestState, setMicTestState ] = React.useState(false);
  const [ diagSpeakerTestState, setSpeakerTestState ] = React.useState(false);
  const [ diagNWTestState, setNWTestState ] = React.useState(false);
  const [ callState, setCallState ] = React.useState(false);
  const [ callComing, setCallComing ] = React.useState(false);
  
  //var speakerValue = 0.0;
  //var micValue = 0.0;
  var lastSpeakerTime = 0.0;
  var lastMicTime = 0.0;
  

  var sipAccountInfo= {
    'userName':  data[0].Username,
    'authUser': data[0].Username,
    'sipdomain': data[0].Domain,
    'domain': data[0].HostServer + ":" + data[0].Port,
    'displayname': data[0].DisplayName,
    'secret': data[0].Password,
    'port': data[0].Port,
    'security': data[0].Security,
    'endpoint': data[0].EndPoint,
    'apikey': data[0].ApiKey,
    'apitoken': data[0].ApiToken,
    'vitualnumber': data[0].VirtualNumber
  };
  
  var registrationRef = useRef(null);
  var callRef = useRef(null);
  var diagnosticsRef = useRef(null);
  var diagnosticsLogsRef = useRef(null);
  var diagnosticsSpeakerRef = useRef(null);
  var diagnosticsMicRef = useRef(null);
  var diagnosticsWssRef = useRef(null);
  var diagnosticsRegRef = useRef(null);
  var diagnosticsTcpRef = useRef(null);
  var diagnosticsUdpRef = useRef(null);
  var diagnosticsHostRef = useRef(null);
  var diagnosticsReflexRef = useRef(null);
  var makeCallRef = useRef(null);
  var exWebClient = new ExotelWebClient();
  var configRefs = {
    'Username':useRef(null),
    'DisplayName':useRef(null),
    'HostServer': useRef(null),
    'Domain':useRef(null),
    'Port':useRef(null),
    'Password':useRef(null),
    'CallTimeout':useRef(null),
    'AccountSID':useRef(null),
    'AccountNo': useRef(null),
    'AutoRegistration':useRef(null)
  }

  useEffect(() => {
    if (!configUpdated) {
      setPhoneData(data[0]);   
      setConfigUpdated(true);         
    }
  }, [configUpdated]);


  /* APIs and Callbacks for webrtc-sdk */
  function updateConfig() {
    setPhoneData(data[0]);   
    setConfigUpdated(true);    
  }

  function CallListenerCallback(callObj, eventType, phone) {
    setCallInfo('Call Listener\n Message:' + JSON.stringify(callObj) + '\n EventType:' + eventType + '\n Phone:' + phone) 
    setCallObject(callObj)   
    setCallEvent(eventType)
    setCallFrom(phone)
    setCall(exWebClient.getCall())
    if (eventType === 'incoming') {
      setCallComing(true)
    }  else if (eventType === 'connected') {
      setCallComing(false)
      setCallState(true)
    }  else if (eventType === 'callEnded') {
      setCallComing(false)
      setCallState(false)
    } else if (eventType === 'terminated') {
      setCallComing(false)
      setCallState(false)
    }
  }

  function RegisterEventCallBack (state, phone){
    /**
     * Based on the status of the state received against the agent phone, store the data into redux
     */
     if (unregisterWait === "false") {
    setRegistrationData('Register:\n State:' + state + '\n User:' + phone)   
     } else {
    setRegistrationData('UnRegister:\n State:' + state + '\n User:' + phone)   
     }
    if (state === 'registered') {
      unregisterWait = "false";
      setRegState(true)
    } else if (state === 'unregistered') {
      setRegState(false)
    } else if (state === 'connected') {
      unregisterWait = "false";
      setRegState(true)
    }  else if (state === 'terminated')  {
      setRegState(false)
    } else if (state === 'sent_request')  {
      if (unregisterWait === "true") {
        unregisterWait = "false";
        setRegState(false)
      }
    }
  }

  function SessionCallback(state, phone) {
    /**
     * SessionCallback is triggered whenever the state of application changes due to an incoming call
     * which needs to be handled across tabs
     */
     console.log('Session state:', state, 'for number...', phone);    
 }

  function initialise_callbacks() {
    if (configUpdated) {
      sipAccountInfo['userName'] = phone.Username;
      sipAccountInfo['authUser'] = phone.Username;
      sipAccountInfo['sipdomain'] = phone.Domain;
      sipAccountInfo['domain'] =  phone.HostServer + ":" + phone.Port;
      sipAccountInfo['displayname'] = phone.DisplayName;
      sipAccountInfo['secret'] = phone.Password;
      sipAccountInfo['port'] = phone.Port;
      sipAccountInfo['security'] = phone.Security;
      sipAccountInfo['endpoint'] = phone.EndPoint;
      sipAccountInfo['apikey'] = phone.ApiKey;
      sipAccountInfo['apitoken'] = phone.ApiToken;
      sipAccountInfo['virtualnumber'] = phone.VirtualNumber;
      exWebClient.initWebrtc(sipAccountInfo, RegisterEventCallBack, CallListenerCallback, SessionCallback)
    }  
  }


  /* UI update functions */
  function createData(
    configparam: string,
    configvalue: number,
  ) {
    return { configparam, configvalue };
  }



  function updateTable() {
    var newRows = [];
    newRows.push(createData('Username', phone.Username))
    newRows.push(createData('DisplayName', phone.DisplayName))
    newRows.push(createData('HostServer', phone.HostServer))
    newRows.push(createData('Domain', phone.Domain))
    newRows.push(createData('Port', phone.Port))
    newRows.push(createData('Password', phone.Password))
    newRows.push(createData('CallTimeout', phone.CallTimeout))
    newRows.push(createData('AccountSID', phone.AccountSID))
    newRows.push(createData('AccountNo', phone.AccountNo))
    newRows.push(createData('AutoRegistration', phone.AutoRegistration))
    newRows.push(createData('ApiKey', phone.ApiKey))
    newRows.push(createData('ApiToken', phone.ApiToken))
    newRows.push(createData('VirtualNumber', phone.VirtualNumber))
    setRows(newRows);     
  }

  function updateTableConfig() {

    unregisterHandler();

    /*console.debug("Update config to " +
    'Username:' + configRefs['Username'].current.value + "\n" +
    'DisplayName:' + configRefs['DisplayName'].current.value + "\n" +
    'HostServer:' + configRefs['HostServer'].current.value + "\n" +
    'Domain:' + configRefs['Domain'].current.value + "\n" +
    'Port:' + configRefs['Port'].current.value + "\n" +
    'Password:' + configRefs['Password'].current.value + "\n" +
    'CallTimeout:' + configRefs['CallTimeout'].current.value + "\n" +
    'AccountSID:' + configRefs['AccountSID'].current.value + "\n" +
    'AccountNo:' + configRefs['AccountNo'].current.value + "\n" +
    'AutoRegistration:' + configRefs['AutoRegistration'].current.value + "\n" );
    */

    phone.Username = configRefs['Username'].current.value;
    phone.Domain = configRefs['Domain'].current.value ;
    phone.HostServer = configRefs['HostServer'].current.value;
    phone.Port = configRefs['Port'].current.value;
    phone.DisplayName = configRefs['DisplayName'].current.value;
    phone.Password = configRefs['Password'].current.value;
    phone.AccountSID = configRefs['AccountSID'].current.value;
    phone.AccountNo = configRefs['AccountNo'].current.value;
    phone.AutoRegistration = configRefs['AutoRegistration'].current.value;
    phone.CallTimeout = configRefs['CallTimeout'].current.value;
    phone.ApiKey = configRefs['ApiKey'].current.value;
    phone.ApiToken = configRefs['ApiToken'].current.value;
    phone.VirtualNumber = configRefs['VirtualNumber'].current.value;

    registerHandler();
  }

  function makeCall() {
    if(!regState.valueOf()) {
      console.log("Cannot Make Call as reg is not done");
      return
    }
    console.log("Making Call to to: ", makeCallRef.current.value);
    var toNumber = makeCallRef.current.value;
    // callback for outboundcall
    exWebClient.makeCall(toNumber, phone)
  }

  function callDemo() {
      return (

<Grid container spacing={2}>
  <Grid item xs={6}>
    <Item>
    <Stack spacing={2}>
    <Item>
    <Input fullWidth={true} inputRef={makeCallRef} defaultValue=""></Input>
      <br></br><br></br> 
      <Button variant="outlined" onClick={makeCall}>MakeCall</Button>
    </Item>
    <Item>
    <textarea style={{ width: 400, height: 300, resize:'none' }} ref={registrationRef} value={registrationData} onChange={registrationStatusChanged}></textarea>
      <br></br>          
      {(configUpdated && !regState)?<Button variant="outlined"onClick={registerHandler}>Register</Button>:null}
      {(regState)?<Button variant="outlined"onClick={unregisterHandler}>UnRegister</Button>:null}
    </Item>
    <Item>
      <textarea style={{ width: 400, height: 300, resize:'none' }}   ref={callRef} value={callInfo} onChange={callInfoChanged}></textarea>          
      <br></br>  
      {(regState && callComing)?<Button variant="outlined"onClick={acceptCallHandler}>Accept Call</Button>:null}
      {(regState && (callState || callComing))?<Button variant="outlined"onClick={rejectCallHandler}>Reject Call</Button>:null}
      {(regState && callState)?<Button variant="outlined"onClick={muteCallHandler}>Mute Toggle</Button>:null}
      {(regState && callState)?<Button variant="outlined"onClick={holdCallHandler}>Hold Toggle</Button>:null} 
    </Item>
    </Stack>
    </Item>
  </Grid>
  </Grid>

      );
  }


  function configTable() {
    return (<TableContainer component={Paper}>
    <Table sx={{ maxWidth: 600 }} aria-label="simple table">
    <TableHead>
        <TableRow>
          <TableCell>Config Params</TableCell>
          <TableCell align="center">Config Value</TableCell>
        </TableRow>
      </TableHead>  
      <TableBody>
      {rows.map((row) => (
          <TableRow
            key={row.configparam}
          >
            <TableCell component="th" scope="row">{row.configparam}</TableCell>
            <TableCell align="center"><Input fullWidth={true} inputRef={configRefs[row.configparam]} 
            id={row.configparam} name={row.configparam}  defaultValue={row.configvalue?row.configvalue.toString():""}></Input></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Button variant="outlined" onClick={updateTableConfig}>Update</Button>
  </TableContainer>
  );
  }


  function diagnostics() {
    return(
<Grid container spacing={2}>
  <Grid item xs={12}>
  <Stack spacing={2}>
      <Item>
        <Grid container spacing={2}>
          <Grid item xs={4}>
              <textarea style={{ width: 400, height: 100, resize:'none' }} ref={diagnosticsRef} value={diagnosticsValue} onChange={diagnosticsChanged}></textarea>
              <br></br>          
              {(configUpdated && !diagState)?<Button variant="outlined"onClick={diagnosticsInitHandler}>Init Diagnostics</Button>:null}
              {(diagState)?<Button variant="outlined"onClick={diagnosticsEndHandler}>End Diagnostics</Button>:null}
          </Grid>
          {(diagState)?
          <Grid item xs={8}>
              Troubleshooting Logs
              <br></br>
              <textarea style={{ width: 800, height: 200, resize:'none' }} ref={diagnosticsLogsRef} value={diagnosticsLogsData} onChange={diagnosticsLogsChanged}></textarea>
          </Grid>
          :null}
        </Grid>
      </Item>

    {(diagState)? 
      <Item>

      <Grid item xs={16} container spacing={2}>
        <Grid  item xs={4}>
              {(diagState && !diagSpeakerTestState)?<Button variant="outlined"onClick={startSpeakerTest}>Start Speaker Test</Button>:null}
              {(diagState && diagSpeakerTestState)?<Button variant="outlined"onClick={stopSpeakerTestSuccess}>Stop Speaker Test Success</Button>:null} 
              {(diagState && diagSpeakerTestState)?<Button variant="outlined"onClick={stopSpeakerTestFailure}>Stop Speaker Test Failure</Button>:null} 
              {(diagState && diagSpeakerTestState)?<Button variant="outlined"onClick={stopSpeakerTest}>Stop Speaker Test</Button>:null} 
        </Grid>
        <Grid  item xs={4}>
              {(diagState && !diagMicTestState)?<Button variant="outlined"onClick={startMicTest}>Start Mic Test</Button>:null}
              {(diagState && diagMicTestState)?<Button variant="outlined"onClick={stopMicTestSuccess}>Stop Mic Test Success</Button>:null} 
              {(diagState && diagMicTestState)?<Button variant="outlined"onClick={stopMicTestFailure}>Stop Mic Test Failure</Button>:null} 
              {(diagState && diagMicTestState)?<Button variant="outlined"onClick={stopMicTest}>Stop Mic Test</Button>:null} 
        </Grid>
        <Grid  item xs={4}>
              {(diagState && !diagNWTestState)?<Button variant="outlined"onClick={startNwTest}>Start NW Test</Button>:null}
              {(diagState && diagNWTestState) ?<Button variant="outlined"onClick={stopNwTest}>Stop NW Test</Button>:null} 
        </Grid>
     </Grid>

      <br></br>
      
   <Grid item xs={16} container spacing={2}>
   
   <Grid  item xs={4}>
   {(diagState && diagSpeakerTestState)?<textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsSpeakerRef} value={diagnosticsSpeakerValue} onChange={diagnosticsSpeakerChanged}></textarea>:null}
   </Grid>
   
   <Grid  item xs={4}>
   {(diagState && diagMicTestState)?
      (<textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsMicRef} value={diagnosticsMicValue} onChange={diagnosticsMicChanged}></textarea>)          
      :null}
   </Grid>
   
   <Grid  item xs={4}>
   {(diagState && diagNWTestState)?
      <Grid item xs={4}>
      <Stack spacing={2}>
      <Item>WSS<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsWssRef}    value={diagnosticsWssValue}    onChange={diagnosticsWssChanged}></textarea></Item> 
      <Item>UserReg<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsRegRef}    value={diagnosticsRegValue}    onChange={diagnosticsRegChanged}></textarea></Item> 
      <Item>TCP<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsTcpRef}    value={diagnosticsTcpValue}    onChange={diagnosticsTcpChanged}></textarea></Item> 
      <Item>UDP<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsUdpRef}    value={diagnosticsUdpValue}    onChange={diagnosticsUdpChanged}></textarea></Item> 
      <Item>Host<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}   ref={diagnosticsHostRef}   value={diagnosticsHostValue}   onChange={diagnosticsHostChanged}></textarea></Item> 
      <Item>Reflex<br></br><textarea style={{ width: 400, height: 50, resize:'none' }}  ref={diagnosticsReflexRef} value={diagnosticsReflexValue} onChange={diagnosticsReflexChanged}></textarea></Item> 
      </Stack>
      </Grid>:null}
   </Grid>

   </Grid>

      </Item>
          :null}    
    </Stack>
    </Grid>    
    </Grid>       
    );
  }

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }
  
  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography component="span">{children}</Typography>
          </Box>
        )}
      </div>
    );
  }
  
  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    updateConfig();
    updateTable();
    setTabValue(newValue);
  }; 
  
/* Event Handlers */
  const registerHandler = () => {
    registrationRef.current = "Sent register request:" + phone.Username;
    setRegistrationData(registrationRef.current)

    if (!configUpdated) {
      updateConfig();
    }

    unregisterWait = "false";

    initialise_callbacks();
    console.log("App.js: Calling DoRegister")
    exWebClient.DoRegister();
    
  };

  const unregisterHandler = () => {
    registrationRef.current = "Sent unregister request:" + phone.Username;
    setRegistrationData(registrationRef.current)

    if (!configUpdated) {
      updateConfig();
    }

    initialise_callbacks();

    unregisterWait = "true";

    exWebClient.UnRegister();
  };  

  const registrationStatusChanged = () => {
    console.log("registrationStatusChanged to: ", registrationRef);
  }; 

  const diagnosticsChanged = (e) => {
    console.log("diagnosticsChanged to: ", diagnosticsRef);
  };    

  const diagnosticsLogsChanged = () => {
    console.log("diagnosticsLogsChanged to: ", diagnosticsLogsRef);
  };

  const diagnosticsSpeakerChanged = () => {
    console.log("diagnosticsSpeakerChanged to: ", diagnosticsSpeakerRef);
  }; 
  
  const diagnosticsMicChanged = () => {
    console.log("diagnosticsMicChanged to: ", diagnosticsMicRef);
  }; 
  
  const diagnosticsWssChanged = () => {
    console.log("diagnosticsWssChanged to: ", diagnosticsWssRef);
  }; 
  
  const diagnosticsTcpChanged = () => {
    console.log("diagnosticsTcpChanged to: ", diagnosticsTcpRef);
  }; 
  
  const diagnosticsUdpChanged = () => {
    console.log("diagnosticsUdpChanged to: ", diagnosticsUdpRef);
  }; 
  
  const diagnosticsHostChanged = () => {
    console.log("diagnosticsHostChanged to: ", diagnosticsHostRef);
  }; 
  
  
  const diagnosticsReflexChanged = () => {
    console.log("diagnosticsReflexChanged to: ", diagnosticsReflexRef);
  }; 

  const diagnosticsRegChanged = () => {
    console.log("diagnosticsRegChanged to: ", diagnosticsRegRef);
  }; 
  
  function acceptCallHandler() {
    console.log ("Call needs to be accepted");
    console.log ("callObject = ", JSON.stringify(callObject));
    console.log ("callEvent = ", callEvent);
    console.log ("callFrom = ", callFrom);
    call.Answer();
  }
  function rejectCallHandler() {
    console.log ("Call needs to be rejected")
    console.log ("callObject = ", JSON.stringify(callObject));
    console.log ("callEvent = ", callEvent);
    console.log ("callFrom = ", callFrom);
    call.Hangup();
  }
  function muteCallHandler() {
    console.log ("Call needs to be muted")
    console.log ("callObject = ", JSON.stringify(callObject));
    console.log ("callEvent = ", callEvent);
    console.log ("callFrom = ", callFrom);
    call.Mute();
  }

  function holdCallHandler() {
    console.log ("Call needs to hold")
    console.log ("callObject = ", JSON.stringify(callObject));
    console.log ("callEvent = ", callEvent);
    console.log ("callFrom = ", callFrom);
    call.Hold();
  }

  const callInfoChanged = () => {
    console.log("callInfoChanged to: ", phone, callRef);
  }


  function diagnosticsReportCallback(saveStatus, saveData) {
    console.log("saveLogs: ", saveStatus, saveData);
    setDiagnosticsLogs(saveData)
  }

  function diagnosticsKeyValueCallback(key, status, description) {
    if (key === "speakerInfo") {
      setDiagnostics(diagnosticsValue + "\n" + key + "=" + JSON.stringify(status))
      console.log('diagnosticsKeyValueCallback speakerInfo:' + key + "=" + JSON.stringify(status))
    } else if (key === "micInfo") {
      setDiagnostics(diagnosticsValue + "\n" + key + "=" + + JSON.stringify(status))
      console.log('diagnosticsKeyValueCallback micInfo:' + key + "=" + JSON.stringify(status))
    } else if (key === "browserVersion") {
      setDiagnostics(diagnosticsValue + "\n" + key + "=" + description)
      setDiagState(true)
    } else if (key === "speaker") {
      let printSpeakerValue=false
      let d = new Date()
      let currentTime = d.getMilliseconds();
      //let currentSpeakerValue = parseFloat(status)
      //let diffValue = 0;
      let diffTime = Math.abs(currentTime - lastSpeakerTime);

      //if (!isNaN(speakerValue) && !isNaN(currentSpeakerValue)) {
      //  diffValue = Math.abs(speakerValue - currentSpeakerValue) 
      //}              

      /* Note:
           We print speaker values once in 500ms 
           as frequent updates to text area would hog
           the browser and the stop button events are not captured
           alternatively we could have printed when there is 
           a considerable difference in voice levels
           but that depends on external factors beyond our control
           which could either again hog or do not happen at all
           So commenting the diff value check.
      */
      if (diffTime > 500)
      //if (diffValue > 1)
      {
        printSpeakerValue = true
      } else {
        printSpeakerValue = false
      }

      if (printSpeakerValue) {
        setDiagnosticsSpeakerValue(description + ":" + status)
        //speakerValue = currentSpeakerValue
      }
      lastSpeakerTime = currentTime


    } else if (key === "mic") {
      let printMicValue=false
      let d = new Date()
      let currentTime = d.getMilliseconds();
      //let currentMicValue = parseFloat(status)
      //let diffValue = 0;
      let diffTime = Math.abs(currentTime - lastMicTime);

      //if (!isNaN(micValue) && !isNaN(currentMicValue)) {
      //  diffValue = Math.abs(micValue - currentMicValue) 
      //}              

      /* Note:
           We print mic values once in 500ms 
           as frequent updates to text area would hog
           the browser and the stop button events are not captured
           alternatively we could have printed when there is 
           a considerable difference in voice levels
           but that depends on external factors beyond our control
           which could either again hog or do not happen at all
           So commenting the diff value check.
      */      
      if (diffTime > 500)
      //if (diffValue > 1)
      {
        printMicValue = true
      } else {
        printMicValue = false
      }

       if (printMicValue) {
          setDiagnosticsMicValue(description + ":" + status)
          //micValue = currentMicValue
       }
       lastMicTime = currentTime

    } else if (key === "wss") {
        setDiagnosticsWssValue( key + ":" + status + ":" + description)
    } else if (key === "userReg") {
        setDiagnosticsRegValue( key + ":" + status + ":" + description)
    }  else if (key === "tcp") {
        setDiagnosticsTcpValue( key + ":" + status + ":" + description)
    }  else if (key === "udp") {
        setDiagnosticsUdpValue( key + ":" + status + ":" + description)
    } else if (key === "host") {
        setDiagnosticsHostValue( key + ":" + status + ":" + description)
    } else if (key === "srflx") {
        setDiagnosticsReflexValue( key + ":" + status + ":" + description)
    } else {
        console.log("diagnosticsKeyValueCallback: unknown key=" + key + " status=" + status + " description=" + description);
    }
  }


  function diagnosticsInitHandler() {
    console.log ("Diagnostics needs to be initialised")
    if (!configUpdated) {
      updateConfig();
    }  

    if (!diagState)  {
      exWebClient.initDiagnostics(diagnosticsReportCallback, diagnosticsKeyValueCallback)
      //setDiagState(true)
      //setDiagnostics('Diagnostics Initialised')
    }
  }

  function diagnosticsEndHandler() {
    console.log ("Diagnostics needs to be terminated")
    if (configUpdated) {
      if (diagState) {
        exWebClient.closeDiagnostics()
        setDiagState(false)
        setSpeakerTestState(false)
        setMicTestState(false)
        setNWTestState(false)
        setDiagnostics('Diagnostics Not Initialised')
      }
    }
}

  function startSpeakerTest() {
    console.log ("Speaker Test needs to be started")
    if (configUpdated) {
      if (diagState) {    
        if (!diagSpeakerTestState) {   
          lastSpeakerTime = 0
          exWebClient.startSpeakerDiagnosticsTest()
          setSpeakerTestState(true)
        }
      }
    }
  }

  function stopSpeakerTestSuccess() {
    console.log ("Speaker Test needs to be stopped, with success response")
    if (configUpdated) {
      if (diagState) {       
        if (diagSpeakerTestState) {    
          exWebClient.stopSpeakerDiagnosticsTest('yes')
          setSpeakerTestState(false)
        }
      }
    }
  }

  function stopSpeakerTestFailure() {
    console.log ("Speaker Test needs to be stopped, with failure response")
    if (configUpdated) {
      if (diagState) {       
        if (diagSpeakerTestState) {    
          exWebClient.stopSpeakerDiagnosticsTest('no')
          setSpeakerTestState(false)
        }
      }
    }    
  }

  function stopSpeakerTest() {
    console.log ("Speaker Test needs to be stopped")
    if (configUpdated) {
      if (diagState) {       
        if (diagSpeakerTestState) {    
          exWebClient.stopSpeakerDiagnosticsTest()
          setSpeakerTestState(false)
        }
      }
    }    
  }

  function startMicTest() {
    console.log ("Mic Test needs to be started")
    setMicTestState(true)
    if (configUpdated) {
      if (diagState) {       
        if (!diagMicTestState) {    
          lastMicTime = 0          
          exWebClient.startMicDiagnosticsTest()
          setMicTestState(true)
        }
      }
    }    
  }

  function stopMicTestSuccess() {
    console.log ("Mic Test needs to be stopped, with success response")
    if (configUpdated) {
      if (diagState) {       
        if (diagMicTestState) {    
          exWebClient.stopMicDiagnosticsTest('yes')
          setMicTestState(false)
        }
      }
    }     
  }

  function stopMicTestFailure() {
    console.log ("Mic Test needs to be stopped, with failure response")
    if (configUpdated) {
      if (diagState) {       
        if (diagMicTestState) {    
          exWebClient.stopMicDiagnosticsTest('no')
          setMicTestState(false)
        }
      }
    }     
  }

  function stopMicTest() {
    console.log ("Mic Test needs to be stopped")
    if (configUpdated) {
      if (diagState) {       
        if (diagMicTestState) {    
          exWebClient.stopMicDiagnosticsTest()
          setMicTestState(false)
        }
      }
    }     
  }

  function startNwTest() {
    console.log ("NW Test needs to be started")
    if (configUpdated) {
      if (diagState) {       
        if (!diagNWTestState) {  

          if (!configUpdated) {
            updateConfig();
          }  
      
          initialise_callbacks();          

          exWebClient.startNetworkDiagnostics()
          setNWTestState(true)
        }
      }
    }     
  }

  function stopNwTest() {
    console.log ("NW Test needs to be stopped")
    if (configUpdated) {
      if (diagState) {       
        if (diagNWTestState) {    
          exWebClient.stopNetworkDiagnostics()
          setNWTestState(false)
        }
      }
    }     
  }

  return (
    <div className="App">
      <header className="App-header">
          Simple SIP Phone
      </header>

<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
<Tabs value={tabValue} onChange={handleTabChange} aria-label="SIPPhoneTabs">
  <Tab label="Demo" {...a11yProps(0)} />
  <Tab label="Config" {...a11yProps(1)} />
  <Tab label="Diagnostics" {...a11yProps(2)} />
</Tabs>
</Box>
<TabPanel component="span" value={tabValue} index={0}>
  {
    callDemo()
  }
</TabPanel>
<TabPanel component="span" value={tabValue} index={1}>
{
  configTable()
}
</TabPanel>
<TabPanel component="span" value={tabValue} index={2}>
  {
    diagnostics()
  }
</TabPanel>

    </div>
  );
}

export default App;
