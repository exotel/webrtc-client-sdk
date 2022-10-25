var pkg = require('./package.json');
const version = pkg.version;
const name = "exotelsdk.js";
export { name, version };

export * from './src/listeners/ExWebClient';