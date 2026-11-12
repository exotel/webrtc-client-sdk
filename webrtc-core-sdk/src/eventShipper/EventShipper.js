import { BrowserDetector } from './utils/BrowserDetector.js';
import { EventBuilder } from './EventBuilder.js';
import { EventCollector } from './EventCollector.js';
import { EventStorage } from './EventStorage.js';
import { EventDispatcher } from './EventDispatcher.js';
import { ConfigManager } from './ConfigManager.js';
import { EVENT_TYPES } from './constants/EventTypes.js';
import { dispatcherRegistry } from './DispatcherRegistry.js';

/**
 * Main orchestrator class for event collection and shipping
 * Singleton pattern - one instance per SDK initialization
 */
export class EventShipper {
    constructor(config = {}) {
        this.config = config;
        this.eventBuilder = new EventBuilder();
        this.eventCollector = null;
        this.eventStorage = null;
        this.eventDispatcher = null;
        this.configManager = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.eventTags = {};  // Cached event tags
        this.sdkObjectId = null;
        this.accountSid = null;  // Account SID for dispatcher registry
        this.initStartTime = null;
        this.eventQueue = [];  // Queue events during initialization
        this.currentCallInfo = {  // Store current call information for RTP stats and WebRTC connection state
            call_id: null,
            call_sid: null,
            leg_sid: null
        };
    }

    /**
     * Initialize the event shipper
     * @param {Object} sipAccountInfo - SIP account information
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - Success status
     */
    async init(sipAccountInfo, options = {}) {
        if (this.isInitialized) {
            return true;
        }

        if (this.isInitializing) {
            // Wait for ongoing initialization
            while (this.isInitializing && !this.isInitialized) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            return this.isInitialized;
        }

        this.isInitializing = true;

        try {
            this.initStartTime = performance.now();

            // 1. Initialize configuration manager
            this.configManager = new ConfigManager();
            await this.configManager.fetchConfig(sipAccountInfo);

            // 2. Build event tags
            this.eventTags = await this.buildEventTags(sipAccountInfo);

            // 3. Store account_sid for dispatcher registry (extract from sipdomain if needed)
            this.accountSid = this.getAccountSid(sipAccountInfo);

            // 4. Generate SDK object ID
            this.sdkObjectId = this.generateUUID();
            this.eventTags.sdk_object_id = this.sdkObjectId;

            // 5. Initialize storage
            this.eventStorage = new EventStorage();
            await this.eventStorage.init();

            // 6. Initialize event collector
            this.eventCollector = new EventCollector(this);

            // 7. Get or create dispatcher for this account_sid (ensures only one per account)
            this.eventDispatcher = dispatcherRegistry.getOrCreateDispatcher(this.accountSid, this);

            // 8. Mark as initialized before tracking events
            this.isInitialized = true;
            this.isInitializing = false;

            // 9. Process queued events
            await this.processEventQueue();

            // 10. Track SDK initialization event
            const initDuration = Math.round(performance.now() - this.initStartTime);
            await this.trackEvent(EVENT_TYPES.SDK_INIT, {
                sdk_init_duration: initDuration
            });

            // 11. Start dispatcher (only if not already running for this account_sid)
            if (!this.eventDispatcher.isRunning) {
                this.eventDispatcher.start();
            }

            return true;
        } catch (error) {
            console.error('EventShipper init failed:', error);
            this.isInitializing = false;
            // Still mark as initialized to prevent blocking
            this.isInitialized = true;
            await this.processEventQueue();
            return false;
        }
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
     * Build event tags from SIP account info and browser detection
     * @param {Object} sipAccountInfo - SIP account information
     * @returns {Promise<Object>} - Event tags
     */
    async buildEventTags(sipAccountInfo) {
        const browser = BrowserDetector.detectBrowser();
        const os = BrowserDetector.detectOS();
        const accountSid = this.getAccountSid(sipAccountInfo);

        return {
            sdk_version: BrowserDetector.getSDKVersion(),
            browser_name: browser.browserName,
            browser_version: browser.browserVersion,
            os_name: os.osName,
            os_version: os.osVersion,
            account_sid: accountSid,
            user_name: sipAccountInfo.userName || '',
            host_server: sipAccountInfo.domain || sipAccountInfo.sipdomain || '',
            domain: sipAccountInfo.domain || '',
            document_id: BrowserDetector.getDocumentId()
        };
    }

    /**
     * Track an event
     * @param {string} eventType - Type of event
     * @param {Object} eventData - Event-specific data
     * @param {Object} additionalTags - Additional tags to attach
     * @returns {Promise<string>} - Event ID
     */
    async trackEvent(eventType, eventData = {}, additionalTags = {}) {
        // If not initialized yet, queue the event
        if (!this.isInitialized) {
            if (this.isInitializing) {
                // Queue during initialization
                this.eventQueue.push({ eventType, eventData, additionalTags });
                return null;
            }
            // If not initializing, try to initialize (shouldn't happen, but safe guard)
            return null;
        }

        try {
            const event = await this.eventCollector.buildEvent(
                eventType,
                eventData,
                additionalTags
            );

            const eventId = await this.eventStorage.insertEvent(event);
            return eventId;
        } catch (error) {
            console.error('Failed to track event:', error);
            return null;
        }
    }

    /**
     * Process queued events after initialization
     * @private
     */
    async processEventQueue() {
        if (this.eventQueue.length === 0) {
            return;
        }

        const queue = [...this.eventQueue];
        this.eventQueue = [];

        for (const queuedEvent of queue) {
            try {
                await this.trackEvent(
                    queuedEvent.eventType,
                    queuedEvent.eventData,
                    queuedEvent.additionalTags
                );
            } catch (error) {
                console.error('Failed to process queued event:', error);
            }
        }
    }

    /**
     * Start the dispatcher
     */
    startDispatcher() {
        if (this.eventDispatcher) {
            this.eventDispatcher.start();
        }
    }

    /**
     * Stop the dispatcher
     */
    stopDispatcher() {
        if (this.eventDispatcher) {
            this.eventDispatcher.stop();
        }
    }

    /**
     * Set current call information (call_id, call_sid, leg_sid)
     * This allows core SDK users to set call info without using client SDK
     * @param {Object} callInfo - Call information {call_id, call_sid, leg_sid}
     */
    setCurrentCallInfo(callInfo = {}) {
        this.currentCallInfo = {
            call_id: callInfo.call_id || callInfo.callId || null,
            call_sid: callInfo.call_sid || callInfo.callSid || null,
            leg_sid: callInfo.leg_sid || callInfo.legSid || null
        };
    }

    /**
     * Clear current call information
     */
    clearCurrentCallInfo() {
        this.currentCallInfo = {
            call_id: null,
            call_sid: null,
            leg_sid: null
        };
    }

    /**
     * Get current call information
     * @returns {Object} Current call info {call_id, call_sid, leg_sid}
     */
    getCurrentCallInfo() {
        return { ...this.currentCallInfo };
    }

    /**
     * Extract call_id and call_sid from SIP session or peer connection
     * Attempts to extract from various sources for core SDK users
     * @param {Object} session - SIP session object (optional)
     * @param {Object} peerConnection - RTCPeerConnection object (optional)
     * @returns {Object} Call info {call_id, call_sid}
     */
    extractCallInfoFromSession(session = null, peerConnection = null) {
        let callId = null;
        let callSid = null;
        let legSid = null;

        // Helper function to extract from headers object
        const extractFromHeaders = (headers) => {
            if (!headers) return { callId: null, callSid: null, legSid: null };
            
            let cId = null;
            let cSid = null;
            let lSid = null;
            
            if (headers['Call-ID']) {
                cId = Array.isArray(headers['Call-ID']) 
                    ? headers['Call-ID'][0]?.raw || headers['Call-ID'][0]
                    : headers['Call-ID'];
            }
            if (headers['X-Exotel-Callsid']) {
                cSid = Array.isArray(headers['X-Exotel-Callsid'])
                    ? headers['X-Exotel-Callsid'][0]?.raw || headers['X-Exotel-Callsid'][0]
                    : headers['X-Exotel-Callsid'];
            }
            if (headers['LegSid']) {
                lSid = Array.isArray(headers['LegSid'])
                    ? headers['LegSid'][0]?.raw || headers['LegSid'][0]
                    : headers['LegSid'];
            }
            
            return { callId: cId, callSid: cSid, legSid: lSid };
        };

        // Try to extract from SIP session
        if (session) {
            // 1. Try incomingInviteRequest.message.headers (for incoming calls - this is the PRIMARY path)
            // This is where headers are stored for incoming calls in SIP.js
            if (session.incomingInviteRequest && session.incomingInviteRequest.message) {
                const headers = session.incomingInviteRequest.message.headers;
                const extracted = extractFromHeaders(headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 2. Try session.request.callId (for outgoing calls - Call-ID is stored directly on request object)
            if (session.request && session.request.callId) {
                callId = session.request.callId;
            }
            
            // 3. Try session.request.headers (direct headers access)
            if (session.request && session.request.headers) {
                const extracted = extractFromHeaders(session.request.headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 4. Try session.callId (some SIP.js versions store it directly on session)
            if (session.callId && !callId) {
                callId = session.callId;
            }
            
            // 5. Try session.inviteRequest.message.headers (alternative path)
            if (!callId && session.inviteRequest && session.inviteRequest.message) {
                const headers = session.inviteRequest.message.headers;
                const extracted = extractFromHeaders(headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 6. Try session.request.message.headers (another alternative)
            if (!callId && session.request && session.request.message) {
                const headers = session.request.message.headers;
                const extracted = extractFromHeaders(headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 7. Try session.request.message.callId (if message object has callId directly)
            if (!callId && session.request && session.request.message && session.request.message.callId) {
                callId = session.request.message.callId;
            }
            
            // 8. For outgoing calls, try to get from session's dialog
            if (session.dialog) {
                // Try to get Call-ID from dialog
                if (session.dialog.callId && !callId) {
                    callId = session.dialog.callId;
                }
                // Also check dialog's request/response headers
                if (session.dialog.request && session.dialog.request.headers) {
                    const extracted = extractFromHeaders(session.dialog.request.headers);
                    callId = extracted.callId || callId;
                    callSid = extracted.callSid || callSid;
                    legSid = extracted.legSid || legSid;
                }
                // Check dialog's response headers (for outgoing calls, response might have call_sid)
                if (session.dialog.response && session.dialog.response.headers) {
                    const extracted = extractFromHeaders(session.dialog.response.headers);
                    callId = extracted.callId || callId;
                    callSid = extracted.callSid || callSid;
                    legSid = extracted.legSid || legSid;
                }
                // Check dialog's response message headers (alternative path)
                if (session.dialog.response && session.dialog.response.message && session.dialog.response.message.headers) {
                    const extracted = extractFromHeaders(session.dialog.response.message.headers);
                    callId = extracted.callId || callId;
                    callSid = extracted.callSid || callSid;
                    legSid = extracted.legSid || legSid;
                }
            }
            
            // 6. Check session's response headers directly (for outgoing calls after response received)
            if (session.response && session.response.headers) {
                const extracted = extractFromHeaders(session.response.headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 7. Check session's response message headers (alternative path)
            if (session.response && session.response.message && session.response.message.headers) {
                const extracted = extractFromHeaders(session.response.message.headers);
                callId = extracted.callId || callId;
                callSid = extracted.callSid || callSid;
                legSid = extracted.legSid || legSid;
            }
            
            // 8. Debug: Log session structure if we still don't have call_id or call_sid
            if (!callId || !callSid) {
                console.log('EventShipper: extractCallInfoFromSession - Missing call_id or call_sid. Current values:', {
                    callId: callId,
                    callSid: callSid,
                    legSid: legSid
                });
                console.log('EventShipper: Session structure:', {
                    hasIncomingInviteRequest: !!session.incomingInviteRequest,
                    hasRequest: !!session.request,
                    hasInviteRequest: !!session.inviteRequest,
                    hasResponse: !!session.response,
                    hasDialog: !!session.dialog,
                    direction: session.direction,
                    sessionKeys: Object.keys(session).slice(0, 30) // First 30 keys to avoid huge logs
                });
                
                // Try to log what's actually in incomingInviteRequest if it exists
                if (session.incomingInviteRequest && session.incomingInviteRequest.message && session.incomingInviteRequest.message.headers) {
                    const headers = session.incomingInviteRequest.message.headers;
                    console.log('EventShipper: incomingInviteRequest headers:', {
                        hasCallId: !!headers['Call-ID'],
                        hasCallSid: !!headers['X-Exotel-Callsid'],
                        hasLegSid: !!headers['LegSid'],
                        headerKeys: Object.keys(headers).slice(0, 15)
                    });
                }
                
                // Log dialog structure if it exists
                if (session.dialog) {
                    console.log('EventShipper: Dialog structure:', {
                        hasCallId: !!session.dialog.callId,
                        hasRequest: !!session.dialog.request,
                        hasResponse: !!session.dialog.response,
                        requestHasHeaders: !!(session.dialog.request && session.dialog.request.headers),
                        responseHasHeaders: !!(session.dialog.response && session.dialog.response.headers)
                    });
                    
                    if (session.dialog.response && session.dialog.response.headers) {
                        const responseHeaders = session.dialog.response.headers;
                        console.log('EventShipper: Dialog response headers:', {
                            hasCallId: !!responseHeaders['Call-ID'],
                            hasCallSid: !!responseHeaders['X-Exotel-Callsid'],
                            hasLegSid: !!responseHeaders['LegSid'],
                            headerKeys: Object.keys(responseHeaders).slice(0, 15)
                        });
                    }
                }
            }
        }

        // If we found call info, store it
        if (callId || callSid || legSid) {
            this.setCurrentCallInfo({ call_id: callId, call_sid: callSid, leg_sid: legSid });
        }

        return {
            call_id: callId || this.currentCallInfo.call_id,
            call_sid: callSid || this.currentCallInfo.call_sid,
            leg_sid: legSid || this.currentCallInfo.leg_sid
        };
    }

    /**
     * Generate UUID
     * @returns {string}
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

