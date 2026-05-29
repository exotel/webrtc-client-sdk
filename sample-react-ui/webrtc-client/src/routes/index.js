import React from 'react';
import PrimaryPhoneAppBar from '../components/HeaderComponent/AppBar';

export const WebrtcApp = ({ myPhoneDetails = {} }) => {
  return <PrimaryPhoneAppBar phoneDetails={myPhoneDetails} />;
};
