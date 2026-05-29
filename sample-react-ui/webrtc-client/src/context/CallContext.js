import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  callObj: '',
  callerState: '',
  client: '',
  callMessage: '',
  openDialer: false,
  callDialer: false,
  openIncomingNotification: false,
  outgoingNumber: ' ',
  phoneName: '',
  openLogin: false,
  openConfig: false,
  openPhones: false,
  anchorEl: null,
  anchorPhoneLoginEl: null,
  isPhoneLogin: false,
  configUpdated: false,
};

function callReducer(state, action) {
  switch (action.type) {
    case 'SET_CALL_OBJ':
      return { ...state, callObj: action.payload };
    case 'SET_CALLER_STATE':
      return { ...state, callerState: action.payload };
    case 'SET_CLIENT':
      return { ...state, client: action.payload };
    case 'SET_CALL_MESSAGE':
      return { ...state, callMessage: action.payload };
    case 'SET_OPEN_DIALER':
      return { ...state, openDialer: action.payload };
    case 'SET_CALL_DIALER':
      return { ...state, callDialer: action.payload };
    case 'SET_OPEN_INCOMING_NOTIFICATION':
      return { ...state, openIncomingNotification: action.payload };
    case 'SET_OUTGOING_NUMBER':
      return { ...state, outgoingNumber: action.payload };
    case 'SET_PHONE_NAME':
      return { ...state, phoneName: action.payload };
    case 'SET_OPEN_LOGIN':
      return { ...state, openLogin: action.payload };
    case 'SET_OPEN_CONFIG':
      return { ...state, openConfig: action.payload };
    case 'SET_OPEN_PHONES':
      return { ...state, openPhones: action.payload };
    case 'SET_ANCHOR_EL':
      return { ...state, anchorEl: action.payload };
    case 'SET_ANCHOR_PHONE_LOGIN_EL':
      return { ...state, anchorPhoneLoginEl: action.payload };
    case 'SET_IS_PHONE_LOGIN':
      return { ...state, isPhoneLogin: action.payload };
    case 'SET_CONFIG_UPDATED':
      return { ...state, configUpdated: action.payload };
    case 'RESET_CALL_UI':
      return {
        ...state,
        openDialer: false,
        callDialer: false,
        openIncomingNotification: false,
        callMessage: '',
      };
    default:
      return state;
  }
}

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const [state, dispatch] = useReducer(callReducer, initialState);
  const value = { callState: state, callDispatch: dispatch };
  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCallContext must be used within CallProvider');
  }
  return ctx;
}
