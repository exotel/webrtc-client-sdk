# Demonstrations

## Building

index.html require exotel sdk bundle.

Steps to generating webrtc core bundle.
* go to webrtc client sdk 

    `cd <path>/webrtc-client-sdk`
* generate core bundle
    ```
    npm install
    npm run build
    ```
* `exotelsdk.js` will generate in `dist` directory along with wav files.

## Running

The demos will run in Chrome, Firefox, or other web browsers which supports WebRTC.

In your web browser, open the `index.html` file in this directory to run the demos.


## Development

This demonstration are build on simple html which provides some basic functionality via a simple interface.
