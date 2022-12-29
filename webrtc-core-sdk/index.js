var pkg = require('./package.json');
const version = pkg.version;
const name = "webrtcsdk.js";
export { name, version };


export * from './src/webrtcSIPPhone';