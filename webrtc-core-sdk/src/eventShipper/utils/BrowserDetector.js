/**
 * Browser and OS detection utility
 */
export class BrowserDetector {
    /**
     * Detect browser information
     * @returns {Object} {browserName, browserVersion}
     */
    static detectBrowser() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';

        if (ua.indexOf('Edge') > -1) {
            browserName = 'Microsoft Edge';
            browserVersion = ua.substring(ua.indexOf('Edge') + 5).split(' ')[0];
        } else if (ua.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = ua.substring(ua.indexOf('Chrome') + 7).split(' ')[0];
        } else if (ua.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = ua.substring(ua.indexOf('Firefox') + 8).split(' ')[0];
        } else if (ua.indexOf('Safari') > -1) {
            browserName = 'Safari';
            if (ua.indexOf('Version') > -1) {
                browserVersion = ua.substring(ua.indexOf('Version') + 8).split(' ')[0];
            } else {
                browserVersion = ua.substring(ua.indexOf('Safari') + 7).split(' ')[0];
            }
        }

        return { browserName, browserVersion };
    }

    /**
     * Detect OS information
     * @returns {Object} {osName, osVersion}
     */
    static detectOS() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        let osName = 'Unknown';
        let osVersion = 'Unknown';

        if (platform.indexOf('Win') > -1) {
            osName = 'Windows';
            if (ua.indexOf('Windows NT 10.0') > -1) osVersion = '10';
            else if (ua.indexOf('Windows NT 6.3') > -1) osVersion = '8.1';
            else if (ua.indexOf('Windows NT 6.2') > -1) osVersion = '8';
            else if (ua.indexOf('Windows NT 6.1') > -1) osVersion = '7';
        } else if (platform.indexOf('Mac') > -1) {
            osName = 'macOS';
            const match = ua.match(/OS (\d+)[._](\d+)/);
            if (match) osVersion = `${match[1]}.${match[2]}`;
        } else if (platform.indexOf('Linux') > -1) {
            osName = 'Linux';
        } else if (ua.indexOf('Android') > -1) {
            osName = 'Android';
            const match = ua.match(/Android (\d+\.\d+)/);
            if (match) osVersion = match[1];
        } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
            osName = 'iOS';
            const match = ua.match(/OS (\d+)[._](\d+)/);
            if (match) osVersion = `${match[1]}.${match[2]}`;
        }

        return { osName, osVersion };
    }

    /**
     * Get document ID (tab ID)
     * @returns {string}
     */
    static getDocumentId() {
        // Try to get from sessionStorage
        if (typeof window !== 'undefined' && window.sessionStorage) {
            const activeTab = sessionStorage.getItem('activeSessionTab');
            if (activeTab) {
                return activeTab;
            }
        }

        // Generate new ID
        const docId = `tab_${Date.now()}`;
        if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.setItem('activeSessionTab', docId);
        }
        return docId;
    }

    /**
     * Get SDK version from package.json
     * @returns {string}
     */
    static getSDKVersion() {
        // SDK version is hardcoded, can be read from package.json during build
        return '3.0.4';
    }
}

