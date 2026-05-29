import React from 'react';
import { useWebRtcClient } from '../context/WebRtcClientContext';

export function withWebRtcClient(WrappedComponent) {
  function WithWebRtcClient(props) {
    const exWebClient = useWebRtcClient();
    return <WrappedComponent {...props} exWebClient={exWebClient} />;
  }
  WithWebRtcClient.displayName = `withWebRtcClient(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithWebRtcClient;
}
