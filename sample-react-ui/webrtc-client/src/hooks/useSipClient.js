import { useCallback, useRef, useEffect } from 'react';
import { useAuthContext } from '../reducer/AuthContext';
import { useWebRtcClient } from '../context/WebRtcClientContext';
import { useCallContext } from '../context/CallContext';
import { buildSipAccountInfo, findConfigByUsername } from '../../../packages/shared/sipAccountBuilder';
import { fetchTabInfo } from '../../../packages/shared/tabStorage';
import { getConfigArray } from '../utils/localStorageHelpers';

export function useSipClient({ callListenerCallback, sessionCallback }) {
  const exWebClient = useWebRtcClient();
  const { userState, dispatch } = useAuthContext();
  const { callState, callDispatch } = useCallContext();
  const sipAccountInfoRef = useRef(null);
  const callRef = useRef(null);
  const deviceCallbacksRegistered = useRef(false);

  const registerEventCallBack = useCallback(
    (state, phone) => {
      if (state === 'registered') {
        dispatch({
          type: 'REGISTERED_SUCCESSFULLY',
          payload: { phoneName: phone, state },
        });
      } else {
        dispatch({
          type: 'REGISTERED_UNSUCCESSFULLY',
          payload: { phoneName: phone, state },
        });
      }
    },
    [dispatch]
  );

  const updateSipAccountInfo = useCallback(() => {
    const { config } = findConfigByUsername(userState.configObj, callState.phoneName);
    if (config) {
      sipAccountInfoRef.current = buildSipAccountInfo(config, config.Username);
    }
    return sipAccountInfoRef.current;
  }, [userState.configObj, callState.phoneName]);

  const registerDeviceChangeCallbacks = useCallback(() => {
    if (deviceCallbacksRegistered.current || !exWebClient?.registerAudioDeviceChangeCallback) {
      return;
    }
    exWebClient.registerAudioDeviceChangeCallback(
      () => {},
      () => {},
      () => {}
    );
    deviceCallbacksRegistered.current = true;
  }, [exWebClient]);

  const initialiseCallbacks = useCallback(() => {
    updateSipAccountInfo();
    const sipInfo = sipAccountInfoRef.current;
    const autoDeviceChange = Boolean(sipInfo?.autoAudioDeviceChange);

    exWebClient.initWebrtc(
      sipInfo,
      registerEventCallBack,
      callListenerCallback,
      sessionCallback,
      autoDeviceChange
    );
    registerDeviceChangeCallbacks();
    callRef.current = exWebClient.getCall();
    return callRef.current;
  }, [
    exWebClient,
    callListenerCallback,
    sessionCallback,
    registerEventCallBack,
    updateSipAccountInfo,
    registerDeviceChangeCallbacks,
  ]);

  const sendAutoRegistration = useCallback(
    (username) => {
      if (userState.user === null) {
        return;
      }
      const configArray = getConfigArray();
      for (let x = 0; x < configArray.length; x++) {
        const config = configArray[x];
        const registeredUsers = window.localStorage.getItem('registeredUsers');
        const isAlreadyRegistered =
          registeredUsers &&
          JSON.parse(registeredUsers).some((item) => item.phoneName === config.Username);

        if (isAlreadyRegistered) {
          continue;
        }

        if ((config.AutoRegistration && config.Username === username) || config.AutoRegistration) {
          exWebClient.DoRegister();
          if (config.AutoRegistration && config.Username === username) {
            break;
          }
        }
      }
    },
    [exWebClient, userState.user]
  );

  const handleRegister = useCallback(
    async (event) => {
      const userObj = JSON.parse(window.localStorage.getItem('registeredUsers') || '[]');
      if (userObj.some((item) => item.phoneName === event.target.value)) {
        exWebClient.UnRegister();
        dispatch({
          type: 'DE_REGISTERED_SUCCESSFULLY',
          payload: { phoneName: event.target.value, phoneNumber: event.target.value },
        });
      } else {
        try {
          await exWebClient.primeUiTones();
        } catch (error) {
          console.warn('primeUiTones failed', error);
        }
        exWebClient.DoRegister();
      }
    },
    [dispatch, exWebClient]
  );

  const handleLogout = useCallback(
    (postMessage) => {
      const registeredUsers = JSON.parse(window.localStorage.getItem('registeredUsers') || '[]');
      const configObj = JSON.parse(userState.configObj || '[]');

      registeredUsers.forEach((user) => {
        const { config } = findConfigByUsername(configObj, user.phoneName);
        if (config) {
          const sipInfo = buildSipAccountInfo(config, user.phoneName);
          exWebClient.UnRegister(sipInfo, exWebClient);
          dispatch({
            type: 'DE_REGISTERED_SUCCESSFULLY',
            payload: { phoneName: user.phoneName, phoneNumber: user.phoneName },
          });
        }
      });
      postMessage?.({ message: 'logout' });
    },
    [dispatch, exWebClient, userState.configObj]
  );

  useEffect(() => {
    if (!callState.configUpdated) {
      try {
        initialiseCallbacks();
        callDispatch({ type: 'SET_CONFIG_UPDATED', payload: true });
      } catch (e) {
        console.log('Cannot initialize callbacks for json ', userState.configObj);
      }
    }

    ensureParentTabOnLoad();

    if (window.localStorage.getItem('phoneData') !== null) {
      const phoneObj = JSON.parse(window.localStorage.getItem('phoneData'));
      callDispatch({ type: 'SET_PHONE_NAME', payload: phoneObj.username });
    }

    const tabInfo = fetchTabInfo(window.sessionStorage.getItem('activeSessionTab'));
    if (tabInfo !== null) {
      setTimeout(() => {
        if (window.sessionStorage.getItem('activeSessionTab') === 'parent0') {
          sendAutoRegistration();
        }
      }, 3000);
    }

    exWebClient.SessionListener();
    callRef.current = exWebClient.getCall();
  }, [callState.configUpdated, callDispatch, exWebClient, initialiseCallbacks, sendAutoRegistration, userState.configObj]);

  return {
    exWebClient,
    callRef,
    sipAccountInfoRef,
    updateSipAccountInfo,
    initialiseCallbacks,
    sendAutoRegistration,
    handleRegister,
    handleLogout,
  };
}

function ensureParentTabOnLoad() {
  const tabs = JSON.parse(window.localStorage.getItem('tabs') || 'null');
  let index = -1;
  if (tabs !== null) {
    index = tabs.findIndex((item) => item.tabID === 'parent0');
  }

  if (tabs === null || index === -1) {
    window.sessionStorage.setItem('activeSessionTab', 'parent0');
    window.localStorage.setItem(
      'tabs',
      JSON.stringify([{ tabID: 'parent0', tabType: 'parent', tabStatus: 'active' }])
    );
  } else if (tabs.length === 1 && tabs[0].tabID === 'parent0') {
    window.sessionStorage.setItem('activeSessionTab', 'parent0');
  }
}
