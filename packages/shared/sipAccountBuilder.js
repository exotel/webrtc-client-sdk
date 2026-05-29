/**
 * Build a SIP account info object from a config entry.
 */
export function buildSipAccountInfo(config, username, options = {}) {
  if (!config) {
    return null;
  }

  const port = config.Port;
  const accountName = username || config.Username;

  const sipAccountInfo = {
    userName: accountName,
    authUser: config.Username,
    sipdomain: config.Domain,
    domain: `${config.HostServer}:${port}`,
    displayname: config.DisplayName,
    secret: config.Password,
    accontName: accountName,
    sipUri: `wss://${config.Username}@${config.Domain}:${port}`,
    security: config.Security,
    port,
    contactHost: options.contactHost || window.localStorage.getItem('contactHost'),
    endpoint: config.EndPoint,
  };

  if (config.preferredCodec) {
    sipAccountInfo.preferredCodec = config.preferredCodec;
  }
  if (config.preferredCodecOptions) {
    sipAccountInfo.preferredCodecOptions = config.preferredCodecOptions;
  }
  if (config.audioProcessing) {
    sipAccountInfo.audioProcessing = config.audioProcessing;
  }
  if (config.customAudioProcessing) {
    sipAccountInfo.customAudioProcessing = config.customAudioProcessing;
  }
  if (config.autoAudioDeviceChange !== undefined) {
    sipAccountInfo.autoAudioDeviceChange = config.autoAudioDeviceChange;
  }

  return sipAccountInfo;
}

/**
 * Find config index and entry by username.
 */
export function findConfigByUsername(configObj, username) {
  const configs = typeof configObj === 'string' ? JSON.parse(configObj) : configObj;
  let index = -1;
  configs.find((item, i) => {
    if (item.Username === username) {
      index = i;
      return true;
    }
    return false;
  });
  return { index, config: index >= 0 ? configs[index] : null, configs };
}

/**
 * Default audio quality fields for config templates (all opt-in).
 */
export const DEFAULT_AUDIO_CONFIG = {
  preferredCodec: '',
  preferredCodecOptions: {},
  audioProcessing: {
    noiseSuppression: false,
    echoCancellation: true,
    autoGainControl: true,
  },
  customAudioProcessing: {
    enabled: false,
    mode: 'off',
  },
  autoAudioDeviceChange: false,
};
