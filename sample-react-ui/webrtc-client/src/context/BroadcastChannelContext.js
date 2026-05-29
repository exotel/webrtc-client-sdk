import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';

const BroadcastChannelContext = createContext(null);

export function BroadcastChannelProvider({ children }) {
  const channel = useMemo(() => new BroadcastChannel('app-data'), []);

  useEffect(() => () => channel.close(), [channel]);

  const postMessage = useCallback((msg) => channel.postMessage(msg), [channel]);

  const value = useMemo(() => ({ channel, postMessage }), [channel, postMessage]);

  return (
    <BroadcastChannelContext.Provider value={value}>
      {children}
    </BroadcastChannelContext.Provider>
  );
}

export function useBroadcastChannel() {
  const ctx = useContext(BroadcastChannelContext);
  if (!ctx) {
    throw new Error('useBroadcastChannel must be used within BroadcastChannelProvider');
  }
  return ctx;
}
