/**
 * Storage abstraction layer
 * Uses IndexedDB as primary, LocalStorage as fallback
 */
export class EventStorage {
    constructor() {
        this.indexedDBStore = null;
        this.localStorageStore = null;
        this.useIndexedDB = true;
        this.dbName = 'webrtc_metrics_db';
        this.storeName = 'events';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize storage
     * @returns {Promise<void>}
     */
    async init() {
        try {
            if (typeof indexedDB !== 'undefined') {
                await this.initIndexedDB();
                this.useIndexedDB = true;
            } else {
                throw new Error('IndexedDB not available');
            }
        } catch (error) {
            console.warn('IndexedDB not available, using LocalStorage fallback:', error);
            this.useIndexedDB = false;
        }
    }

    /**
     * Initialize IndexedDB
     * @returns {Promise<void>}
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id'
                    });

                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('event_type', 'event_type', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('retry_count', 'retry_count', { unique: false });
                }
            };
        });
    }

    /**
     * Insert event
     * @param {Object} event - Event object
     * @returns {Promise<string>} - Event ID
     */
    async insertEvent(event) {
        // Ensure event is serializable before storing
        const sanitizedEvent = this.sanitizeEventForStorage(event);
        
        if (this.useIndexedDB && this.db) {
            return await this.insertIndexedDB(sanitizedEvent);
        } else {
            return await this.insertLocalStorage(sanitizedEvent);
        }
    }

    /**
     * Sanitize event to ensure it's serializable (remove functions, circular refs, etc.)
     * @param {Object} event - Event object
     * @returns {Object} - Sanitized event object
     */
    sanitizeEventForStorage(event) {
        try {
            // Try to serialize and deserialize to ensure it's valid
            const serialized = JSON.stringify(event);
            return JSON.parse(serialized);
        } catch (error) {
            console.error('EventStorage: Event contains non-serializable data, sanitizing:', error);
            // If serialization fails, create a clean copy with only serializable fields
            return {
                id: event.id,
                event_type: event.event_type,
                event_data: this.sanitizeObject(event.event_data || {}),
                event_tags: this.sanitizeObject(event.event_tags || {}),
                timestamp: event.timestamp,
                retry_count: event.retry_count || 0,
                status: event.status || 'pending'
            };
        }
    }

    /**
     * Recursively sanitize an object, removing functions and non-serializable values
     * @param {*} obj - Object to sanitize
     * @param {Set} seen - Set to track circular references
     * @returns {*} - Sanitized object
     */
    sanitizeObject(obj, seen = new Set()) {
        if (obj === null || obj === undefined) {
            return obj;
        }

        // Handle primitives
        if (typeof obj !== 'object') {
            return obj;
        }

        // Handle circular references
        if (seen.has(obj)) {
            return '[Circular]';
        }
        seen.add(obj);

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item, seen));
        }

        // Handle objects
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip functions
            if (typeof value === 'function') {
                continue;
            }
            
            try {
                sanitized[key] = this.sanitizeObject(value, seen);
            } catch (e) {
                // Skip values that can't be sanitized
                console.warn(`EventStorage: Skipping non-serializable value for key "${key}"`);
            }
        }

        seen.delete(obj);
        return sanitized;
    }

    /**
     * Insert into IndexedDB
     * @param {Object} event - Event object
     * @returns {Promise<string>}
     */
    async insertIndexedDB(event) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(event);

            request.onsuccess = () => resolve(event.id);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Insert into LocalStorage
     * @param {Object} event - Event object
     * @returns {Promise<string>}
     */
    async insertLocalStorage(event) {
        return new Promise((resolve) => {
            try {
                const key = `webrtc_metrics_event_${event.id}`;
                localStorage.setItem(key, JSON.stringify(event));
                
                // Maintain a list of event IDs
                const eventList = JSON.parse(localStorage.getItem('webrtc_metrics_event_list') || '[]');
                eventList.push(event.id);
                localStorage.setItem('webrtc_metrics_event_list', JSON.stringify(eventList));
                
                resolve(event.id);
            } catch (error) {
                console.error('Failed to insert event to LocalStorage:', error);
                resolve(event.id); // Return ID even if storage fails
            }
        });
    }

    /**
     * Fetch pending events
     * @param {number} limit - Maximum number of events
     * @param {string} sdkObjectId - SDK object ID to filter events (optional)
     * @param {string} accountSid - Account SID to filter events (optional, takes precedence)
     * @returns {Promise<Array>}
     */
    async fetchPendingEvents(limit = 10, sdkObjectId = null, accountSid = null) {
        if (this.useIndexedDB && this.db) {
            return await this.fetchPendingIndexedDB(limit, sdkObjectId, accountSid);
        } else {
            return await this.fetchPendingLocalStorage(limit, sdkObjectId, accountSid);
        }
    }

    /**
     * Check if there are any non-performance_metrics pending events
     * @param {string} accountSid - Account SID to filter events (optional)
     * @returns {Promise<boolean>}
     */
    async hasNonPerformanceEvents(accountSid = null, excludeEventIds = []) {
        if (this.useIndexedDB && this.db) {
            return await this.hasNonPerformanceEventsIndexedDB(accountSid, excludeEventIds);
        } else {
            return await this.hasNonPerformanceEventsLocalStorage(accountSid, excludeEventIds);
        }
    }

    /**
     * Fetch pending events by type (non-performance or performance_metrics)
     * @param {number} limit - Maximum number of events
     * @param {string} accountSid - Account SID to filter events (optional)
     * @param {string} type - 'non-performance' or 'performance_metrics'
     * @returns {Promise<Array>}
     */
    async fetchPendingEventsByType(limit = 10, accountSid = null, type = 'non-performance') {
        if (this.useIndexedDB && this.db) {
            return await this.fetchPendingEventsByTypeIndexedDB(limit, accountSid, type);
        } else {
            return await this.fetchPendingEventsByTypeLocalStorage(limit, accountSid, type);
        }
    }

    /**
     * Fetch pending from IndexedDB
     * @param {number} limit
     * @param {string} sdkObjectId - SDK object ID to filter events (optional)
     * @param {string} accountSid - Account SID to filter events (optional, takes precedence)
     * @returns {Promise<Array>}
     */
    async fetchPendingIndexedDB(limit, sdkObjectId = null, accountSid = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                let events = request.result;
                
                // Filter by account_sid if provided (takes precedence)
                if (accountSid !== null && accountSid !== undefined) {
                    events = events.filter(event => {
                        const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                        // Handle both null/undefined and empty string cases consistently
                        if (accountSid === '') {
                            return eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                        }
                        return eventAccountSid === accountSid;
                    });
                } else if (sdkObjectId) {
                    // Fallback to sdk_object_id if account_sid not provided
                    events = events.filter(event => 
                        event.event_tags && event.event_tags.sdk_object_id === sdkObjectId
                    );
                }
                
                events = events
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(0, limit);
                resolve(events);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Fetch pending from LocalStorage
     * @param {number} limit
     * @param {string} sdkObjectId - SDK object ID to filter events (optional)
     * @param {string} accountSid - Account SID to filter events (optional, takes precedence)
     * @returns {Promise<Array>}
     */
    async fetchPendingLocalStorage(limit, sdkObjectId = null, accountSid = null) {
        return new Promise((resolve) => {
            try {
                const eventList = JSON.parse(localStorage.getItem('webrtc_metrics_event_list') || '[]');
                const events = [];

                for (const eventId of eventList.slice(0, limit * 2)) { // Get more to filter
                    const key = `webrtc_metrics_event_${eventId}`;
                    const eventStr = localStorage.getItem(key);
                    if (eventStr) {
                        const event = JSON.parse(eventStr);
                        if (event.status === 'pending') {
                            // Filter by account_sid if provided (takes precedence)
                            if (accountSid !== null && accountSid !== undefined) {
                                const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                                let matches = false;
                                // Handle both null/undefined and empty string cases consistently
                                if (accountSid === '') {
                                    matches = eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                                } else {
                                    matches = eventAccountSid === accountSid;
                                }
                                if (matches) {
                                    events.push(event);
                                    if (events.length >= limit) break;
                                }
                            } else if (sdkObjectId) {
                                // Fallback to sdk_object_id if account_sid not provided
                                if (event.event_tags && event.event_tags.sdk_object_id === sdkObjectId) {
                                    events.push(event);
                                    if (events.length >= limit) break;
                                }
                            } else {
                                // No filter
                                events.push(event);
                                if (events.length >= limit) break;
                            }
                        }
                    }
                }

                resolve(events.sort((a, b) => a.timestamp - b.timestamp));
            } catch (error) {
                console.error('Failed to fetch events from LocalStorage:', error);
                resolve([]);
            }
        });
    }

    /**
     * Fetch pending events by type from IndexedDB
     * @param {number} limit
     * @param {string} accountSid - Account SID to filter events (optional)
     * @param {string} type - 'non-performance' or 'performance_metrics'
     * @returns {Promise<Array>}
     */
    async fetchPendingEventsByTypeIndexedDB(limit, accountSid = null, type = 'non-performance') {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                let events = request.result;
                
                // Filter by account_sid if provided
                if (accountSid !== null && accountSid !== undefined) {
                    events = events.filter(event => {
                        const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                        if (accountSid === '') {
                            return eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                        }
                        return eventAccountSid === accountSid;
                    });
                }
                
                // Filter by type
                if (type === 'non-performance') {
                    events = events.filter(event => event.event_type !== 'performance_metrics');
                } else if (type === 'performance_metrics') {
                    events = events.filter(event => event.event_type === 'performance_metrics');
                }
                
                events = events
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(0, limit);
                resolve(events);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Fetch pending events by type from LocalStorage
     * @param {number} limit
     * @param {string} accountSid - Account SID to filter events (optional)
     * @param {string} type - 'non-performance' or 'performance_metrics'
     * @returns {Promise<Array>}
     */
    async fetchPendingEventsByTypeLocalStorage(limit, accountSid = null, type = 'non-performance') {
        return new Promise((resolve) => {
            try {
                const eventList = JSON.parse(localStorage.getItem('webrtc_metrics_event_list') || '[]');
                const events = [];

                for (const eventId of eventList.slice(0, limit * 2)) { // Get more to filter
                    const key = `webrtc_metrics_event_${eventId}`;
                    const eventStr = localStorage.getItem(key);
                    if (eventStr) {
                        const event = JSON.parse(eventStr);
                        if (event.status === 'pending') {
                            // Filter by account_sid if provided
                            let matches = true;
                            if (accountSid !== null && accountSid !== undefined) {
                                const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                                if (accountSid === '') {
                                    matches = eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                                } else {
                                    matches = eventAccountSid === accountSid;
                                }
                            }
                            
                            // Filter by type
                            if (matches) {
                                if (type === 'non-performance' && event.event_type !== 'performance_metrics') {
                                    events.push(event);
                                    if (events.length >= limit) break;
                                } else if (type === 'performance_metrics' && event.event_type === 'performance_metrics') {
                                    events.push(event);
                                    if (events.length >= limit) break;
                                }
                            }
                        }
                    }
                }

                resolve(events.sort((a, b) => a.timestamp - b.timestamp));
            } catch (error) {
                console.error('Failed to fetch events by type from LocalStorage:', error);
                resolve([]);
            }
        });
    }

    /**
     * Delete event
     * @param {string} eventId - Event ID
     * @returns {Promise<boolean>}
     */
    async deleteEvent(eventId) {
        if (this.useIndexedDB && this.db) {
            return await this.deleteIndexedDB(eventId);
        } else {
            return await this.deleteLocalStorage(eventId);
        }
    }

    /**
     * Delete from IndexedDB
     * @param {string} eventId
     * @returns {Promise<boolean>}
     */
    async deleteIndexedDB(eventId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(eventId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete from LocalStorage
     * @param {string} eventId
     * @returns {Promise<boolean>}
     */
    async deleteLocalStorage(eventId) {
        return new Promise((resolve) => {
            try {
                const key = `webrtc_metrics_event_${eventId}`;
                localStorage.removeItem(key);

                const eventList = JSON.parse(localStorage.getItem('webrtc_metrics_event_list') || '[]');
                const filtered = eventList.filter(id => id !== eventId);
                localStorage.setItem('webrtc_metrics_event_list', JSON.stringify(filtered));

                resolve(true);
            } catch (error) {
                console.error('Failed to delete event from LocalStorage:', error);
                resolve(false);
            }
        });
    }

    /**
     * Increment retry count
     * @param {string} eventId - Event ID
     * @returns {Promise<boolean>}
     */
    async incrementRetryCount(eventId) {
        if (this.useIndexedDB && this.db) {
            return await this.incrementRetryCountIndexedDB(eventId);
        } else {
            return await this.incrementRetryCountLocalStorage(eventId);
        }
    }

    /**
     * Increment retry count in IndexedDB
     * @param {string} eventId
     * @returns {Promise<boolean>}
     */
    async incrementRetryCountIndexedDB(eventId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(eventId);

            getRequest.onsuccess = () => {
                const event = getRequest.result;
                if (event) {
                    event.retry_count = (event.retry_count || 0) + 1;
                    const putRequest = store.put(event);
                    putRequest.onsuccess = () => resolve(true);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve(false);
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Increment retry count in LocalStorage
     * @param {string} eventId
     * @returns {Promise<boolean>}
     */
    async incrementRetryCountLocalStorage(eventId) {
        return new Promise((resolve) => {
            try {
                const key = `webrtc_metrics_event_${eventId}`;
                const eventStr = localStorage.getItem(key);
                if (eventStr) {
                    const event = JSON.parse(eventStr);
                    event.retry_count = (event.retry_count || 0) + 1;
                    localStorage.setItem(key, JSON.stringify(event));
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (error) {
                console.error('Failed to increment retry count:', error);
                resolve(false);
            }
        });
    }

    /**
     * Check if there are non-performance_metrics events in IndexedDB
     * @param {string} accountSid - Account SID to filter events (optional)
     * @param {Array<string>} excludeEventIds - Event IDs to exclude from check (optional)
     * @returns {Promise<boolean>}
     */
    async hasNonPerformanceEventsIndexedDB(accountSid = null, excludeEventIds = []) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                let events = request.result;
                const totalEventsBeforeFilter = events.length;
                console.log(`EventStorage.hasNonPerformanceEventsIndexedDB: Starting check for account_sid="${accountSid || '(empty)'}". Found ${totalEventsBeforeFilter} total pending events in IndexedDB.`);
                
                // Filter by account_sid if provided (including empty string)
                if (accountSid !== null && accountSid !== undefined) {
                    const beforeAccountSidFilter = events.length;
                    events = events.filter(event => {
                        const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                        // Handle both null/undefined and empty string cases
                        if (accountSid === '') {
                            return eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                        }
                        return eventAccountSid === accountSid;
                    });
                    console.log(`EventStorage.hasNonPerformanceEventsIndexedDB: After account_sid filter ("${accountSid || '(empty)'}"), ${events.length} events remain (was ${beforeAccountSidFilter}).`);
                }
                
                // Exclude events in the current batch (if provided)
                if (excludeEventIds.length > 0) {
                    const beforeExcludeFilter = events.length;
                    events = events.filter(event => !excludeEventIds.includes(event.id));
                    console.log(`EventStorage.hasNonPerformanceEventsIndexedDB: After excluding ${excludeEventIds.length} current batch event IDs, ${events.length} events remain (was ${beforeExcludeFilter}).`);
                }
                
                const eventsAfterFilter = events.length;
                const eventTypes = events.map(e => e.event_type);
                const uniqueEventTypes = [...new Set(eventTypes)];
                const eventTypeCounts = {};
                eventTypes.forEach(type => {
                    eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
                });
                
                // Check if any event is not performance_metrics
                const nonPerformanceEvents = events.filter(event => 
                    event.event_type !== 'performance_metrics'
                );
                const hasNonPerformance = nonPerformanceEvents.length > 0;
                const nonPerformanceEventTypes = [...new Set(nonPerformanceEvents.map(e => e.event_type))];
                
                console.log(`EventStorage.hasNonPerformanceEventsIndexedDB: Final result for account_sid="${accountSid || '(empty)'}":`, {
                    totalEventsBeforeFilter,
                    eventsAfterFilter,
                    uniqueEventTypes,
                    eventTypeCounts,
                    nonPerformanceEventsCount: nonPerformanceEvents.length,
                    nonPerformanceEventTypes,
                    hasNonPerformance
                });
                
                resolve(hasNonPerformance);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Check if there are non-performance_metrics events in LocalStorage
     * @param {string} accountSid - Account SID to filter events (optional)
     * @param {Array<string>} excludeEventIds - Event IDs to exclude from check (optional)
     * @returns {Promise<boolean>}
     */
    async hasNonPerformanceEventsLocalStorage(accountSid = null, excludeEventIds = []) {
        return new Promise((resolve) => {
            try {
                const eventList = JSON.parse(localStorage.getItem('webrtc_metrics_event_list') || '[]');
                console.log(`EventStorage.hasNonPerformanceEventsLocalStorage: Starting check for account_sid="${accountSid || '(empty)'}". Found ${eventList.length} total events in LocalStorage.`);
                
                const allPendingEvents = [];
                
                // First, collect all pending events
                for (const eventId of eventList) {
                    const key = `webrtc_metrics_event_${eventId}`;
                    const eventStr = localStorage.getItem(key);
                    if (eventStr) {
                        const event = JSON.parse(eventStr);
                        if (event.status === 'pending') {
                            allPendingEvents.push(event);
                        }
                    }
                }
                
                const totalPendingEvents = allPendingEvents.length;
                console.log(`EventStorage.hasNonPerformanceEventsLocalStorage: Found ${totalPendingEvents} total pending events in LocalStorage.`);
                
                let events = allPendingEvents;
                
                // Filter by account_sid if provided (including empty string)
                if (accountSid !== null && accountSid !== undefined) {
                    const beforeAccountSidFilter = events.length;
                    events = events.filter(event => {
                        const eventAccountSid = event.event_tags && event.event_tags.account_sid;
                        // Handle both null/undefined and empty string cases
                        if (accountSid === '') {
                            return eventAccountSid === '' || eventAccountSid === null || eventAccountSid === undefined;
                        }
                        return eventAccountSid === accountSid;
                    });
                    console.log(`EventStorage.hasNonPerformanceEventsLocalStorage: After account_sid filter ("${accountSid || '(empty)'}"), ${events.length} events remain (was ${beforeAccountSidFilter}).`);
                }
                
                // Exclude events in the current batch (if provided)
                if (excludeEventIds.length > 0) {
                    const beforeExcludeFilter = events.length;
                    events = events.filter(event => !excludeEventIds.includes(event.id));
                    console.log(`EventStorage.hasNonPerformanceEventsLocalStorage: After excluding ${excludeEventIds.length} current batch event IDs, ${events.length} events remain (was ${beforeExcludeFilter}).`);
                }
                
                const eventsAfterFilter = events.length;
                const eventTypes = events.map(e => e.event_type);
                const uniqueEventTypes = [...new Set(eventTypes)];
                const eventTypeCounts = {};
                eventTypes.forEach(type => {
                    eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
                });
                
                // Check if any event is not performance_metrics
                const nonPerformanceEvents = events.filter(event => 
                    event.event_type !== 'performance_metrics'
                );
                const hasNonPerformance = nonPerformanceEvents.length > 0;
                const nonPerformanceEventTypes = [...new Set(nonPerformanceEvents.map(e => e.event_type))];
                
                console.log(`EventStorage.hasNonPerformanceEventsLocalStorage: Final result for account_sid="${accountSid || '(empty)'}":`, {
                    totalPendingEvents,
                    eventsAfterFilter,
                    uniqueEventTypes,
                    eventTypeCounts,
                    nonPerformanceEventsCount: nonPerformanceEvents.length,
                    nonPerformanceEventTypes,
                    hasNonPerformance
                });
                
                resolve(hasNonPerformance);
            } catch (error) {
                console.error('Failed to check non-performance events from LocalStorage:', error);
                resolve(false);
            }
        });
    }
}

