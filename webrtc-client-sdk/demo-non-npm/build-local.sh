#openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

rm -rf dist;cd ..;npm uninstall @exotel-npm-dev/webrtc-core-sdk;npm install ../webrtc-core-sdk;npm run build;cp -r dist demo-non-npm/;cd demo-non-npm;
http-server  -S -C ~/pki/cert.pem -K ~/pki/key.pem