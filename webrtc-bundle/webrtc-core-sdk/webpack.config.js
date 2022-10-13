const path = require('path');

module.exports = {
  entry: {
    webrtcSIPPhoneService: {
      import: './src/webrtcSIPPhoneService.js',
    },
    webrtcSIPPhoneInterface: {
      import: './src/webrtcSIPPhoneInterface.js',
    }
  },
  mode: 'development',
  output: {
    library:  {
      name:'[name]',
      type: 'this',
      export: '[name]'
    },
    path: path.resolve(__dirname, 'dist'),
  },
  /*optimization: {
    runtimeChunk: 'single',
  },*/
  module: {
    rules: [
      { test: /\.wav$/, use: 'file-loader' },
      { test: /\.ts$/, use: 'ts-loader' },
    ],
  },
};

