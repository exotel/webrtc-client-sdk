import React, { useEffect } from "react";
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
import LinearProgress from "@material-ui/core/LinearProgress";

//import * as React from 'react';
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
//import Typography from '@material-ui/core//Typography';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassFullIcon from '@mui/icons-material/HourglassFull';
import CloseIcon from "@mui/icons-material/Close";
import { yellow } from "@material-ui/core/colors";
import { createRef, useState, useRef } from 'react'
import html2canvas from "html2canvas";
import { useScreenshot } from 'use-react-screenshot'

var micStatus = true;
var speakerStatus = true;
var browserVersion = 'BrowserVersion';
var micDescr = ""
var speakerDescr = ""
var micInfo = {}
var speakerInfo = {}

function DiagnosticsDevices({
  diagnosticsDeviceImageRef,
  micValue,
  speakerValue,
  micUserResponse,
  speakerUserResponse,
  handleDiagnosticsDevicesSkip,
  handleDiagnosticsDevicesRetest,
  handleDiagnosticsDevicesSaveLogs,
  handleStopSpeakerTestSuccess,
  handleStopSpeakerTestFailure,
  handleStopMicTestSuccess,
  handleStopMicTestFailure,
  handleRestartSpeaker,
  handleRestartMic,
}) {
  const useReactRef = useRef(null)
  const [open, setOpen] = React.useState(true);
  const channel = new BroadcastChannel("app-data");
  const [imageMine, setImageMine] = useState(null)
  const [errorMine, setErrorMine] = useState(null)
  var restartSpeakerEnabled = false
  const [image1, takeScreenShot] = useScreenshot({
    type: "image/jpeg",
    quality: 1.0
  });

  const handleClose = () => {
    setOpen(!open);
  };

  const sendDiagnosticsNext = (event) => {
    handleClose();
    handleDiagnosticsDevicesSkip(event);
  };

  const sendDiagnosticsReport = (event) => {
    handleDiagnosticsDevicesSaveLogs(event);
    handleClose();
  };

  const sendDiagnosticsTestSuccess = (event) => {
    handleClose();
    handleStopSpeakerTestSuccess(event);
  };

  const sendDiagnosticsTestFailure = (event) => {
    handleClose();
    handleStopSpeakerTestFailure(event);
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

  const download = (image, { name = "DiagnosticDevices", extension = "jpeg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = name + "." + extension;
    document.body.appendChild(a);
    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      a.dispatchEvent(event);
      document.body.removeChild(a);
    });
  };


  const downloadScreenshotDevices = () => takeScreenShotDirect(useReactRef.current).then(download);

  const handleDiagnosticDevices = (e) => {
    /**
     * Agent Details
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


  function getNumeric(str) {
    try {

      if (typeof str != "number") return 0 // we only process numbers!  

      if (!isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str))) { // ...and ensure strings of whitespace fail 
        return str;
      } else {
        return 0;
      }

    } catch (e) {
      return 0;
    }
  }

  micStatus = (micValue > 0) ? true : false;
  speakerStatus = (speakerValue > 0) ? true : false;
  browserVersion = window.localStorage.getItem('browserVersion');
  micDescr = window.localStorage.getItem("micDescr")
  speakerDescr = window.localStorage.getItem("speakerDescr")
  micInfo = window.localStorage.getItem('micInfo');
  speakerInfo = window.localStorage.getItem('speakerInfo');
  return (
    <div className="container">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        ref={diagnosticsDeviceImageRef}
      >
        <DialogTitle id="alert-dialog-title">
          <div className="flex-container-top">
            <div> WebRTC Troubleshooter - Devices </div>
            <div className="flex-child">
              <Button onClick={handleClose}>
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
          <Card sx={{ maxWidth: 450, color: yellow }}>
            <CardContent>
              <Typography
                gutterBottom
                variant="h5"
                component="span"
              ></Typography>

              <Typography component="span" variant="body1">
                <div className="browser-version">
                  Browser : {browserVersion}
                </div>

                {(micInfo) ?
                  (<div className="browser-version">
                    Mic : {micInfo}
                  </div>) : null}
                {(speakerInfo) ?
                  (<div className="browser-version">
                    Speaker : {speakerInfo}
                  </div>) : null}

              </Typography>


              <br></br>
              <br></br>

              <Card sx={{ maxWidth: 450 }}>
                <Typography component="span" variant="body2" >
                  <div className="flex-container-device">
                    <div className="flex-container-device-title">
                      &nbsp; Mic testing
                      <div className="flex-child-device-title">
                        {(micDescr === "") ? (<HourglassFullIcon style={{ color: "blue" }} />)
                          :
                          (micStatus) ? (
                            <CheckCircleIcon style={{ color: "green" }} />
                          ) : (
                            <ErrorIcon style={{ color: "red" }} />
                          )}
                      </div>
                    </div>


                    <LinearProgress variant="determinate" value={getNumeric(micValue)} />


                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                      >
                        <Typography component="span">
                          <div className="flex-container-device-question">
                            Do you see the microphone levels fluctuating as you speak?
                          </div>
                          <div className="flex-container">

                            <div className="flex-child">
                              <input
                                type="submit"
                                size="small"
                                value="Yes"
                                onClick={handleStopMicTestSuccess}
                              />
                            </div>
                            <div className="flex-child">
                              <input
                                type="submit"
                                size="small"
                                value="No"
                                onClick={handleStopMicTestFailure}
                              />
                            </div>
                            <div className="flex-child">
                              {micUserResponse}
                            </div>
                          </div>
                        </Typography>

                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography component="span"> The test has been successfully executed </Typography>
                      </AccordionDetails>
                    </Accordion>

                  </div>
                </Typography>
              </Card>

              <br></br>
              <br></br>

              <Card sx={{ maxWidth: 450 }}>

                <Typography component="span" variant="body2">
                  <div className="flex-container-device">
                    <div className="flex-container-device-title">
                      &nbsp; Speaker testing
                      <div className="flex-child-device-title">
                        {(speakerDescr === "") ? (<HourglassFullIcon style={{ color: "blue" }} />)
                          :
                          (speakerStatus) ? (
                            <CheckCircleIcon style={{ color: "green" }} />
                          ) : (
                            <ErrorIcon style={{ color: "red" }} />
                          )}
                      </div>
                    </div>

                    <LinearProgress variant="determinate" value={getNumeric(speakerValue)} />

                    <Accordion>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel2a-content"
                        id="panel2a-header"
                      >
                        <Typography component="span">
                          <div className="flex-container-device-question">
                            Do you hear a sound playing?
                          </div>

                          <div className="flex-container">
                            <div className="flex-child">
                              <input
                                type="submit"
                                size="small"
                                value="Yes"
                                onClick={sendDiagnosticsTestSuccess}
                              />
                            </div>
                            <div className="flex-child">
                              <input
                                type="submit"
                                size="small"
                                value="No"
                                onClick={sendDiagnosticsTestFailure}
                              />
                            </div>
                            {(restartSpeakerEnabled) ? (
                              <div className="flex-child">
                                <input
                                  type="submit"
                                  size="small"
                                  value="Restart Speaker Test"
                                  onClick={handleRestartSpeaker}
                                />
                              </div>
                            ) : null}
                            <div className="flex-child">
                              {speakerUserResponse}
                            </div>
                          </div>
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography component="span"> The test has been successfully executed </Typography>
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </Typography>
              </Card>

              <br>
              </br>

            </CardContent>
          </Card>
        </DialogContent>

        <Card sx={{ maxWidth: 350 }}>
          <div className="flex-container">
            &nbsp;
            &nbsp;
            &nbsp;

            <div className="flex-child">
              <input
                type="submit"
                size="small"
                value="Start Again"
                onClick={handleDiagnosticsDevicesRetest}
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

            <div className="flex-child">
              <input
                type="submit"
                size="small"
                value="Next"
                onClick={sendDiagnosticsNext}
              />
            </div>

          </div>
          <br />
          <br />
        </Card>
        <br />
      </Dialog>
    </div>
  );
}


export default DiagnosticsDevices;
