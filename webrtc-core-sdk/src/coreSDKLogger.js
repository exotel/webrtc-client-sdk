
class CoreSDKLogger  {

    loggingEnabled = true;
    loggerCallback = null;

    setEnableConsoleLogging(enable) {
        this.loggingEnabled = enable;
    }

    registerLoggerCallback(callback) {
        this.loggerCallback = callback;
    }
    log(arg1, ...args)  {
        if (this.loggingEnabled) {
            if (args.length == 0)
                console.log(arg1);
            else
                console.log(arg1, args);
        }
        if (this.loggerCallback)
            this.loggerCallback("log", arg1, args);
    }

    info(arg1, ...args) {
        if (this.loggingEnabled) {
            if (args.length == 0)
                console.info(arg1);
            else
                console.info(arg1, args);
        }
        if (this.loggerCallback)
            this.loggerCallback("info", arg1, args);
    }

    warn(arg1, ...args)  {
        if (this.loggingEnabled) {
            if (args.length == 0)
                console.warn(arg1);
            else
                console.warn(arg1, args);
        }
        if (this.loggerCallback)
            this.loggerCallback("warn", arg1, args);
    }

    error (arg1, ...args) {
        if (this.loggingEnabled) {
            if (args.length == 0)
                console.error(arg1);
            else
                console.error(arg1, args);
        }
        if (this.loggerCallback)
            this.loggerCallback("error", arg1, args);
    }
}


export default CoreSDKLogger;


