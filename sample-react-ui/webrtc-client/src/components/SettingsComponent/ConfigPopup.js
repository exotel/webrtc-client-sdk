import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Dialog } from '@material-ui/core';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import CloseIcon from '@mui/icons-material/Close';
import ConfigContent from './ConfigContent';
import { styles } from './styles';
import { useAuthContext } from '../../reducer/AuthContext';
import TabPanel, { a11yProps } from '../common/TabPanel';

export default function ConfigPopup() {
  const classes = styles();
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(true);
  const { userState } = useAuthContext();
  const configArr = JSON.parse(userState.configObj || '[]');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleClose = () => {
    setOpen(!open);
    window.location.href = window.location.pathname;
  };

  return (
    <div className={classes.root}>
      <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title">
        <DialogTitle id="alert-dialog-title">
          <div className="flex-container-top">
            <div> Configuration </div>
            <div className="flex-child">
              <Button onClick={handleClose}>
                <CloseIcon />
              </Button>
            </div>
          </div>
        </DialogTitle>

        <AppBar position="static" color="default" className={classes.appbar}>
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            aria-label="configuration tabs"
          >
            {configArr.map((config, index) => (
              <Tab key={config.Username} label={config.Username} {...a11yProps(index)} className={classes.tab} />
            ))}
          </Tabs>
        </AppBar>
        {configArr.map((tabValue, index) => (
          <TabPanel key={tabValue.Username} value={value} index={index} className={classes.tabPanel}>
            <ConfigContent value={value} />
          </TabPanel>
        ))}
      </Dialog>
    </div>
  );
}
