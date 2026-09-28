function onGlobalSoundVolumeChange(type, percent) {
    const value = _percentToUnit(percent);
    // Apply to Account 1
    try { exotelSDK.ExotelWebClient.setAudioOutputVolume(type, value); } catch (_) {}
}


exotelSDK.ExotelWebClient.setEnableConsoleLogging(true);
exotelSDK.ExotelWebClient.registerLoggerCallback(function (type, message, args) {

    switch (type) {
        case "log":
            console.log(`common: ${message}`, args);
            break;
        case "info":
            console.info(`common: ${message}`, args);
            break;
        case "error":
            console.error(`common: ${message}`, args);
            break;
        case "warn":
            console.warn(`common: ${message}`, args);
            break;
        default:
            console.log(`common: ${message}`, args);
            break;
    }
});

