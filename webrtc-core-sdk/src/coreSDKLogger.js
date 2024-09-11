
const coreSDKLogger = {

    loggerCallback: null,

    registerLoggerCallback(callback) {
        coreSDKLogger.loggerCallback = callback;
    },
    log: (arg1, ...args) => {
        if (args.length == 0)
            console.log(arg1);
        else
            console.log(arg1, args);
        if (coreSDKLogger.loggerCallback)
            coreSDKLogger.loggerCallback("log", arg1, args);
    },

    info: (arg1, ...args) => {
        if (args.length == 0)
            console.info(arg1);
        else
            console.info(arg1, args);
        if (coreSDKLogger.loggerCallback)
            coreSDKLogger.loggerCallback("info", arg1, args);
    },

    warn: (arg1, ...args) => {
        if (args.length == 0)
            console.warn(arg1);
        else
            console.warn(arg1, args);
        if (coreSDKLogger.loggerCallback)
            coreSDKLogger.loggerCallback("warn", arg1, args);
    },

    error: (arg1, ...args) => {
        if (args.length == 0)
            console.error(arg1);
        else
            console.error(arg1, args);
        if (coreSDKLogger.loggerCallback)
            coreSDKLogger.loggerCallback("error", arg1, args);
    }
};


export default coreSDKLogger;


