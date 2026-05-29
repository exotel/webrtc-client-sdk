export function safeParseJSON(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getConfigArray() {
  return safeParseJSON(window.localStorage.getItem('configObj'), []);
}

export function getRegisteredUsers() {
  return safeParseJSON(window.localStorage.getItem('registeredUsers'), []);
}

export function isFlagSet(flagStr) {
  return window.localStorage.getItem(flagStr);
}
