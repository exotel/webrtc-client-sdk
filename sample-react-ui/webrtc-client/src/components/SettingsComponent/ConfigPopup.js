import React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Dialog } from '@material-ui/core';
import ConfigContent from './ConfigContent';
import { styles } from './styles';
import { useAuthContext } from '../../reducer/AuthContext';
//import DialogTitle from "@material-ui/core/DialogTitle";
//import DialogContent from "@material-ui/core/DialogContent";
import Button from "@material-ui/core/Button";
import CloseIcon from '@mui/icons-material/Close';
//import DialogActions from "@material-ui/core/DialogActions";
import DialogTitle from "@material-ui/core/DialogTitle";
//import DialogContent from "@material-ui/core/DialogContent";
//import DialogActions from "@material-ui/core/DialogActions";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scrollable-auto-tabpanel-${index}`}
      aria-labelledby={`scrollable-auto-tab-${index}`}
      {...other}
    >
      {value === index && (
       <ConfigContent value={value}/>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `scrollable-auto-tab-${index}`,
    'aria-controls': `scrollable-auto-tabpanel-${index}`,
  };
}

export default function ConfigPopup() {
  const classes = styles();
  const [value, setValue] = React.useState(0);
  const [ open, setOpen ] = React.useState(true);
  const { userState, disptach } = useAuthContext();
  var configArr = JSON.parse(userState.configObj);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleClose = () => {
    setOpen(!open);
    window.location.href = window.location.pathname;
  }

  return (
    <div className={classes.root}>
    <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">

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
          onClose={handleClose}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="scrollable auto tabs example"
        >
          {/** Read from phone.json number of agents */}
          {configArr.map((value, index) => (
            <Tab label={value.Username} {...a11yProps(index)} className={classes.tab}/>
          ))}
        </Tabs>
      </AppBar>
      {configArr.map((tabValue, index) => (
         <TabPanel value={value} index={index} className={classes.tabPanel} />
      ))}
    </Dialog>
    </div>
  );
}