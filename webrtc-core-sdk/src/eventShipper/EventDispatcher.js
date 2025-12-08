/**
 * Background dispatcher for shipping events
 */
export class EventDispatcher {
    constructor(eventShipper) {
        this.eventShipper = eventShipper;
        this.intervalId = null;
        this.statusIntervalId = null;
        this.isRunning = false;
        this.config = null;
    }

    /**
     * Start dispatcher
     */
    start() {
        if (this.isRunning) {
            console.log('EventDispatcher: Already running, skipping start');
            return;
        }

        this.config = this.eventShipper.configManager.getConfig();
        
        if (!this.config.enabled) {
            console.log('EventDispatcher: Disabled in config, not starting');
            return;
        }

        const interval = this.config.dispatch_interval || 30000;
        const accountSid = this.eventShipper.accountSid || '';

        this.intervalId = setInterval(() => {
            this.dispatchCycle();
        }, interval);

        this.isRunning = true;
        console.log(`EventDispatcher: ✅ Started for account_sid="${accountSid || '(empty)'}" with interval=${interval}ms`);
        
        // Log periodic status to confirm dispatcher is running
        this.statusIntervalId = setInterval(() => {
            if (this.isRunning) {
                console.log(`EventDispatcher: 🔄 Running (account_sid="${accountSid || '(empty)'}")`);
            }
        }, interval * 4); // Log every 4 cycles
    }

    /**
     * Stop dispatcher
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.statusIntervalId) {
            clearInterval(this.statusIntervalId);
            this.statusIntervalId = null;
        }
        this.isRunning = false;
        const accountSid = this.eventShipper?.accountSid || '';
        console.log(`EventDispatcher: ⏹️ Stopped for account_sid="${accountSid || '(empty)'}"`);
    }

    /**
     * Dispatch cycle
     * @returns {Promise<void>}
     */
    async dispatchCycle() {
        try {
            // Fetch events for this account_sid (all SDK instances with same account_sid)
            const accountSid = this.eventShipper.accountSid || '';
            const events = await this.eventShipper.eventStorage.fetchPendingEvents(
                this.config.batch_size || 10,
                null, // sdkObjectId - not filtering by SDK instance
                accountSid // Filter by account_sid instead
            );

            if (events.length === 0) {
                console.log(`EventDispatcher: No events to dispatch for account_sid="${accountSid || '(empty)'}"`);
                return;
            }

            const eventTypes = events.map(e => e.event_type);
            const uniqueEventTypes = [...new Set(eventTypes)];
            console.log(`EventDispatcher: Fetched ${events.length} events for account_sid="${accountSid || '(empty)'}". Event types: [${uniqueEventTypes.join(', ')}]. Event IDs: [${events.map(e => e.id).join(', ')}]`);

            // Aggregate events: registration (sum), websocket (sum), rtp_stats (average), webrtc_connection_state (average), performance_metrics (average per batch)
            let aggregatedEvents = this.aggregateRegistrationEvents(events);
            aggregatedEvents = this.aggregateWebSocketEvents(aggregatedEvents);
            aggregatedEvents = this.aggregateRTPStats(aggregatedEvents);
            aggregatedEvents = this.aggregateWebRTCConnectionState(aggregatedEvents);
            aggregatedEvents = this.aggregatePerformanceMetrics(aggregatedEvents);

            await this.processBatch(aggregatedEvents);
        } catch (error) {
            console.error('Dispatch cycle error:', error);
        }
    }

    /**
     * Aggregate registration events by all tags
     * Other events are returned as-is
     * @param {Array} events - Array of events
     * @returns {Array} - Array with aggregated registration events and other events
     */
    aggregateRegistrationEvents(events) {
        const registrationEvents = [];
        const otherEvents = [];

        // Separate registration events from other events
        for (const event of events) {
            if (event.event_type === 'registration_success' || event.event_type === 'registration_failure') {
                registrationEvents.push(event);
            } else {
                otherEvents.push(event);
            }
        }

        // If no registration events, return all events as-is
        if (registrationEvents.length === 0) {
            return events;
        }

        // Aggregate registration events by tags
        const aggregatedMap = new Map();

        for (const event of registrationEvents) {
            // Create a key from all event_tags (sorted for consistency)
            const tagsKey = this.createTagsKey(event.event_tags);
            
            if (!aggregatedMap.has(tagsKey)) {
                aggregatedMap.set(tagsKey, {
                    event_type: event.event_type,
                    event_tags: { ...event.event_tags },
                    event_data: { ...event.event_data },
                    timestamp: event.timestamp, // Use earliest timestamp
                    originalEventIds: [event.id] // Track original event IDs for deletion
                });
            } else {
                const aggregated = aggregatedMap.get(tagsKey);
                
                // Aggregate event_data
                for (const key in event.event_data) {
                    if (event.event_data.hasOwnProperty(key)) {
                        const value = event.event_data[key];
                        if (typeof value === 'number') {
                            // Sum numeric values (like registration_success count)
                            aggregated.event_data[key] = (aggregated.event_data[key] || 0) + value;
                        } else if (key === 'registration_duration' && typeof value === 'number') {
                            // For duration, we'll keep the average (or could keep min/max)
                            // For now, sum them and we can divide by count later if needed
                            aggregated.event_data[key] = (aggregated.event_data[key] || 0) + value;
                        } else {
                            // For other fields, keep the first value
                            if (!aggregated.event_data[key]) {
                                aggregated.event_data[key] = value;
                            }
                        }
                    }
                }
                
                // Update timestamp to earliest
                if (event.timestamp < aggregated.timestamp) {
                    aggregated.timestamp = event.timestamp;
                }
                
                // Track original event IDs
                aggregated.originalEventIds.push(event.id);
            }
        }

        // Convert aggregated map to array
        const aggregatedRegistrationEvents = Array.from(aggregatedMap.values());
        
        console.log(`EventDispatcher: Aggregated ${registrationEvents.length} registration events into ${aggregatedRegistrationEvents.length} aggregated events`);

        // Combine aggregated registration events with other events
        return [...aggregatedRegistrationEvents, ...otherEvents];
    }

    /**
     * Create a consistent key from specified event tags for grouping
     * Only uses the specified tags: sdk_version, browser_name, browser_version, os_name, os_version,
     * account_sid, user_name, host_server, domain, document_id, sdk_object_id
     * @param {Object} tags - Event tags object
     * @returns {string} - Key string
     */
    createTagsKey(tags) {
        if (!tags || typeof tags !== 'object') {
            return '{}';
        }
        
        // Only use specified tags for aggregation
        const specifiedTags = [
            'sdk_version',
            'browser_name',
            'browser_version',
            'os_name',
            'os_version',
            'account_sid',
            'user_name',
            'host_server',
            'domain',
            'document_id',
            'sdk_object_id'
        ];
        
        // Create key from specified tags only (sorted for consistency)
        const keyParts = specifiedTags
            .filter(key => tags.hasOwnProperty(key))
            .sort()
            .map(key => `${key}:${tags[key]}`);
        
        return keyParts.join('|');
    }

    /**
     * Aggregate RTP stats events by tags and call_id/call_sid
     * Calculates average values for rtt, jitter, packet_loss_percentage
     * @param {Array} events - Array of events
     * @returns {Array} - Array with aggregated RTP stats and other events
     */
    aggregateRTPStats(events) {
        const rtpStatsEvents = [];
        const otherEvents = [];

        // Separate RTP stats events from other events
        for (const event of events) {
            if (event.event_type === 'rtp_stats') {
                rtpStatsEvents.push(event);
            } else {
                otherEvents.push(event);
            }
        }

        // If no RTP stats events, return all events as-is
        if (rtpStatsEvents.length === 0) {
            return events;
        }

        // Aggregate RTP stats by tags and call_id/call_sid
        const aggregatedMap = new Map();

        for (const event of rtpStatsEvents) {
            // Create key from tags and call_id/call_sid
            const tagsKey = this.createTagsKey(event.event_tags);
            const callId = event.event_tags?.call_id || event.event_data?.call_id || 'unknown';
            const callSid = event.event_tags?.call_sid || event.event_data?.call_sid || 'unknown';
            const aggregationKey = `${tagsKey}|call_id:${callId}|call_sid:${callSid}`;
            
            if (!aggregatedMap.has(aggregationKey)) {
                aggregatedMap.set(aggregationKey, {
                    event_type: event.event_type,
                    event_tags: { ...event.event_tags },
                    event_data: {
                        rtt: event.event_data.rtt || 0,
                        jitter: event.event_data.jitter || 0,
                        packet_loss_percentage: event.event_data.packet_loss_percentage || 0
                    },
                    timestamp: event.timestamp, // Use earliest timestamp
                    originalEventIds: [event.id],
                    _count: 1, // Track count for average calculation
                    _sums: {
                        rtt: event.event_data.rtt || 0,
                        jitter: event.event_data.jitter || 0,
                        packet_loss_percentage: event.event_data.packet_loss_percentage || 0
                    }
                });
            } else {
                const aggregated = aggregatedMap.get(aggregationKey);
                
                // Accumulate sums for average calculation
                aggregated._sums.rtt += (event.event_data.rtt || 0);
                aggregated._sums.jitter += (event.event_data.jitter || 0);
                aggregated._sums.packet_loss_percentage += (event.event_data.packet_loss_percentage || 0);
                aggregated._count++;
                
                // Calculate averages
                aggregated.event_data.rtt = Math.round((aggregated._sums.rtt / aggregated._count) * 100) / 100;
                aggregated.event_data.jitter = Math.round((aggregated._sums.jitter / aggregated._count) * 100) / 100;
                aggregated.event_data.packet_loss_percentage = Math.round((aggregated._sums.packet_loss_percentage / aggregated._count) * 100) / 100;
                
                // Update timestamp to earliest
                if (event.timestamp < aggregated.timestamp) {
                    aggregated.timestamp = event.timestamp;
                }
                
                // Track original event IDs
                aggregated.originalEventIds.push(event.id);
            }
        }

        // Convert aggregated map to array and remove internal fields
        const aggregatedRTPStatsEvents = Array.from(aggregatedMap.values()).map(event => {
            delete event._count;
            delete event._sums;
            return event;
        });
        
        console.log(`EventDispatcher: Aggregated ${rtpStatsEvents.length} rtp_stats events into ${aggregatedRTPStatsEvents.length} aggregated events`);

        // Combine aggregated RTP stats with other events
        return [...aggregatedRTPStatsEvents, ...otherEvents];
    }

    /**
     * Aggregate performance metrics events per batch
     * Calculates average memory_usage across ALL performance_metrics events in the batch
     * @param {Array} events - Array of events
     * @returns {Array} - Array with aggregated performance metrics and other events
     */
    aggregatePerformanceMetrics(events) {
        const performanceEvents = [];
        const otherEvents = [];

        // Separate performance metrics events from other events
        for (const event of events) {
            if (event.event_type === 'performance_metrics') {
                performanceEvents.push(event);
            } else {
                otherEvents.push(event);
            }
        }

        // If no performance metrics events, return all events as-is
        if (performanceEvents.length === 0) {
            return events;
        }

        // Aggregate ALL performance metrics in the batch into a single event with average memory_usage
        let totalMemoryUsage = 0;
        let totalCpuUsage = 0;
        let count = 0;
        let earliestTimestamp = null;
        const originalEventIds = [];

        for (const event of performanceEvents) {
            if (event.event_data.memory_usage) {
                totalMemoryUsage += event.event_data.memory_usage;
            }
            if (event.event_data.cpu_usage) {
                totalCpuUsage += event.event_data.cpu_usage;
            }
            count++;
            
            if (!earliestTimestamp || event.timestamp < earliestTimestamp) {
                earliestTimestamp = event.timestamp;
            }
            
            originalEventIds.push(event.id);
        }

        // Create a single aggregated performance metrics event
        // Use tags from the first event (they should be similar across the batch)
        const aggregatedEvent = {
            event_type: 'performance_metrics',
            event_tags: { ...performanceEvents[0].event_tags },
            event_data: {
                memory_usage: count > 0 ? Math.round(totalMemoryUsage / count) : 0,
                cpu_usage: count > 0 ? (totalCpuUsage / count) : 0
            },
            timestamp: earliestTimestamp,
            originalEventIds: originalEventIds
        };
        
        console.log(`EventDispatcher: Aggregated ${performanceEvents.length} performance_metrics events into 1 aggregated event with average memory_usage: ${aggregatedEvent.event_data.memory_usage}`);

        // Combine aggregated performance metrics with other events
        return [aggregatedEvent, ...otherEvents];
    }

    /**
     * Aggregate WebRTC connection state events by tags and call_id/call_sid
     * Calculates average or keeps latest state per call
     * @param {Array} events - Array of events
     * @returns {Array} - Array with aggregated WebRTC connection state and other events
     */
    aggregateWebRTCConnectionState(events) {
        const webrtcStateEvents = [];
        const otherEvents = [];

        // Separate WebRTC connection state events from other events
        for (const event of events) {
            if (event.event_type === 'webrtc_connection_state') {
                webrtcStateEvents.push(event);
            } else {
                otherEvents.push(event);
            }
        }

        // If no WebRTC connection state events, return all events as-is
        if (webrtcStateEvents.length === 0) {
            return events;
        }

        // Aggregate WebRTC connection state by tags and call_id/call_sid
        const aggregatedMap = new Map();

        for (const event of webrtcStateEvents) {
            // Create key from tags and call_id/call_sid
            const tagsKey = this.createTagsKey(event.event_tags);
            const callId = event.event_tags?.call_id || 'unknown';
            const callSid = event.event_tags?.call_sid || 'unknown';
            const aggregationKey = `${tagsKey}|call_id:${callId}|call_sid:${callSid}`;
            
            if (!aggregatedMap.has(aggregationKey)) {
                aggregatedMap.set(aggregationKey, {
                    event_type: event.event_type,
                    event_tags: { ...event.event_tags },
                    event_data: { ...event.event_data },
                    timestamp: event.timestamp, // Use earliest timestamp
                    originalEventIds: [event.id]
                });
            } else {
                const aggregated = aggregatedMap.get(aggregationKey);
                
                // For connection state, keep the latest state (most recent)
                // Update event_data with latest state
                aggregated.event_data = { ...event.event_data };
                
                // Update timestamp to latest (most recent state)
                if (event.timestamp > aggregated.timestamp) {
                    aggregated.timestamp = event.timestamp;
                }
                
                // Track original event IDs
                aggregated.originalEventIds.push(event.id);
            }
        }

        // Convert aggregated map to array
        const aggregatedWebRTCStateEvents = Array.from(aggregatedMap.values());
        
        console.log(`EventDispatcher: Aggregated ${webrtcStateEvents.length} webrtc_connection_state events into ${aggregatedWebRTCStateEvents.length} aggregated events`);

        // Combine aggregated WebRTC connection state with other events
        return [...aggregatedWebRTCStateEvents, ...otherEvents];
    }

    /**
     * Aggregate WebSocket events by tags
     * Sums websocket_connected_number and websocket_failure counts
     * @param {Array} events - Array of events
     * @returns {Array} - Array with aggregated WebSocket events and other events
     */
    aggregateWebSocketEvents(events) {
        const websocketEvents = [];
        const otherEvents = [];

        // Separate WebSocket events from other events
        for (const event of events) {
            if (event.event_type === 'websocket_connected' || event.event_type === 'websocket_failure') {
                websocketEvents.push(event);
            } else {
                otherEvents.push(event);
            }
        }

        // If no WebSocket events, return all events as-is
        if (websocketEvents.length === 0) {
            return events;
        }

        // Aggregate WebSocket events by tags
        const aggregatedMap = new Map();

        for (const event of websocketEvents) {
            // Create key from tags
            const tagsKey = this.createTagsKey(event.event_tags);
            const eventType = event.event_type; // 'websocket_connected' or 'websocket_failure'
            const aggregationKey = `${tagsKey}|${eventType}`;
            
            if (!aggregatedMap.has(aggregationKey)) {
                aggregatedMap.set(aggregationKey, {
                    event_type: event.event_type,
                    event_tags: { ...event.event_tags },
                    event_data: { ...event.event_data },
                    timestamp: event.timestamp, // Use earliest timestamp
                    originalEventIds: [event.id]
                });
            } else {
                const aggregated = aggregatedMap.get(aggregationKey);
                
                // Aggregate event_data (sum numeric values)
                for (const key in event.event_data) {
                    if (event.event_data.hasOwnProperty(key)) {
                        const value = event.event_data[key];
                        if (typeof value === 'number') {
                            // Sum numeric values (like websocket_connected_number)
                            aggregated.event_data[key] = (aggregated.event_data[key] || 0) + value;
                        } else {
                            // For other fields, keep the first value
                            if (!aggregated.event_data[key]) {
                                aggregated.event_data[key] = value;
                            }
                        }
                    }
                }
                
                // Update timestamp to earliest
                if (event.timestamp < aggregated.timestamp) {
                    aggregated.timestamp = event.timestamp;
                }
                
                // Track original event IDs
                aggregated.originalEventIds.push(event.id);
            }
        }

        // Convert aggregated map to array
        const aggregatedWebSocketEvents = Array.from(aggregatedMap.values());
        
        console.log(`EventDispatcher: Aggregated ${websocketEvents.length} websocket events into ${aggregatedWebSocketEvents.length} aggregated events`);

        // Combine aggregated WebSocket events with other events
        return [...aggregatedWebSocketEvents, ...otherEvents];
    }

    /**
     * Process batch of events
     * @param {Array} events - Array of events
     * @returns {Promise<void>}
     */
    async processBatch(events) {
        const endpoint = this.config.endpoint || 'http://localhost:8080/api/v1/events';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'WebRTC-SDK/3.0.4'
                },
                body: JSON.stringify({
                    events: events.map(e => {
                        // Create clean event object without internal fields like originalEventIds
                        const cleanEvent = {
                            event_type: e.event_type,
                            event_data: e.event_data,
                            event_tags: e.event_tags,
                            timestamp: e.timestamp
                        };
                        return cleanEvent;
                    })
                })
            });

            if (response.ok) {
                // Delete successfully sent events
                // For aggregated registration events, delete all original event IDs
                for (const event of events) {
                    if (event.originalEventIds && Array.isArray(event.originalEventIds)) {
                        // This is an aggregated registration event, delete all original events
                        for (const eventId of event.originalEventIds) {
                            await this.eventShipper.eventStorage.deleteEvent(eventId);
                        }
                    } else {
                        // Regular event, delete normally
                        await this.eventShipper.eventStorage.deleteEvent(event.id);
                    }
                }
            } else if (response.status === 401) {
                // Handle authentication error
                await this.handleAuthError(events);
            } else {
                // Handle other errors
                await this.handleError(events, response.status);
            }
        } catch (error) {
            // Handle network errors
            await this.handleError(events, null, error);
        }
    }

    /**
     * Handle authentication error
     * @param {Array} events - Events to retry
     * @returns {Promise<void>}
     */
    async handleAuthError(events) {
        // For now, increment retry count
        // In future, could implement token refresh
        for (const event of events) {
            await this.eventShipper.eventStorage.incrementRetryCount(event.id);
        }
    }

    /**
     * Handle errors
     * @param {Array} events - Events
     * @param {number} statusCode - HTTP status code
     * @param {Error} error - Error object
     * @returns {Promise<void>}
     */
    async handleError(events, statusCode, error) {
        const maxRetries = this.config.max_retries || 3;

        for (const event of events) {
            const newRetryCount = await this.eventShipper.eventStorage.incrementRetryCount(event.id);

            if (newRetryCount >= maxRetries) {
                // Mark as failed (could move to failed_events table)
                console.warn('Event exceeded max retries', { eventId: event.id, retryCount: newRetryCount });
            }
        }
    }
}

