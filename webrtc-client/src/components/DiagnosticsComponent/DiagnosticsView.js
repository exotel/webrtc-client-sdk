import React, { useEffect, useRef, useReactRef } from "react";
import Dialog from "@material-ui/core/Dialog";
import data from "../../phone.json";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import "./DiagnosticsStyle.css";

import Button from "@material-ui/core/Button";
import dnImg from "../../static/device_network.png";

import Card from "@material-ui/core/Card";
//import CardActions from '@material-ui/core/CardActions';
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";

//import * as React from 'react';
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
//import Typography from '@material-ui/core//Typography';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";
import { createRef, useState } from 'react'
import html2canvas from "html2canvas";
import { useScreenshot } from 'use-react-screenshot'
import CircularProgress from '@mui/material/CircularProgress';

var webSocketStatus = true;
var userRegistrationStatus = true;
var udpEnabledStatus = true;
var tcpEnabledStatus = true;
var ipv6EnabledStatus = false;
var hostConnectivityStatus = true;
var relexiveConnectivityStatus = true;

var webSocketDescription = "webSocketDescription for test";
var userRegistrationDescription = "userRegistrationDescription";
var udpEnabledDescription = "udpEnabledDescription";
var tcpEnabledDescription = "tcpEnabledDescription";
var ipv6EnabledDescription = "ipv6EnabledDescription";
var hostConnectivityDescription = "hostConnectivityDescription";
var relexiveConnectivityDescription = "relexiveConnectivityDescription";
var browserVersion = 'BrowserVersion';
var showIpv6 = false;

function DiagnosticsView({
  diagnosticsNetImageRef,
  handleDiagnosticsOpsBack,
  handleDiagnosticsOpsRetest,
  handleDiagnosticsOpsSaveLogs,
}) {
  const [imageMine, setImageMine] = useState(null)
  const [errorMine, setErrorMine] = useState(null)  
  const [open, setOpen] = React.useState(true);
  const channel = new BroadcastChannel("app-data");
  const [image, takeScreenshot] = useScreenshot({
    type: "image/jpeg",
    quality: 1.0,
  });

  const handleClose = () => {
    setOpen(!open);
  };

  const sendDiagnosticsBack = (event) => {
    handleClose();
    handleDiagnosticsOpsBack(event);
  };

  const sendDiagnosticsReport = (event) => {
    handleDiagnosticsOpsSaveLogs(event);
    handleClose();
  };

  const handleDiagnosticOps = (e) => {
    /**
     * Registration Specific Diagnostics
     */
    for (var x = 0; x < data.length; x++) {
      const username = data[x].agentName;
      const password = data[x].agentPwd;
      const accountSid = data[x].AccountSID.value;

      /**
       * Time being store the configuration into config object in localStorage
       */
      const configData = data[x].AccountSID.ua;
    }
  };


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
        document.body.appendChild(canvas);
        croppedCanvasContext.drawImage(
          canvas,
          cropPositionLeft,
          cropPositionTop,
        )

        const base64Image = canvas.toDataURL(type, quality)

        setImageMine(base64Image)
        return base64Image
      }).catch((error) => {
        console.log("html2canvas error: ", error);
        setErrorMine(error);
      })
  }

  const download = (image, { name = "DiagnosticViews", extension = "jpeg" } = {}) => {
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

  const downloadScreenshot = () => takeScreenShotDirect(useReactRef.current).then(download);
  
  udpEnabledDescription = window.localStorage.getItem('udp');
  tcpEnabledDescription = window.localStorage.getItem('tcp');
  hostConnectivityDescription = window.localStorage.getItem('host');
  relexiveConnectivityDescription = window.localStorage.getItem('srflx');
  udpEnabledStatus =  (udpEnabledDescription)?true:false;
  tcpEnabledStatus =  (tcpEnabledDescription)?true:false;
  hostConnectivityStatus =  (hostConnectivityDescription)?true:false;
  relexiveConnectivityStatus =  (relexiveConnectivityDescription)?true:false;
  browserVersion = window.localStorage.getItem('browserVersion'); 
  userRegistrationDescription = window.localStorage.getItem('regUsers');
  webSocketDescription = window.localStorage.getItem('webrtcUrl');
  webSocketStatus = (webSocketDescription)?true:false;
  try {
  userRegistrationStatus = (userRegistrationDescription)?true:false;
  } catch (e) {
    alert(e);
    userRegistrationStatus = false;
    userRegistrationDescription = "error in user registration check"
  }

  /*
  {(showIpv6)?            
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel5a-content"
        id="panel5a-header"
      >
        <Typography component="span">
          <div className="flex-container">
            IPv6 Enabled 
            <div className="flex-child">
              {ipv6EnabledStatus ? (
                <CheckCircleIcon style={{ color: "green" }} />
              ) : (
                <ErrorIcon style={{ color: "red" }} />
              )}
            </div>
          </div>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography component="span">
            <div className='diagnostics-detail'>  {ipv6EnabledDescription} </div>
        </Typography>
      </AccordionDetails>
    </Accordion>      
      :null} 
  */

  return (
    <div  className="container">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        ref={diagnosticsNetImageRef}
      >
        <DialogTitle id="alert-dialog-title">
          <div className="flex-container-top">
            <div> WebRTC Troubleshooter </div>
            <div className="flex-child">
              <Button onClick={handleClose} color="primary">
                <CloseIcon />
              </Button>
            </div>
          </div>
          <Card sx={{ maxWidth: 340 }}>
            <CardMedia
              component="img"
              height="150"
              image={dnImg}
              alt="device network"
            />
          </Card>
        </DialogTitle>

        <DialogContent id="alert-dialog-description">
          <Card sx={{ maxWidth: 340 }}>
            <CardContent>
              <Typography
                gutterBottom
                variant="h5"
                component="span"
              ></Typography>
              <Typography component="span" variant="body2" color="textSecondary">
                <div>
                  <p className="browser-version">
                  Browser : {browserVersion}
                  </p>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          Web Socket
                          <div className="flex-child">
                            {webSocketStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>

                      <div></div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography component="span">{webSocketDescription}</Typography>
                    </AccordionDetails>
                  </Accordion>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel2a-content"
                      id="panel2a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          User Registration
                          <div className="flex-child">
                            {userRegistrationStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography component="span"> Registered Users: {userRegistrationDescription}</Typography>
                    </AccordionDetails>
                  </Accordion>
                  <h5> Protocols </h5>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel3a-content"
                      id="panel3a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          UDP Enabled  
                          {userRegistrationDescription ? (<div></div>): (<CircularProgress/>)}
                          <div className="flex-child">
                            {udpEnabledStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography component="span"><div className='diagnostics-detail'> {udpEnabledDescription}</div></Typography>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel4a-content"
                      id="panel4a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          TCP Enabled 
                          {tcpEnabledDescription ? (<div></div>): (<CircularProgress/>)}
                          <div className="flex-child">
                            {tcpEnabledStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography component="span"><div className='diagnostics-detail'> {tcpEnabledDescription} </div></Typography>
                    </AccordionDetails>
                  </Accordion>





                  <h5> Connectivity </h5>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel6a-content"
                      id="panel6a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          Host Connectivity
                          <div className="flex-child">
                            {hostConnectivityStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography component="span"><div className='diagnostics-detail'>{hostConnectivityDescription} </div></Typography>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel6a-content"
                      id="panel6a-header"
                    >
                      <Typography component="span">
                        <div className="flex-container">
                          Reflexive Connectivity
                          <div className="flex-child">
                            {relexiveConnectivityStatus ? (
                              <CheckCircleIcon style={{ color: "green" }} />
                            ) : (
                              <ErrorIcon style={{ color: "red" }} />
                            )}
                          </div>
                        </div>
                      </Typography>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography component="span"><div className='diagnostics-detail'>{relexiveConnectivityDescription}</div> </Typography>
                    </AccordionDetails>
                  </Accordion>
                </div>
              </Typography>
            </CardContent>
          </Card>
        </DialogContent>
        <p></p>
        <Card sx={{ maxWidth: 350 }}>
        <div className="flex-container">
          &nbsp;           
          &nbsp;
          &nbsp;
        <div className="flex-child">
          <input
            type="submit"
            size="small"
            value="Back"
            onClick={sendDiagnosticsBack}
          />
        </div>
          <div className="flex-child">
          <input
            type="submit"
            size="small"
            value="Start Again"
            onClick={handleDiagnosticsOpsRetest}
          />
          </div>
          <div className="flex-child">
          <input
            type="submit"
            size="small"
            value="Send Troubleshoot Log"
            onClick={sendDiagnosticsReport}
          />
          </div>
                 
          </div>
          <br/>
          <br/>

          <p></p>
        </Card>
        <br/>
        <p></p>
      </Dialog>
    </div>
  );
}


export default DiagnosticsView;
