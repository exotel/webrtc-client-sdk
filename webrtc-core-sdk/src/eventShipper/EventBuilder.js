import { EVENT_TYPES } from './constants/EventTypes.js';

/**
 * Builds and validates event objects
 */
export class EventBuilder {
    /**
     * Build complete event object
     * @param {Object} params - Event parameters
     * @returns {Object} - Complete event object
     */
    build({ eventType, eventData, eventTags, timestamp }) {
        // Validate inputs
        this.validateEventType(eventType);
        this.validateEventData(eventData);
        this.validateEventTags(eventTags);

        return {
            id: this.generateUUID(),
            event_type: eventType,
            event_data: this.sanitizeEventData(eventData),
            event_tags: this.sanitizeEventData(eventTags), // Also sanitize event tags
            timestamp: timestamp || Date.now(),
            retry_count: 0,
            status: 'pending'
        };
    }

    /**
     * Validate event type
     * @param {string} eventType - Event type
     */
    validateEventType(eventType) {
        const validTypes = Object.values(EVENT_TYPES);
        if (!validTypes.includes(eventType)) {
            console.warn(`Invalid event type: ${eventType}`);
        }
    }

    /**
     * Validate event data
     * @param {Object} eventData - Event data
     */
    validateEventData(eventData) {
        if (typeof eventData !== 'object' || Array.isArray(eventData)) {
            throw new Error('Event data must be an object');
        }
    }

    /**
     * Validate event tags
     * @param {Object} eventTags - Event tags
     */
    validateEventTags(eventTags) {
        if (typeof eventTags !== 'object' || Array.isArray(eventTags)) {
            throw new Error('Event tags must be an object');
        }
    }

    /**
     * Sanitize event data (remove undefined, null values, functions, and non-serializable objects)
     * @param {Object} eventData - Event data
     * @returns {Object} - Sanitized event data
     */
    sanitizeEventData(eventData) {
        const sanitized = {};
        const maxSize = 10000; // 10KB limit

        for (const [key, value] of Object.entries(eventData)) {
            if (value === undefined || value === null) {
                continue;
            }

            // Skip functions - they cannot be serialized
            if (typeof value === 'function') {
                continue;
            }

            // Handle nested objects recursively
            if (typeof value === 'object' && !Array.isArray(value)) {
                const sanitizedNested = this.sanitizeEventData(value);
                // Only include if nested object has at least one property
                if (Object.keys(sanitizedNested).length > 0) {
                    const valueStr = JSON.stringify(sanitizedNested);
                    if (valueStr.length <= maxSize) {
                        sanitized[key] = sanitizedNested;
                    }
                }
                continue;
            }

            // Handle arrays - sanitize each element
            if (Array.isArray(value)) {
                const sanitizedArray = value
                    .filter(item => item !== undefined && item !== null && typeof item !== 'function')
                    .map(item => {
                        if (typeof item === 'object' && item !== null) {
                            return this.sanitizeEventData(item);
                        }
                        return item;
                    });
                const valueStr = JSON.stringify(sanitizedArray);
                if (valueStr.length <= maxSize) {
                    sanitized[key] = sanitizedArray;
                }
                continue;
            }

            // For primitive values, check size and include
            try {
                const valueStr = JSON.stringify(value);
                if (valueStr.length <= maxSize) {
                    sanitized[key] = value;
                }
            } catch (e) {
                // Skip values that cannot be serialized (e.g., circular references)
                console.warn(`EventBuilder: Skipping non-serializable value for key "${key}":`, e);
            }
        }

        return sanitized;
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

