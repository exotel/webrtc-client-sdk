/**
 * Function to fetch the tab details from tabID
 */
export function FetchTabInfo(tabID){
    const tabArr = JSON.parse(window.localStorage.getItem('tabs'));
    for(var x=0; x<tabArr.length; x++){
        if(tabArr[x].tabID == tabID){
            return tabArr[x];
        }
    }
    return null;
}