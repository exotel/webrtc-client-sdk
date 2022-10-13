import data from './phone.json';

/**
 * After successful login, user needs to pass username and accountSID to fetch the phones configured
 * under their name. GetPhoneDetails shall fetch the list of phones pre-configured
 * @param {*} username 
 * @param {*} accountSID 
 * @returns 
 */
export function GetPhoneDetails(username, accountSID){
    /**
     * Based on accountSID and username fetch the relevant phone details either from
     * server or from phone.json. Time being it is fetched from phone.json
     */
    var phoneObj;
    for(var x=0; x<data.length; x++){
        if(data[x].agentName == username && data[x].AccountSID.value == accountSID){
                phoneObj = data[x].AccountSID.ua;
                return phoneObj;
        }
    }
    return phoneObj;
}

/**
 * Passes the JSON object to update the details
 * @param {*} configDetails 
 */
export function UpdatePhoneDetails(configDetails){
    /**
     * Call the API to update the phone details whenever user edits the configuration
     */
}

/**
 * Add config details for a phone
 * @param {*} configDetails 
 */
export function AddPhoneDetails(configDetails){
    /**
     * Call appropriate API to configure a new phone here
     */
}