import { webrtcSIPPhone } from "@exotel-npm-dev/webrtc-core-sdk";

var logger = webrtcSIPPhone.getLogger();

/**
 * Function to register the phone onto a webRTC client
 * @param {*} sipAccountInfo 
 * @param {*} exWebClient 
 */
export function DoRegister(sipAccountInfo, exWebClient) {
    /**
     * When user registers the agent phone for the first time, register your callback onto webrtc client
     */
    let userContext = "IN";
    /**
     * CHANGE IS REQUIRED - in the initialize function provision is to be given to pass Callback functions as arguments
     */
    try {
        exWebClient.initialize(userContext,
            sipAccountInfo.domain, //hostname
            sipAccountInfo.userName, //subscriberName
            sipAccountInfo.displayname,//displayName
            sipAccountInfo.accountSid,//accountSid
            '', sipAccountInfo); // subscriberToken
    } catch (e) {
        logger.log("Register failed ", e)
    }

}


/**
 * Function to UnRegister the phone from a webRTC client
 * @param {*} sipAccountInfo 
 * @param {*} exWebClient 
 */
export function UnRegister(sipAccountInfo, exWebClient) {
    try {
        exWebClient.unregister(sipAccountInfo);
    } catch (e) {
        logger.log("Unregister failed ", e)
    }
}