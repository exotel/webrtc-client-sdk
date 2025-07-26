build:dep
	npm run build
	cp -r ../webrtc-core-sdk/src/static/* dist/


build-local:
	npm uninstall @exotel-npm-dev/webrtc-core-sdk
	npm install ../webrtc-core-sdk 
	npm run build
	cp -r ../webrtc-core-sdk/src/static/* dist/


dep:
	npm uninstall @exotel-npm-dev/webrtc-core-sdk
	npm install @exotel-npm-dev/webrtc-core-sdk@1.0.23

publish: build
	npm publish --tag legacy
