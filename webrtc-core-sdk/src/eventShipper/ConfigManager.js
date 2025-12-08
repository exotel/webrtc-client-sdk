/**
 * Configuration management
 */
export class ConfigManager {
    constructor() {
        this.config = null;
        this.configCacheKey = 'webrtc_metrics_config';
        this.configCacheExpiry = 3600000; // 1 hour
    }

    /**
     * Fetch configuration from API
     * @param {Object} sipAccountInfo - SIP account info
     * @returns {Promise<Object>}
     */
    async fetchConfig(sipAccountInfo) {
        try {
            // Try to get cached config
            const cached = this.getCachedConfig();
            if (cached) {
                this.config = cached;
                return cached;
            }

            // Fetch from API
            const configUrl = this.buildConfigUrl(sipAccountInfo);
            const response = await fetch(configUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const config = await response.json();
                this.config = this.mergeWithDefaults(config);
                this.cacheConfig(this.config);
                return this.config;
            } else {
                // Use defaults if API fails
                this.config = this.getDefaultConfig();
                return this.config;
            }
        } catch (error) {
            console.warn('Failed to fetch config, using defaults:', error);
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    /**
     * Get configuration
     * @returns {Object}
     */
    getConfig() {
        return this.config || this.getDefaultConfig();
    }

    /**
     * Extract account_sid from SIP domain
     * Pattern: {account_sid}.voip.exotel.com -> {account_sid}
     * @param {string} sipdomain - SIP domain (e.g., "sprinklr2m.voip.exotel.com")
     * @returns {string} - Extracted account_sid or empty string
     */
    extractAccountSidFromSipDomain(sipdomain) {
        if (!sipdomain || typeof sipdomain !== 'string') {
            return '';
        }

        // Pattern: {account_sid}.voip.exotel.com
        const pattern = /^([^.]+)\.voip\.exotel\.com$/i;
        const match = sipdomain.match(pattern);
        
        if (match && match[1]) {
            return match[1];
        }

        // Fallback: try to extract first part before first dot
        const parts = sipdomain.split('.');
        if (parts.length > 0 && parts[0]) {
            return parts[0];
        }

        return '';
    }

    /**
     * Get account_sid from sipAccountInfo
     * Priority: 1. sipAccountInfo.accountSid, 2. Extract from sipdomain, 3. Empty string
     * @param {Object} sipAccountInfo - SIP account information
     * @returns {string} - Account SID
     */
    getAccountSid(sipAccountInfo) {
        // First, try to use accountSid if provided
        if (sipAccountInfo.accountSid) {
            return sipAccountInfo.accountSid;
        }

        // Second, try to extract from sipdomain
        const sipdomain = sipAccountInfo.sipdomain || sipAccountInfo.domain || '';
        if (sipdomain) {
            const extracted = this.extractAccountSidFromSipDomain(sipdomain);
            if (extracted) {
                return extracted;
            }
        }

        return '';
    }

    /**
     * Build config URL
     * @param {Object} sipAccountInfo - SIP account info
     * @returns {string}
     */
    buildConfigUrl(sipAccountInfo) {
        // Use localhost config endpoint if available, otherwise use default endpoint
        const baseUrl = 'http://localhost:8080/api/v1/config';
        const accountSid = this.getAccountSid(sipAccountInfo);
        const params = new URLSearchParams({
            account_sid: accountSid,
            user_name: sipAccountInfo.userName || ''
        });
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Get default configuration
     * @returns {Object}
     */
    getDefaultConfig() {
        // Allow endpoint override via window variable for testing
        // Default to localhost API endpoint
        const defaultEndpoint = window.METRICS_ENDPOINT || "http://localhost:8080/api/v1/events";
        
        return {
            enabled: true,
            dispatch_interval: 60000,
            max_retries: 3,
            batch_size: 10000,
            max_storage_age: 604800000, // 7 days
            endpoint: defaultEndpoint
        };
    }

    /**
     * Merge with defaults
     * @param {Object} config - Config from API
     * @returns {Object}
     */
    mergeWithDefaults(config) {
        return {
            ...this.getDefaultConfig(),
            ...config
        };
    }

    /**
     * Get cached config
     * @returns {Object|null}
     */
    getCachedConfig() {
        try {
            if (typeof localStorage === 'undefined') return null;
            const cached = localStorage.getItem(this.configCacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < this.configCacheExpiry) {
                    return parsed.config;
                }
            }
        } catch (error) {
            // Ignore cache errors
        }
        return null;
    }

    /**
     * Cache config
     * @param {Object} config - Config to cache
     */
    cacheConfig(config) {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(this.configCacheKey, JSON.stringify({
                config,
                timestamp: Date.now()
            }));
        } catch (error) {
            // Ignore cache errors
        }
    }
}

