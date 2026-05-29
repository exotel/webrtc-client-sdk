import React, { createContext, useContext, useMemo } from 'react';

const WebRtcClientContext = createContext(null);

export function WebRtcClientProvider({ children }) {
  const client = useMemo(
    () => require('@exotel-npm-dev/webrtc-client-sdk/src/listeners/ExWebClient').ExotelWebClient,
    []
  );

  return (
    <WebRtcClientContext.Provider value={client}>
      {children}
    </WebRtcClientContext.Provider>
  );
}

export function useWebRtcClient() {
  const client = useContext(WebRtcClientContext);
  if (!client) {
    throw new Error('useWebRtcClient must be used within WebRtcClientProvider');
  }
  return client;
}
