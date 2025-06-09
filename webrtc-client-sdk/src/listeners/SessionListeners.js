import { v4 as uuidv4 } from 'uuid';
import { webrtcSIPPhone } from '@exotel-npm-dev/webrtc-core-sdk';

var logger = webrtcSIPPhone.getLogger();
/**
 * Session listeners is invoked when user opens two tabs, the data in tab 1 is
 * copied into tab 2
 */
export class SessionListener {
  sessionCallback = null;
  constructor(sessionCallback) {
    this.sessionCallback = sessionCallback;

  }


  onSessionEvent(event) {
    this.sessionCallback.triggerSessionCallback(event);
  }



  onTBD() {
  const channel = new BroadcastChannel('app-data');
  channel.addEventListener('message', (event) => {
    if (event.data.message == "re-register-needed") {
      /** Send the hash to app seeking for reregistration */
      sessionCallback.initializeSession('re-register', event.data.hashMsg);
      sessionCallback.triggerSessionCallback();
    } else if (event.data.message == 'logout') {
      sessionCallback.initializeSession('logout', '');
      sessionCallback.triggerSessionCallback();
    } else if (event.data.message == 'login-successful') {
      const loginObj = {
        phone: window.localStorage.getItem('currentUser'),
        tabHash: event.data.tabHash
      }
      sessionCallback.initializeSession('login-successful', JSON.stringify(loginObj));
      sessionCallback.triggerSessionCallback();
    } else if (window.sessionStorage.getItem("activeSessionTab") !== null) {
      if (event.data.callState !== null && event.data.callState !== undefined) {
        sessionCallback.initializeSession(event.data.callState, event.data.callNumber);
      }
      sessionCallback.triggerSessionCallback();
    }
  });
  /**
   * Add listeners for all storage events
   */
  window.localStorage.setItem('REQUESTING_SHARED_CREDENTIALS', Date.now().toString())
  window.localStorage.removeItem('REQUESTING_SHARED_CREDENTIALS')

  const credentials = {
    user: window.sessionStorage.getItem('user'),
    selectedPhone: window.localStorage.getItem('selectedPhone'),
  }

  window.addEventListener('storage', (event) => {
    /**
    * When user tries to duplicate tab, this gets called in Tab1
    */
    if (event.key === 'REQUESTING_SHARED_CREDENTIALS' && credentials) {
      window.localStorage.setItem('CREDENTIALS_SHARING', JSON.stringify(credentials))
      window.localStorage.removeItem('CREDENTIALS_SHARING')
      /**
       * When the data is to be shared between two tabs then add the current state onto that session storage
       */
      //sessionCallback.triggerSessionCallback();
    }
    if (event.key === 'CREDENTIALS_SHARING' && credentials !== null) {

      const newData = JSON.parse(event.newValue);
      if (event.newValue !== null) {
        window.sessionStorage.setItem('user', newData.user);
        window.sessionStorage.setItem('isAuthenticated', true);
      }
      /**
       * Fetch the array of tabs and add the tab, put it on session also
       */
      const currentTab = {
        tabID: uuidv4(),
        tabType: 'child',
        tabStatus: 'active'
      }
      const tabArr = JSON.parse(window.localStorage.getItem('tabs'));
      /** Based on activeSessionTab id fetch the type */

      if (window.sessionStorage.getItem('activeSessionTab') !== null && window.sessionStorage.getItem('activeSessionTab') == "parent0") {
        logger.log('Adding a child tab spawned from parent....');
        /** In order to keep tabID same for all the child ones, we are using below IF to distinguish */

        if (tabArr.length > 1 && window.sessionStorage.getItem('activeSessionTab') == "parent0") {
          if (!document.hidden) {
            const lastIndex = (tabArr.length) - 1;
            window.sessionStorage.setItem('activeSessionTab', tabArr[lastIndex].tabID);
          }

        } else {
          tabArr.push(currentTab);
          window.localStorage.removeItem('tabs');
          window.localStorage.setItem('tabs', JSON.stringify(tabArr));
          const lastIndex = (tabArr.length) - 1;
          window.sessionStorage.setItem('activeSessionTab', tabArr[lastIndex].tabID);
        }


      } else {
        /** pull from the tabarray and then add it to the session storage */

        const lastIndex = (tabArr.length) - 1;
        window.sessionStorage.setItem('activeSessionTab', tabArr[lastIndex].tabID);
      }
      //window.localStorage.setItem('selectedPhone', newData.selectedPhone);
      return;
      //}

    }
    /**
     * When a tab is closed
     */
    if (event.key === 'CREDENTIALS_FLUSH' && credentials) {
      window.sessionStorage.removeItem('user');
      window.sessionStorage.removeItem('selectedPhone');
      window.sessionStorage.removeItem('isAuthenticated')
      window.sessionStorage.removeItem('activeSession');
    }
    /**
     * When any tab is closed, active call gets terminated
     */
    if (event.key === 'CALL_FLUSH') {
      window.sessionStorage.removeItem('activeSession');
    }
  });
}
};