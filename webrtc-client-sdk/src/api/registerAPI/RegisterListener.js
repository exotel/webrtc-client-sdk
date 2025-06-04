import { webrtcSIPPhone } from "@exotel-npm-dev/webrtc-core-sdk";

const logger = webrtcSIPPhone.getLogger();

/* ── internal per-client registry ─────────────────────────── */
const agentMap = new WeakMap();        // ExotelWebClient → RegisterAgent

/* ── RegisterAgent class ──────────────────────────────────── */
class RegisterAgent {
  #exClient;
  #sipAccountInfo;
  #timerId = null;

  constructor(exClient, sipAccountInfo) {
    this.#exClient       = exClient;
    this.#sipAccountInfo = { ...sipAccountInfo };   // clone
  }

  /** update SIP info when DoRegister is called again */
  setAccountInfo(info) {
    this.#sipAccountInfo = { ...info };
  }

  /** schedule (or reschedule) a register attempt */
  register(delay = 500) {
    this._clearTimer();
    this.#timerId = setTimeout(() => {
      try {
        const info = this.#sipAccountInfo;
        const userContext = "IN";           // legacy placeholder
        this.#exClient.initialize(
          userContext,
          info.domain,          // hostName
          info.userName,        // subscriberName
          info.displayname,     // displayName
          info.accountSid,      // accountSid
          "",                   // subscriberToken (unused legacy)
          info                  // full sipAccountInfo
        );
      } catch (e) {
        logger.log("Register failed", e);
      }
    }, delay);
  }

  /** call client.unregister and clear any pending retry */
  unregister() {
    this._clearTimer();
    try {
      this.#exClient.unregister(this.#sipAccountInfo);
    } catch (e) {
      logger.log("Unregister failed", e);
    }
  }

  _clearTimer() {
    if (this.#timerId !== null) {
      clearTimeout(this.#timerId);
      this.#timerId = null;
    }
  }
}

/* ── legacy function exports (back-compat) ────────────────── */

/**
 * Legacy wrapper for registering a phone.
 * Creates (or reuses) a RegisterAgent bound to the ExotelWebClient
 * instance and schedules the register call after `delay` ms.
 */
export function DoRegister(sipAccountInfo, exWebClient, delay = 500) {
  let agent = agentMap.get(exWebClient);
  if (!agent) {
    agent = new RegisterAgent(exWebClient, sipAccountInfo);
    agentMap.set(exWebClient, agent);
  } else {
    agent.setAccountInfo(sipAccountInfo);
  }
  agent.register(delay);
}

/**
 * Legacy wrapper for unregistering a phone.
 * Finds the RegisterAgent for this ExotelWebClient and calls `unregister()`.
 */
export function UnRegister(_sipAccountInfo, exWebClient) {
  const agent = agentMap.get(exWebClient);
  if (agent) {
    agent.unregister();
    agentMap.delete(exWebClient);
  } else {
    // fallback to original direct call if no agent was created
    try {
      exWebClient.unregister(_sipAccountInfo);
    } catch (e) {
      logger.log("Unregister failed", e);
    }
  }
}
