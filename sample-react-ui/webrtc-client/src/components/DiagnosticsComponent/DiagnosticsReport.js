import React, { useEffect, useRef } from "react";
import Dialog from "@material-ui/core/Dialog";
import data from "../../phone.json";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import "./DiagnosticsStyle.css";

import Button from "@material-ui/core/Button";
import dnImg from "../../static/device_network.png";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import LinearProgress from "@material-ui/core/LinearProgress";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";
import { yellow } from "@material-ui/core/colors";
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

var reportImageUrl;

function downLoadReportImage() {
  const a = document.createElement("a");
  a.href = reportImageUrl;
  a.download = "DiagnosticsReport.png";
  document.body.appendChild(a);
  // wait for the link to be added to the document
  window.requestAnimationFrame(function () {
    var event = new MouseEvent('click');
    a.dispatchEvent(event);
    document.body.removeChild(a);
  });  

};

function DiagnosticsReport({
  imageUrl,
  commentsRef,
  troubleShootReport,
  handleDiagnosticsReportCancel,
  handleDiagnosticsReportSend
}) {

  const [open, setOpen] = React.useState(true);
  const [isScreenCapture, setScreenCapture] = React.useState(true);

  const handleClose = (event) => {  
    setOpen(!open);
    handleDiagnosticsReportCancel(event);   
  };

  const sendDiagnosticsReportCancel = (event) => {
    handleClose();
  };

  const sendDiagnosticsReport = (event) => {
    handleDiagnosticsReportSend(isScreenCapture)
  };

  const reportContainer = useRef(null);

  function downLoadParentImage() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "Diagnostics.jpeg";
    document.body.appendChild(a);
    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      a.dispatchEvent(event);
      document.body.removeChild(a);
    });  
  
  };

  return (
    <div className="container">
      <Dialog    
        hideBackdrop    
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        ref={reportContainer} 
      >
        <DialogTitle id="alert-dialog-title">
           <div className="flex-container-top">
            <div> Send Error Logs </div>
            <div className="flex-child">
              <Button onClick={handleClose}>
                <CloseIcon />
              </Button>
            </div>
          </div>
        </DialogTitle>


        <DialogContent id="alert-dialog-description">

        <Card sx={{ maxWidth: 450 , color:yellow  }}>
            <CardContent>
              <Typography
                gutterBottom
                variant="h5"
                component="span"
              ></Typography>
                <FormGroup>                  
                <Typography component="span" variant="body1">
                  <label>
                  Issue Description: 
                  </label>
                   <br/> 
                  <textarea style={{ width: 400, height: 150, resize:'none' }} ref={commentsRef}></textarea>
                  <br/>
                  </Typography>
                  <Typography component="span" variant="body2">
                  <FormControlLabel control={
                  
                  <Checkbox
                  checked={isScreenCapture}
                  onChange={e => {
                    console.log("target checked = " + e.target.checked);
                    setScreenCapture(!isScreenCapture)
                  }}
                  inputProps={{
                    'aria-label': 'primary checkbox',
                  }}                  
                  />
                  } label="Include Screen Capture" />
                  <br/>

                  <img src={imageUrl} width="400" height="400"/>

                  </Typography>

                  <Typography component="span" variant="body2">
                  <div className="flex-container">
                      &nbsp;           
                      &nbsp;
                      &nbsp;

                      <div className="flex-child">
                      <input
                        type="submit"
                        size="small"
                        value="Cancel"
                        onClick={sendDiagnosticsReportCancel}
                      />
                      </div>

                      <div className="flex-child">
                      <input
                        type="submit"
                        size="small"
                        value="Send"
                        onClick={sendDiagnosticsReport}
                      />
                      </div>

                  </div>                    
                  </Typography>

                  </FormGroup>
                  <br></br>
            </CardContent>
          </Card>

        </DialogContent>
      </Dialog>
    </div>
  );
}


export default DiagnosticsReport;
