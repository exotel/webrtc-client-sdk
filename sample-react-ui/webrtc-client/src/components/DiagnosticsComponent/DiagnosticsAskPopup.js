import React from 'react';
import { Dialog } from '@material-ui/core';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import CloseIcon from '@mui/icons-material/Close';

export default function DiagnosticsAskPopup({ handleDiagnosticsAskSubmit, handleDiagnosticsAskClose }) {
  const [open, setOpen] = React.useState(true);

  const sendDiagnosticsAsk = (event) => {
    event.preventDefault();
    handleDiagnosticsAskSubmit();
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    handleDiagnosticsAskClose?.();
  };

  return (
    <div className="container">
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          <div className="flex-container-top">
            <div> WebRTC Troubleshooter </div>
            <div className="flex-child">
              <Button onClick={handleClose} color="primary">
                <CloseIcon />
              </Button>
            </div>
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="diagnostics-card">
            <div className="header-container">
              <h1 className="diagnostics-header">Welcome to WebRTC Troubleshooter</h1>
            </div>
            <span>
              WebRTC enables realtime audio or video communication directly from the browser without
              the need to install another application such as a softphone.
            </span>
            <span>
              <i>Please give the browser access to microphone to ensure non-interrupted testing</i>
            </span>
            <form className="textfield-container" onSubmit={sendDiagnosticsAsk}>
              <input type="submit" value="Start Test Now" className="submit-btn" />
            </form>
          </div>
        </DialogContent>
        <DialogActions />
      </Dialog>
    </div>
  );
}
