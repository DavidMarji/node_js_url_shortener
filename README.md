This is a URL shortener made with a node.js backend utilizing express. 
The database is Mongo with Mongoose used to maneuver and control the database. 
Redis stores the recently created hashes and cache invalidation is maintained whenever a hash is updated.

Note: the following instructions are all for macOS and node.js must be installed beforehand.

First install express.js, redis, mongoose, nodemon, jsonwebtoken, and crypto-js.
This can be done by navigating to the node_js_url_shortener directory and then running the following commands in any order:
npm i nodemon
npm i express
npm i crypto-js
npm i mongoose --save
npm i redis
npm i jsonwebtoken

Then if MongoDB is installed, run 'mongosh' in the terminal
Then make a db called url_shortener by running "use url_shortener"

Then in another terminal window run redis with redis-cli

Then to run the app:
1. Run the following command in the node_js_url_shortener directory:
    npm run dev
2. Open a new tab of your preferred browser and then type localhost:3000 and press enter
3. SignUp/Login then input your url in the top input box and click post. (for a custom code write it at the bottom box)
4. To navigate to the url using the code generated/chosen just change the url to localhost:3000/<code>.
5. To view the list of all users go to localhost:3000/home/users/all.
6. To view a specific user go to localhost:3000/home/users/profiles/<username>. Or from the all users page click on the hyperlink of the username.
7. To view a specific url go to localhost:3000/home/urls/<code>. Or from the users profile click on the hyperlink of the specific code you want.
    (The url page allows you to view how many times the custom hash has been used to navigate to the URL, the user who created it, and the url associated with the code).

If you try to access any of the pages other than the login, signUp, and /<code> pages without logging in first, the program should redirect you to an unauthorized error page.
If you try to search for a user/code that does not exist in your database, the program should redirect you to a notFound error page.
