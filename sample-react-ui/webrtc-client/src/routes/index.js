import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';

import { AuthProvider } from '../reducer/AuthContext';
import PrimaryPhoneAppBar from '../components/HeaderComponent/AppBar';

export const history = createBrowserHistory({
    forceRefresh: true
});


export const WebrtcApp = ({myPhoneDetails={}}) => {
        return(
                <AuthProvider>
                <PrimaryPhoneAppBar phoneDetails={myPhoneDetails}/>
                </AuthProvider>
        )    
};