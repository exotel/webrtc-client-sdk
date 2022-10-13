import React from "react";
import PropTypes from "prop-types";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { Dialog } from "@material-ui/core";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import CloseIcon from '@mui/icons-material/Close';
import { styles } from "../SettingsComponent/styles";
import { useAuthContext } from "../../reducer/AuthContext";
import { PrimaryPhoneAppBar } from "../HeaderComponent/AppBar";

export default function DiagnosticsAskPopup({handleDiagnosticsAskSubmit, handleDiagnosticsAskClose}) {
  const classes = styles();
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(true);
  //const { userState, disptach } = useAuthContext();
  //var configArr = JSON.parse(userState.configObj);

  const sendDiagnosticsAsk = (event, newValue) => {
    handleDiagnosticsAskSubmit();
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    //handleDiagnosticsAskClose();
  };

  return (
    <div component="span" className="container">
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          <div className="flex-container-top">
            <div component="span"> WebRTC Troubleshooter </div>
            <div className="flex-child">
              <div component="span">
              <Button onClick={handleClose} color="primary">
              <CloseIcon />   
              </Button>                
              
              </div>
            </div>
          </div>
        </DialogTitle>
        <DialogContent component="span" id="alert-dialog-description">
          <div className="diagnostics-card">
            <div className="header-container">
              <h1 className="diagnostics-header">
                Welcome to WebRTC Troubleshooter
              </h1>
            </div>
            <div component="span">
              <span>
                WebRTC enables realtime audio or video communication directly
                from the browser without the need to install another application
                such as a softphone.
              </span>

              <span>
                <i>
                  Please give the browser access to microphone to ensure
                  non-interrupted testing
                </i>
              </span>
              <form
                className="textfield-container"
                onSubmit={sendDiagnosticsAsk}
              >
                <input
                  type="submit"
                  value="Start Test Now"
                  className="submit-btn"
                />
              </form>
            </div>
          </div>
        </DialogContent>

        <DialogActions></DialogActions>
      </Dialog>
    </div>
  );
}
