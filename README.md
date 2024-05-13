This is a URL shortener made with a node.js backend. 
The database used is Mongo with Mongoose used to maneuver and control the database. 
Redis stores the recently created hashes and cache invalidation is maintained whenever a hash is updated.

Note: the following instructions are all for macOS and node.js must be installed beforehand.

First install express.js, redis, mongoose, nodemon, and crypto-js.
This can be done by navigating to the node_js_url_shortener directory and then running the following commands in any order:
npm i nodemon
npm i express
npm i crypto-js
npm i mongoose --save
npm i redis

Then if MongoDB is installed, run 'mongosh' in the terminal
Then make a db called url_shortener by running "use url_shortener"

Then in another terminal window run redis with redis-cli

Then to run the app:
1. Run the following command in the node_js_url_shortener directory:
    npm run dev
2. Open a new tab of your preferred browser and then type localhost:3000 and press enter
3. Finally, after inputting a URL and pressing post, add the generated code to the end of the URL (eg. localhost:3000/urls/aer34) and press enter
