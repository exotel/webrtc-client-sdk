/**
 * Fetch tab details from tabID stored in localStorage.
 */
export function fetchTabInfo(tabID) {
  const tabArr = JSON.parse(window.localStorage.getItem('tabs') || '[]');
  for (let x = 0; x < tabArr.length; x++) {
    if (tabArr[x].tabID === tabID) {
      return tabArr[x];
    }
  }
  return null;
}

export function getTabs() {
  return JSON.parse(window.localStorage.getItem('tabs') || '[]');
}

export function setTabs(tabs) {
  window.localStorage.setItem('tabs', JSON.stringify(tabs));
}

export function ensureParentTab() {
  const tabs = getTabs();
  const parentIndex = tabs.findIndex((item) => item.tabID === 'parent0');

  if (tabs.length === 0 || parentIndex === -1) {
    const tabData = {
      tabID: 'parent0',
      tabType: 'parent',
      tabStatus: 'active',
    };
    const tabArr = [tabData, ...tabs.filter((t) => t.tabID !== 'parent0')];
    window.sessionStorage.setItem('activeSessionTab', 'parent0');
    setTabs(tabArr);
    return tabArr;
  }

  if (tabs.length === 1 && tabs[0].tabID === 'parent0') {
    window.sessionStorage.setItem('activeSessionTab', 'parent0');
  }

  return tabs;
}
