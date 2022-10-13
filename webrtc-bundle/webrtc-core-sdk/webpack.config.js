const path = require('path');
var webpack = require('webpack');
var TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin')

var pkg = require('./package.json');
var banner = '\
\n\
WebRTC CORE SIP version ' + pkg.version + '\n\
';

module.exports = {
  entry: {
    webrtcsdk:'./src/index.ts'
  },
  devtool: 'source-map',
  mode: 'development',
  output: {
    filename:'[name].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    library: 'webrtcSDK',
    globalObject: 'this'
  },
  module: {
    rules: [
      { test: /\.wav$/,exclude: /node_modules/, use: 'file-loader' },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: {
          compilerOptions: {
            "declaration": false,
            "declarationMap": false,
            "outDir": path.resolve(__dirname, 'dist')
          }
        }
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.d.ts', '.js']
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ascii_only: true
          }
        }
      })
    ]
  },
  plugins: [
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }),
    new webpack.BannerPlugin({
      banner: banner
    })
  ]
};

