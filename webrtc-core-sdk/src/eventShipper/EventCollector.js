import { EVENT_TYPES } from './constants/EventTypes.js';

/**
 * Handles event collection and building
 */
export class EventCollector {
    constructor(eventShipper) {
        this.eventShipper = eventShipper;
        this.eventBuilder = this.eventShipper.eventBuilder;
    }

    /**
     * Build a complete event object
     * @param {string} eventType - Event type
     * @param {Object} eventData - Event data
     * @param {Object} additionalTags - Additional event tags
     * @returns {Promise<Object>} - Complete event object
     */
    async buildEvent(eventType, eventData, additionalTags = {}) {
        const eventTags = {
            ...this.eventShipper.eventTags,
            ...additionalTags
        };

        return this.eventBuilder.build({
            eventType,
            eventData,
            eventTags,
            timestamp: Date.now()
        });
    }

    /**
     * Track registration event
     * @param {string} status - 'success' or 'failure'
     * @param {Object} details - Additional details
     */
    async trackRegistration(status, details = {}) {
        const eventData = {
            [`registration_${status}`]: 1
        };

        if (details.reason) {
            eventData.registration_failure_reason = details.reason;
        }

        if (details.duration !== undefined) {
            eventData.registration_duration = details.duration;
        }

        const event = await this.buildEvent(
            `registration_${status}`,
            eventData
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }

    /**
     * Track WebSocket event
     * @param {string} status - 'connected' or 'failure'
     * @param {Object} details - Additional details
     */
    async trackWebSocket(status, details = {}) {
        const eventData = {
            [`websocket_${status === 'connected' ? 'connected_number' : 'failure'}`]: 1,
            ...details
        };

        const event = await this.buildEvent(
            `websocket_${status}`,
            eventData
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }

    /**
     * Track call event
     * @param {string} eventType - Call event type
     * @param {Object} callData - Call data
     * @param {Object} session - SIP session object (optional, for extracting call_id/call_sid)
     */
    async trackCall(eventType, callData = {}, session = null) {
        // Extract call_id and call_sid from callData (only use if non-empty)
        let callId = (callData.call_id && callData.call_id !== '') ? callData.call_id : (callData.callId && callData.callId !== '') ? callData.callId : null;
        let callSid = (callData.call_sid && callData.call_sid !== '') ? callData.call_sid : (callData.callSid && callData.callSid !== '') ? callData.callSid : null;
        let legSid = (callData.leg_sid && callData.leg_sid !== '') ? callData.leg_sid : (callData.legSid && callData.legSid !== '') ? callData.legSid : null;

        // If not provided, try to extract from session
        if ((!callId || !callSid) && session) {
            const callInfo = this.eventShipper.extractCallInfoFromSession(session);
            callId = callId || callInfo.call_id || null;
            callSid = callSid || callInfo.call_sid || null;
            legSid = legSid || callInfo.leg_sid || null;
        }

        // If still not found, use stored call info from EventShipper (populated by onRecieveInvite or previous call events)
        if (!callId || !callSid) {
            const storedCallInfo = this.eventShipper.getCurrentCallInfo();
            callId = callId || storedCallInfo.call_id || null;
            callSid = callSid || storedCallInfo.call_sid || null;
            legSid = legSid || storedCallInfo.leg_sid || null;
        }

        // Debug logging if call_id or call_sid is still missing
        if (!callId || !callSid) {
            console.log(`EventCollector: trackCall(${eventType}) - Missing call_id or call_sid:`, {
                callId: callId,
                callSid: callSid,
                legSid: legSid,
                hasSession: !!session,
                storedCallInfo: this.eventShipper.getCurrentCallInfo(),
                callData: callData
            });
        }

        // Store call info in EventShipper for use in RTP stats and WebRTC connection state
        if (callId || callSid || legSid) {
            this.eventShipper.setCurrentCallInfo({ call_id: callId, call_sid: callSid, leg_sid: legSid });
        }

        // If call ends, clear the stored call info
        if (eventType === 'ended') {
            this.eventShipper.clearCurrentCallInfo();
        }

        // Update callData with extracted values (only include if we have non-null values)
        const updatedCallData = { ...callData };
        if (callId) updatedCallData.call_id = callId;
        if (callSid) updatedCallData.call_sid = callSid;
        if (legSid) updatedCallData.leg_sid = legSid;

        // Also add call_id, call_sid, and leg_sid to event_tags for aggregation and filtering
        const additionalTags = {};
        if (callId) additionalTags.call_id = callId;
        if (callSid) additionalTags.call_sid = callSid;
        if (legSid) additionalTags.leg_sid = legSid;

        const event = await this.buildEvent(
            `call_${eventType}`,
            updatedCallData,
            additionalTags
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }

    /**
     * Track RTP stats
     * @param {Object} rtpStats - RTP statistics
     * @param {Object} session - SIP session object (optional, for extracting call_id/call_sid)
     */
    async trackRTPStats(rtpStats, session = null) {
        const eventData = {
            rtt: rtpStats.rtt,
            jitter: rtpStats.jitter,
            packet_loss_percentage: rtpStats.packetLossPercentage
        };

        // Extract call_id and call_sid from various sources
        let callId = rtpStats.callId || rtpStats.call_id;
        let callSid = rtpStats.callSid || rtpStats.call_sid;
        let legSid = rtpStats.legSid || rtpStats.leg_sid;

        // If not provided, try to extract from session
        if ((!callId || !callSid) && session) {
            const callInfo = this.eventShipper.extractCallInfoFromSession(session);
            callId = callId || callInfo.call_id;
            callSid = callSid || callInfo.call_sid;
            legSid = legSid || callInfo.leg_sid;
        }

        // If still not found, use stored call info from EventShipper
        if (!callId || !callSid) {
            const storedCallInfo = this.eventShipper.getCurrentCallInfo();
            callId = callId || storedCallInfo.call_id;
            callSid = callSid || storedCallInfo.call_sid;
            legSid = legSid || storedCallInfo.leg_sid;
        }

        const additionalTags = {};
        if (callId) additionalTags.call_id = callId;
        if (callSid) additionalTags.call_sid = callSid;
        if (legSid) additionalTags.leg_sid = legSid;

        const event = await this.buildEvent(
            EVENT_TYPES.RTP_STATS,
            eventData,
            additionalTags
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }

    /**
     * Track WebRTC connection state
     * @param {Object} connectionState - Connection state data
     * @param {Object} session - SIP session object (optional, for extracting call_id/call_sid)
     */
    async trackWebRTCConnection(connectionState, session = null) {
        // Extract call_id and call_sid if available
        let callId = connectionState.call_id || connectionState.callId;
        let callSid = connectionState.call_sid || connectionState.callSid;
        let legSid = connectionState.leg_sid || connectionState.legSid;

        // If not provided, try to extract from session
        if ((!callId || !callSid) && session) {
            const callInfo = this.eventShipper.extractCallInfoFromSession(session);
            callId = callId || callInfo.call_id;
            callSid = callSid || callInfo.call_sid;
            legSid = legSid || callInfo.leg_sid;
        }

        // If still not found, use stored call info from EventShipper
        if (!callId || !callSid) {
            const storedCallInfo = this.eventShipper.getCurrentCallInfo();
            callId = callId || storedCallInfo.call_id;
            callSid = callSid || storedCallInfo.call_sid;
            legSid = legSid || storedCallInfo.leg_sid;
        }

        const additionalTags = {};
        if (callId) additionalTags.call_id = callId;
        if (callSid) additionalTags.call_sid = callSid;
        if (legSid) additionalTags.leg_sid = legSid;

        const event = await this.buildEvent(
            EVENT_TYPES.WEBRTC_CONNECTION_STATE,
            connectionState,
            additionalTags
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }

    /**
     * Track performance metrics
     * @param {Object} perfData - Performance data
     */
    async trackPerformance(perfData) {
        const event = await this.buildEvent(
            EVENT_TYPES.PERFORMANCE_METRICS,
            perfData
        );

        return await this.eventShipper.eventStorage.insertEvent(event);
    }
}

