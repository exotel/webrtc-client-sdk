import { EventDispatcher } from './EventDispatcher.js';

/**
 * Registry to manage dispatchers per account_sid
 * Ensures only one dispatcher runs per account_sid
 */
class DispatcherRegistry {
    constructor() {
        this.dispatchers = new Map(); // Map<account_sid, EventDispatcher>
    }

    /**
     * Get or create dispatcher for account_sid
     * @param {string} accountSid - Account SID
     * @param {EventShipper} eventShipper - EventShipper instance
     * @returns {EventDispatcher} - Dispatcher instance
     */
    getOrCreateDispatcher(accountSid, eventShipper) {
        const key = accountSid || 'default'; // Use 'default' for empty account_sid

        if (!this.dispatchers.has(key)) {
            // Create new dispatcher and register it
            const dispatcher = new EventDispatcher(eventShipper);
            this.dispatchers.set(key, dispatcher);
            return dispatcher;
        }

        // Return existing dispatcher (update its eventShipper reference if needed)
        const existingDispatcher = this.dispatchers.get(key);
        // Update the eventShipper reference to the latest one
        existingDispatcher.eventShipper = eventShipper;
        return existingDispatcher;
    }

    /**
     * Check if dispatcher exists for account_sid
     * @param {string} accountSid - Account SID
     * @returns {boolean}
     */
    hasDispatcher(accountSid) {
        const key = accountSid || 'default';
        return this.dispatchers.has(key);
    }

    /**
     * Get dispatcher for account_sid
     * @param {string} accountSid - Account SID
     * @returns {EventDispatcher|null}
     */
    getDispatcher(accountSid) {
        const key = accountSid || 'default';
        return this.dispatchers.get(key) || null;
    }

    /**
     * Remove dispatcher from registry
     * @param {string} accountSid - Account SID
     */
    removeDispatcher(accountSid) {
        const key = accountSid || 'default';
        const dispatcher = this.dispatchers.get(key);
        if (dispatcher) {
            dispatcher.stop();
            this.dispatchers.delete(key);
        }
    }

    /**
     * Start dispatcher for account_sid if not already running
     * @param {string} accountSid - Account SID
     * @returns {boolean} - True if started, false if already running
     */
    startDispatcher(accountSid) {
        const dispatcher = this.getDispatcher(accountSid);
        if (dispatcher && !dispatcher.isRunning) {
            dispatcher.start();
            return true;
        }
        return false;
    }
}

// Singleton instance
const dispatcherRegistry = new DispatcherRegistry();

export { dispatcherRegistry, DispatcherRegistry };

