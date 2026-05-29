import React, { createContext, useContext, useReducer, useRef } from 'react';

const initialState = {
  openDiagnosticsAsk: false,
  openDiagnosticsOps: false,
  openDiagnosticsDevices: false,
  openDiagnosticsReport: false,
  micValue: window.localStorage.getItem('micValue'),
  speakerValue: window.localStorage.getItem('speakerValue'),
  micUserResponse: '',
  speakerResponse: window.localStorage.getItem(''),
  troubleShootReport: '',
  diagnosticsNetImageUrl: '',
  diagnosticsDeviceImageUrl: '',
  imageUrl: '',
};

function diagnosticsReducer(state, action) {
  switch (action.type) {
    case 'SET_OPEN_DIAGNOSTICS_ASK':
      return { ...state, openDiagnosticsAsk: action.payload };
    case 'SET_OPEN_DIAGNOSTICS_OPS':
      return { ...state, openDiagnosticsOps: action.payload };
    case 'SET_OPEN_DIAGNOSTICS_DEVICES':
      return { ...state, openDiagnosticsDevices: action.payload };
    case 'SET_OPEN_DIAGNOSTICS_REPORT':
      return { ...state, openDiagnosticsReport: action.payload };
    case 'SET_MIC_VALUE':
      return { ...state, micValue: action.payload };
    case 'SET_SPEAKER_VALUE':
      return { ...state, speakerValue: action.payload };
    case 'SET_MIC_RESPONSE':
      return { ...state, micUserResponse: action.payload };
    case 'SET_SPEAKER_RESPONSE':
      return { ...state, speakerResponse: action.payload };
    case 'SET_TROUBLESHOOT_REPORT':
      return { ...state, troubleShootReport: action.payload };
    case 'SET_NET_IMAGE_URL':
      return { ...state, diagnosticsNetImageUrl: action.payload };
    case 'SET_DEVICE_IMAGE_URL':
      return { ...state, diagnosticsDeviceImageUrl: action.payload };
    case 'SET_IMAGE_URL':
      return { ...state, imageUrl: action.payload };
    case 'CLOSE_ALL_DIAGNOSTICS':
      return {
        ...state,
        openDiagnosticsAsk: false,
        openDiagnosticsOps: false,
        openDiagnosticsDevices: false,
        openDiagnosticsReport: false,
      };
    default:
      return state;
  }
}

const DiagnosticsContext = createContext(null);

export function DiagnosticsProvider({ children }) {
  const [state, dispatch] = useReducer(diagnosticsReducer, initialState);
  const diagnosticsNetImageRef = useRef(null);
  const diagnosticsDeviceImageRef = useRef(null);
  const imageRef = useRef(null);
  const commentsRef = useRef(null);

  const value = {
    diagnosticsState: state,
    diagnosticsDispatch: dispatch,
    diagnosticsNetImageRef,
    diagnosticsDeviceImageRef,
    imageRef,
    commentsRef,
  };

  return (
    <DiagnosticsContext.Provider value={value}>
      {children}
    </DiagnosticsContext.Provider>
  );
}

export function useDiagnosticsContext() {
  const ctx = useContext(DiagnosticsContext);
  if (!ctx) {
    throw new Error('useDiagnosticsContext must be used within DiagnosticsProvider');
  }
  return ctx;
}
