import { useCallback } from 'react';
import { useAuthContext } from '../reducer/AuthContext';
import { useBroadcastChannel } from '../context/BroadcastChannelContext';
import { useCallContext } from '../context/CallContext';
import { getTabs, setTabs } from '../../../packages/shared/tabStorage';

export function useCallSession({ sendAutoRegistration }) {
  const { dispatch } = useAuthContext();
  const { postMessage } = useBroadcastChannel();
  const { callState, callDispatch } = useCallContext();

  const callListenerCallback = useCallback(
    (callObj, eventType, phone) => {
      callDispatch({ type: 'SET_CALL_OBJ', payload: callObj });
      callDispatch({ type: 'SET_CLIENT', payload: phone });

      let msg = {};
      switch (eventType) {
        case 'incoming':
          callDispatch({ type: 'SET_OPEN_DIALER', payload: true });
          callDispatch({ type: 'SET_CALLER_STATE', payload: callObj.callState });
          msg = { callNumber: callObj.remoteDisplayName, callState: 'incoming' };
          postMessage(msg);
          break;
        case 'connected':
          callDispatch({ type: 'SET_OPEN_DIALER', payload: false });
          callDispatch({ type: 'SET_CALLER_STATE', payload: callObj.callState });
          msg = { callNumber: callObj.remoteDisplayName, callState: 'connected' };
          postMessage(msg);
          break;
        case 'callEnded':
          callDispatch({ type: 'SET_OPEN_DIALER', payload: false });
          callDispatch({ type: 'SET_CALLER_STATE', payload: 'terminated' });
          msg = { callNumber: '', callState: 'callEnded' };
          postMessage(msg);
          break;
        case 'activeSession':
          callDispatch({ type: 'SET_CALL_DIALER', payload: true });
          callDispatch({ type: 'SET_CALLER_STATE', payload: 'activeSession' });
          break;
        default:
          break;
      }
    },
    [callDispatch, postMessage]
  );

  const sessionCallback = useCallback(
    (callStateValue, phone) => {
      switch (callStateValue) {
        case 'incoming':
          if (window.sessionStorage.getItem('activeSessionTab') !== 'parent0') {
            callDispatch({ type: 'SET_OPEN_INCOMING_NOTIFICATION', payload: true });
            callDispatch({
              type: 'SET_CALL_MESSAGE',
              payload: `Incoming call from ${phone} ,Switch tab to find dialpad`,
            });
          }
          break;
        case 'callEnded':
          callDispatch({ type: 'SET_OPEN_INCOMING_NOTIFICATION', payload: false });
          break;
        case 'connected':
          callDispatch({ type: 'SET_OPEN_INCOMING_NOTIFICATION', payload: false });
          break;
        case 're-register': {
          const hashRes = phone.split(/:/);
          const hashRes1 = hashRes[0].split(/"/);
          if (window.sessionStorage.getItem('TabHash') === hashRes1[1]) {
            const tabArray = getTabs();
            const parentIndex = tabArray.findIndex((item) => item.tabID === 'parent0');
            if (parentIndex === -1) {
              const tabArr = [
                { tabID: 'parent0', tabType: 'parent', tabStatus: 'active' },
                ...tabArray,
              ];
              setTabs(tabArr);
            }
            window.sessionStorage.removeItem('activeSessionTab');
            window.sessionStorage.setItem('activeSessionTab', 'parent0');
            window.localStorage.removeItem('registeredUsers');
            sendAutoRegistration?.();
          }
          break;
        }
        case 'logout':
          window.sessionStorage.clear();
          window.localStorage.clear();
          dispatch({ type: 'LOGOUT', payload: '' });
          window.location.href = '/';
          break;
        case 'login-successful': {
          const loginObj = JSON.parse(phone);
          window.sessionStorage.setItem('user', loginObj.phone);
          window.sessionStorage.setItem('isAuthenticated', true);
          if (window.sessionStorage.getItem('TabHash') === loginObj.tabHash) {
            window.sessionStorage.setItem('activeSessionTab', 'parent0');
            sendAutoRegistration?.();
          } else {
            const tabArray = getTabs();
            const childIndex = tabArray.findIndex((item) => item.tabType === 'child');
            const tabID = tabArray[childIndex].tabID;
            window.sessionStorage.setItem('activeSessionTab', tabID);
          }
          window.location.href = window.location.pathname;
          break;
        }
        default:
          if (callStateValue && callStateValue.startsWith('media_recovery_')) {
            if (callStateValue === 'media_recovery_attempted') {
              callDispatch({
                type: 'SET_CALL_MESSAGE',
                payload: 'Reconnecting audio…',
              });
              callDispatch({ type: 'SET_OPEN_INCOMING_NOTIFICATION', payload: true });
            } else if (callStateValue === 'media_recovery_succeeded') {
              callDispatch({ type: 'SET_OPEN_INCOMING_NOTIFICATION', payload: false });
            }
          }
          break;
      }
    },
    [callDispatch, dispatch, sendAutoRegistration]
  );

  const handleCall = useCallback(
    (event) => {
      callDispatch({ type: 'SET_CALL_DIALER', payload: event });
    },
    [callDispatch]
  );

  const handleDialerClose = useCallback(() => {
    callDispatch({ type: 'SET_OPEN_DIALER', payload: false });
  }, [callDispatch]);

  const handleCallDialerClose = useCallback(() => {
    callDispatch({ type: 'SET_CALL_DIALER', payload: false });
  }, [callDispatch]);

  const handleLogin = useCallback(() => {
    callDispatch({ type: 'SET_OPEN_LOGIN', payload: !callState.openLogin });
  }, [callDispatch, callState.openLogin]);

  const handleConfig = useCallback(() => {
    callDispatch({ type: 'SET_OPEN_CONFIG', payload: !callState.openConfig });
  }, [callDispatch, callState.openConfig]);

  const handlePhoneLogin = useCallback(
    (event) => {
      callDispatch({ type: 'SET_IS_PHONE_LOGIN', payload: !callState.isPhoneLogin });
      callDispatch({ type: 'SET_PHONE_NAME', payload: event.currentTarget.name });
      callDispatch({ type: 'SET_ANCHOR_PHONE_LOGIN_EL', payload: event.currentTarget });
    },
    [callDispatch, callState.isPhoneLogin]
  );

  const handlePhoneLoginClose = useCallback(() => {
    callDispatch({ type: 'SET_IS_PHONE_LOGIN', payload: false });
    callDispatch({ type: 'SET_ANCHOR_PHONE_LOGIN_EL', payload: null });
  }, [callDispatch]);

  const setOutgoingNumber = useCallback(
    (e) => {
      callDispatch({ type: 'SET_OUTGOING_NUMBER', payload: e.target.value });
    },
    [callDispatch]
  );

  return {
    callListenerCallback,
    sessionCallback,
    handleCall,
    handleDialerClose,
    handleCallDialerClose,
    handleLogin,
    handleConfig,
    handlePhoneLogin,
    handlePhoneLoginClose,
    setOutgoingNumber,
  };
}
