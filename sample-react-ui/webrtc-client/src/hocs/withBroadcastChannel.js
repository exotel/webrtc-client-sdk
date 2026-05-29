import React from 'react';
import { useBroadcastChannel } from '../context/BroadcastChannelContext';

export function withBroadcastChannel(WrappedComponent) {
  function WithBroadcastChannel(props) {
    const { channel, postMessage } = useBroadcastChannel();
    return <WrappedComponent {...props} channel={channel} postMessage={postMessage} />;
  }
  WithBroadcastChannel.displayName = `withBroadcastChannel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithBroadcastChannel;
}
