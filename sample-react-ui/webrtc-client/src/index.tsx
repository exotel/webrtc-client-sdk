import React from 'react';
import ReactDOM from 'react-dom';
import { WebrtcApp } from './routes';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './reducer/AuthContext';
import { WebRtcClientProvider } from './context/WebRtcClientContext';
import { BroadcastChannelProvider } from './context/BroadcastChannelContext';
import { CallProvider } from './context/CallContext';
import { DiagnosticsProvider } from './context/DiagnosticsContext';

const myPhoneDetails = {
  phoneNo: 'test',
};

ReactDOM.render(
  <AuthProvider>
    <WebRtcClientProvider>
      <BroadcastChannelProvider>
        <CallProvider>
          <DiagnosticsProvider>
            <WebrtcApp myPhoneDetails={myPhoneDetails} />
          </DiagnosticsProvider>
        </CallProvider>
      </BroadcastChannelProvider>
    </WebRtcClientProvider>
  </AuthProvider>,
  document.getElementById('root')
);

reportWebVitals();
