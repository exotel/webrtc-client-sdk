import React, { createContext, useContext, useReducer } from 'react';

export const AuthContext = createContext();

/**
 * Set initial state
 */
const initialState = {
    isAuthenticated: window.sessionStorage.getItem('isAuthenticated'),
    user: window.sessionStorage.getItem('user'),
    userObj: window.localStorage.getItem("registeredUsers") || [],
    configObj: window.localStorage.getItem("configObj") || [],
    selectedPhone: window.localStorage.getItem('selectedPhone') || ''
}
const userDetails = [];

/** 
 * Constants - actions
 */
export const LOGIN_SUCCESSFUL = 'LOGIN_SUCCESSFUL';
export const LOGIN_UNSUCCESSFUL = 'LOGIN_UNSUCCESSFUL';
export const LOGOUT = 'LOGOUT';
export const REGISTERED_SUCCESSFULLY = 'REGISTERED_SUCCESSFULLY';
export const DE_REGISTERED_SUCCESSFULLY = 'DE_REGISTERED_SUCCESSFULLY';
export const DE_REGISTERED_ALL_USERS = 'DE_REGISTERED_ALL_USERS';
export const CONFIGURATION_ADDED = 'CONFIGURATION_ADDED';
export const CONFIGURATION_MODIFIED = 'CONFIGURATION_MODIFIED';
export const PHONE_SELECTED = 'PHONE_SELECTED';

/**
 * Action creator
 */

 export function login(user_data){
    return {
      type: LOGIN_SUCCESSFUL,
      user_data
    }
  }
  
  export function logout(user_data){
    return {
      type: LOGOUT,
      user_data
    }
  }
  export function registered(user_data){
    return {
      type: REGISTERED_SUCCESSFULLY,
      user_data
    }
  }
/**
 * Adding a reducer for state management
 */
export function reducer(state, action){
    switch(action.type){
        case LOGIN_SUCCESSFUL: 
        /**
         * When login is successful, store the details in localstorage
         */
            window.sessionStorage.setItem("user", action.payload.username);
            window.localStorage.setItem('currentUser', action.payload.username);
            window.sessionStorage.setItem("isAuthenticated", true);
            //window.location.href = "/";
                const res = {
                    ...state,
                    isAuthenticated: window.sessionStorage.getItem("isAuthenticated"),
                    user: action.payload.username,
                }
            return res;
        case LOGOUT:
          /**
           * When user logs out of the application
           */
            window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
            window.localStorage.removeItem('CREDENTIALS_FLUSH')
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.href='/'
            return {
                  ...state,
                  isAuthenticated: window.sessionStorage.getItem("isAuthenticated"),
                  user: null,
                };
            
        case REGISTERED_SUCCESSFULLY: {
          /**
           * If a phone is registered successfully then add the data into the state array
           */
          window.localStorage.removeItem('registeredUsers');
          /**
           * Check if the userDetails array already has the user, if yes don't push else push
           */
          const found = userDetails.some(el => el.phoneName === action.payload.phoneName);
          if (!found) userDetails.push(action.payload);
          
          const res = {
            ...state,
            userObj: userDetails
          }
          window.localStorage.setItem('registeredUsers', JSON.stringify(userDetails));
           /**
           * Also turn auto registration on
           */
            var configArr = JSON.parse(window.localStorage.getItem('configObj'));
            window.localStorage.removeItem('configObj');
            for(var x=0; x<configArr.length; x++){
              if(configArr[x].Username == action.payload.phoneName){
                configArr[x].AutoRegistration = true;
              }
            }
            window.localStorage.setItem('configObj', JSON.stringify(configArr));
          return res;
        }
        case DE_REGISTERED_SUCCESSFULLY: {
          /**
           * When user de-registers remove the object
           */
          var index = userDetails.findIndex(item => item.phoneName === action.payload.phoneName);
          userDetails.splice(index, 1);
          const res = {
            ...state,
            userObj:userDetails
          }
          window.localStorage.setItem('registeredUsers', JSON.stringify(userDetails));
          /**
           * Also turn auto registration off
           */
          var configArr = JSON.parse(window.localStorage.getItem('configObj'));
          window.localStorage.removeItem('configObj');
          for(var x=0; x<configArr.length; x++){
            if(configArr[x].Username == action.payload.phoneName){
              configArr[x].AutoRegistration = false;
            }
          }
          window.localStorage.setItem('configObj', JSON.stringify(configArr));
          return res;
        }

        case DE_REGISTERED_ALL_USERS: {
          /**
           * De-registers all the users at once
           */
          window.localStorage.removeItem('registeredUsers');
          const res = {
            ...state,
            userObj: []
          }
          return res;
        }
        case CONFIGURATION_ADDED: {
          /**
           * When configurations are loaded, they are directly stored in localstorage
           */
          const res = {
            ...state,
            configObj: action.payload
          }
        
          window.localStorage.setItem('configObj', JSON.stringify(action.payload));
          return res;
        }
        case CONFIGURATION_MODIFIED: {
          /**
           * When a particular configuration is modified, look for the details in localstorage
           * and modify the same
           */
          var configArr = JSON.parse(window.localStorage.getItem('configObj'));
          var config = JSON.parse(action.payload);
          /**
           * Remove the item from that index and push the new content
           */
          window.localStorage.removeItem('configObj');
          configArr[config.index] = config.configData;
          window.localStorage.setItem('configObj',JSON.stringify(configArr));
        }
        case PHONE_SELECTED: {
          window.localStorage.setItem('selectedPhone', action.payload.selectedPhone);
          const res = {
            ...state,
            selectedPhone: action.payload.selectedPhone
          }
          return res;
        }
        default:{
            return {
                ...state
            };
        }
    }
}
/**
 * Create authprovider and apply this to all the children nodes
 */
export const AuthProvider = ({ children }) => {
    const [userState, dispatch] = useReducer(reducer, initialState);

    return (
        <AuthContext.Provider value={{userState, dispatch}}>
        {children}
        </AuthContext.Provider>
      )
}

export const useAuthContext = () => useContext(AuthContext);