import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import CloseIcon from '@mui/icons-material/Close';

export default function DiagnosticsDialog({ open, title, onClose, children }) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="diagnostics-dialog-title">
      <DialogTitle id="diagnostics-dialog-title">
        <div className="flex-container-top">
          <div>{title}</div>
          <div className="flex-child">
            <Button onClick={onClose} color="primary">
              <CloseIcon />
            </Button>
          </div>
        </div>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

DiagnosticsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
};
