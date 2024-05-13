This is a url shortener made with a node.js backend. 
The database used is mongo with mongoose used to maneuver and control the database. 
Redis is used to store the recently created hashes and cache invalidation is maintained whenever a hash is updated.


To run this application first install express, redis, mongoose, and crypto-js.
This can be done by navigating to the node_js_url_shortener directory and then running the following commands in any order:
npm i express
npm i crypto-js
npm i mongoose --save
npm i redis

Then if mongodb is installed simply run 'mongosh' in the terminal
Then make a db called url_shortener by running "use url_shortener"

Then in another terminal window run redis with redis-cli

Then to run the app:
1. Run the following command in the node_js_url_shortener directory:
    npm run dev
2. Open a new tab of your preferred browser and then type localhost:3000 and press enter
3. Finally, after inputing a url and pressing post, add the generated code to the end of the url (eg. localhost:3000/urls/aer34) and press enter
