const MAX_LOG_LINES = 1000;
const LOG_STORAGE_KEY = 'webrtc_sdk_logs';

const LogManager = {
  onLog(level, msg, args = []) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${msg} ${args.map(arg => JSON.stringify(arg)).join(" ")}`.trim();

    let logs = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY)) || [];
    logs.push(line);
    if (logs.length > MAX_LOG_LINES) {
      logs = logs.slice(-MAX_LOG_LINES); // rotate
    }

    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  },

  getLogs() {
    return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY)) || [];
  },

  downloadLogs(filename) {
    if (!filename) {
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // Gets YYYY-MM-DD
        filename = `webrtc_sdk_logs_${formattedDate}.txt`;
    }
    const blob = new Blob([LogManager.getLogs().join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

};

export default LogManager;
