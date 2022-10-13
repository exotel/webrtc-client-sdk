=========================================== How to build the application =============================

## This ReadMe contains steps to run this react application on Ubuntu machine

## Extract the code from repository by cloning the project

	git clone git@bitbucket.org:Exotel/exotel_code.git

## Check out to feature branch by running the command

	git checkout feature/webrtc
	
## Perform git pull to get the latest code

	git pull
	
## Navigate to gaudim/webrtc-app

	cd exotel_code/gaudim/webrtc-app
	
## Please verify the version of nodejs and npm by executing the following command

	npm -version [version - 6.14.4]
	nodejs --version [version - v10.19.0]
	
NOTE: in order to install node and npm on linux please run

	-> sudo apt install nodejs 
	-> sudo apt install npm
	
## Please run install command to build the node_modules folder

	npm install
	
## Verify if node_modules are created inside the webrtc-app folder

## In order to run the application, please run the following command

	npm start
	
Application should start on https://localhost:3000

=============================================== How to run ================================

In order to register and run, please use the config details provided in the phone.json file for logging in

username: agent1
passowrd: agent1

After successful login, user will have to manually register by clicking on the phone button and toggle the register button

In case server ip and port are to be changed, one could make the necessary changes in the phone.json file
