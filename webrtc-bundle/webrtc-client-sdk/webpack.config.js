const path = require('path');

module.exports = {
  entry: {
    ExotelWebClient: './src/webrtc-client-sdk/listeners/ExWebClient.js'
  },  
  mode: 'development',

  output: {
    filename: 'ExotelWebClient.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: "ExotelWebClient",
      type: "umd"
    },    
  },
  /*optimization: {
    runtimeChunk: 'single',
  },*/  
  module: {
    rules: [
      { test: /\.wav$/, use: 'file-loader' },
      { test: /\.ts$/, use: 'ts-loader' }
    ],
  },
};
