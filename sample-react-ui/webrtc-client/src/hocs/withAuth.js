import React from 'react';
import { useAuthContext } from '../reducer/AuthContext';

export function withAuth(WrappedComponent) {
  function WithAuth(props) {
    const { userState, dispatch } = useAuthContext();
    return <WrappedComponent {...props} userState={userState} dispatch={dispatch} />;
  }
  WithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithAuth;
}
