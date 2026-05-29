import { useEffect, useRef, useCallback } from 'react';
import { useAuthContext } from '../reducer/AuthContext';
import { useBroadcastChannel } from '../context/BroadcastChannelContext';
import { ensureParentTab, getTabs, setTabs } from '../../../packages/shared/tabStorage';

export function useTabManager({ sendAutoRegistration }) {
  const { dispatch } = useAuthContext();
  const { channel } = useBroadcastChannel();
  const sendAutoRegistrationRef = useRef(sendAutoRegistration);
  sendAutoRegistrationRef.current = sendAutoRegistration;

  const promoteVisibleTabToParent = useCallback(() => {
    const tabArray = getTabs();
    const parentIndex = tabArray.findIndex((item) => item.tabID === 'parent0');
    if (parentIndex === -1) {
      const tabData = {
        tabID: 'parent0',
        tabType: 'parent',
        tabStatus: 'active',
      };
      const tabArr = [tabData, ...tabArray];
      setTabs(tabArr);
      window.sessionStorage.removeItem('activeSessionTab');
      window.sessionStorage.setItem('activeSessionTab', 'parent0');
      window.localStorage.removeItem('registeredUsers');
      sendAutoRegistrationRef.current?.();
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'DE_REGISTERED_ALL_USERS', payload: '' });

    const hash = `tab_${+new Date()}`;
    window.sessionStorage.setItem('TabHash', hash);
    const tabs = JSON.parse(window.localStorage.getItem('TabsOpen') || '{}');
    tabs[hash] = true;
    window.localStorage.setItem('TabsOpen', JSON.stringify(tabs));

    ensureParentTab();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        promoteVisibleTabToParent();
      }
    };

    const handleBeforeUnload = () => {
      const tabArr = getTabs();
      if (tabArr.length > 1 && window.sessionStorage.getItem('activeSessionTab') === 'parent0') {
        const index = tabArr.findIndex((item) => item.tabID === 'parent0');
        tabArr.splice(index, 1);
        setTabs(tabArr);
      }

      const tabHash = window.sessionStorage.getItem('TabHash');
      const tabsOpen = JSON.parse(window.localStorage.getItem('TabsOpen') || '{}');
      delete tabsOpen[tabHash];
      window.localStorage.setItem('TabsOpen', JSON.stringify(tabsOpen));

      const allTabs = window.localStorage.getItem('TabsOpen');
      const tabHashParts = allTabs.split(/,/);
      const parsedHash = tabHashParts[0].split(/{/);
      channel.postMessage({
        message: 're-register-needed',
        hashMsg: parsedHash[1],
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [channel, dispatch, promoteVisibleTabToParent]);
}
