# Lambda Architecture using Qlik Sense Engine API

# System pre-requisites / suggestions:
This prototype has been tested with February 2018 release of Qlik Sense (Desktop). 

This pure Node, socket.io, example does not connect to Kafka, change config parameter in the server js to connect to 'kafka' if you have a consumer/producer you want to connect to.

Browser refresh may be necessary to reestablish engine api session from time to time. I think I know what can be done to fix this but not 100% sure.

This was built using *qSocks* javascript wrapper for the QIX Engine API. Enigma.js is the newer release put out specifically by Qlik. It is on my list of todos to convert to Enigma. Coming soon!!

# Realtime Lambda implementation Deployment Instructions:
1. Move the apps in the Apps folder to Qlik Sense Apps folder
2. Move the extensions (one mashup, one extension) in the Extensions folder into the Qlik Sense Extensions folder
3. Create a new folder on the system this will run on (best to do it on the localhost that runs Qlik Sense Desktop, but if you decide to run it against Server, changes will need to be made for QSocks connection and the socket.io and rest endpoint clients in the app and extensions.), and copy the files from the Node Scripts folder into there.
4. Copy the 3 files in the "Node Scripts" folder into the aforementioned folder
5. Open a cmd prompt, enter the working directory above, and run "npm install". It will install all required npm modules

# Instructions to run the demo:
1. Within the node folder in point 3 above, run "node SmartNodeServer". This will start the Qlik Orchestrator / Kafka consumer
2. Start Qlik Sense Desktop and login to get to the hub
3. Open web browser and open the mashup: http://localhost:4848/extensions/RealtimeNew/RealtimeNew.html
4. Start the data generation bot by running "node SensorClient" in the same folder in a cmd prompt
5. If you ctrl+c on the sensorcllient.js and then start it back up, it will currently start over at 0 again when starting up again. Will be implementing persistence soon... 
