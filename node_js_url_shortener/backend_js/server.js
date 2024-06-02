const path = require('path');
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const app = express();
const schema = require('./urlSchema.js');
const bodyParser = require('body-parser');
const redis = require('./redis.js');
const userSchema = require('./userSchema.js');
const jwt = require('jsonwebtoken');

const secretKey = crypto.randomUUID();

function hashUrl(url) {
	const hash = crypto.createHash('sha256');
	hash.update(url);
	return hash.digest('hex');
}

function generateAccessToken(usernameToSave) {
    const payload = {
       username : usernameToSave
    };
    
    const options = { expiresIn: '1h' };
  
    return jwt.sign(payload, secretKey, options);
}

function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, secretKey);
        return {success : true, data : decoded };
    }
    catch (error) {
        return {success : false, error : error.message };
    }
}

app.listen(3000);

app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
});

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/signUp', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'signUpPage.html'))
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'loginPage.html'));
});

// sign up post request
app.post('/users/', (req, res) => {
    const usernameToSave = req.body.username;
    const emailToSave = req.body.email;
    const passwordToSave = req.body.password;
    
    if(usernameToSave === null || usernameToSave === undefined || usernameToSave.length === 0  
        || usernameToSave.includes(" ")){
        // invalid username
        res.sendStatus(409);
        return;
    }

    if(emailToSave === null || emailToSave === undefined || emailToSave.length === 0 
        || !emailToSave.includes("@")
        || emailToSave.includes(" ")){
        // invalid email
        res.sendStatus(409);
        return;
    }

    if(passwordToSave === null || passwordToSave === undefined || passwordToSave.length == 0  
        || passwordToSave.includes(" ")){
        // invalid password
        res.sendStatus(409);
        return;
    }

    //will use redis later
    // check if user with the username or email already exists already exists
    userSchema.findUser(usernameToSave).then(foundUserByName => {
        if(foundUserByName !== null && foundUserByName !== undefined && foundUserByName.length > 0){
            // user with the given username was not found
            res.sendStatus(409);
            return;
        }

        // now check if a user with the given email already exists
        userSchema.findUser(emailToSave).then(foundUserByEmail => {
            if(foundUserByEmail !== null && foundUserByEmail !== undefined && foundUserByEmail.length > 0){
                // user with the given username was not found
                res.sendStatus(409);
                return;
            }

            // now we know that the data given is safe to use so create a new user
            userSchema.signUp(usernameToSave, emailToSave, passwordToSave).then(() => {
                // make a profile page for the user
                const jwtReturned = generateAccessToken(req.body.username);
                res.status(200).json(jwtReturned);
            });
        });
    });
});

// login
app.get('/users/:username/:password', (req, res) => {
    // I will use redis later once I figure out the basics
    userSchema.findUser(req.params.username).then(data => {
        if(data !== undefined && data !== null && data.length > 0){
            // send the user as a json (username and email without password for security)
            // I'm sending this data so that it can be stored in session storage
            // This is temporary until I read more about JWT
            
            if(req.params.password === data[0].password){
                const jwtReturned = generateAccessToken(req.params.username);
                res.status(200).json(jwtReturned);
                return;
            }
        }
        res.sendStatus(404);
        return;
    })
});

app.get("/unauthorized", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'unauthorized.html'));
});

app.get('/notFound', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'notFound.html'));
});

app.get('/unknownError', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'unknownError.html'));
})

// the two below are tied and the first one is basically used to force the request to include a header with the jwt that we sent so we can verify it
app.get('/users/:username', (req,res) => {
    res.render(path.join(__dirname, '..', 'views', 'users', 'users.html'), {username : req.params.username});
});
app.get("/users/:username/urls/view", (req, res) => {
    if(!req.params.username) {
        res.status(401).json({"error" : "no username provided"});
        return;
    }
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.status(401).json({"error" : 'not logged in, unauthorized'});
        return;
    }

    let urls = [];

    schema.findUserUrls(req.params.username)
    .then(userUrls => {
        for(let url of userUrls){
            urls.push({
                "url" : url.url, 
                "hash" : url.hash
            });
        }
        console.log(urls);
        res.status(200).send(urls);
    })
    .catch(error => {
        console.log(error);
        res.status(404);
    });
});

app.get('/urls', (req, res) => {

    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
});

app.get('/jwt', (req, res) => {
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.status(401).json({"error" : 'not logged in, unauthorized'});
        return;
    }
    res.status(200);
});

app.post('/urls/', (req, res) => {
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.status(401).json({"error" : 'not logged in, unauthorized'});
        return;
    }
    
    // if the user put a custom hash with ' ~,<>;\':"/\\[]^{}()=+!*@&$?%#|' it should not be allowed.
    const originalHash = req.body.custom ? req.body.custom : hashUrl((req.body.url).toLowerCase());
    const pattern = /[ ~,<>\';:"/\\[\]^{}()=+!*@&$?%#|]/;
    if(pattern.test(originalHash)){
        res.sendStatus(422);
        return;
    }

    let postedHash = originalHash.length >= 5 
                    ? originalHash.substring(0, 5) 
                    : originalHash.substring(0, (req.body.url).length/2);

    schema.findUrlInstanceByHash(postedHash).then(data => {
        // checking if hash already exists
        if(data !== undefined && data.length > 0){
            // if the original hash was the custom hash
            if(originalHash === req.body.custom){
                res.sendStatus(409);
                return;
            }
            //f ind a new valid and short hash 
            let validHash;
            findValidHash(originalHash, postedHash, req.body.url).then((returnedJson) => {
                validHash = returnedJson;
                if(!validHash.foundBefore){
                    schema.createAndSaveUrlInstance(validHash.validHash, req.body.url, verified.data.username, 0).then(() => {});
                }
                redis.postUrl(validHash.validHash, req.body.url, 0)
                    .then(() => {
                        res.send({hashGenerated : validHash.validHash});
                        return;
                    });    
            });
            //url wasnt already stored and a new hash was found
        }
        else{
            // hash is unique
            schema.createAndSaveUrlInstance(postedHash, req.body.url, verified.data.username, 0).then(() => {});
            redis.postUrl(postedHash, req.body.url, 0).then(() => {});
            res.send({hashGenerated : postedHash});
        } 
    });
});

app.put('/urls/:hash', (req, res) => {
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.status(401);
        return;
    }

    const newUrl = (req.body.url).toLowerCase();

    schema.findUrlInstanceByHash(req.params.hash).then(async data => {
        if(data[0] !== undefined && data.length> 0) {
            schema.updateUrlInstance(req.params.hash, req.body.url, verified.data.username)
            .then((success) => {
            });

            redis.updateUrl(req.params.hash, req.body.url, 0)
            .then(() => {
            });

            res.sendStatus(200);
            return;
        }
        res.sendStatus(404);
    });
});

app.get('/urls/:hash', (req, res) => {
    
    const hash = req.params.hash;
    res.render(path.join(__dirname, '..', 'views', 'urlInfo.html'), { hash : hash});
});

app.get('/urls/:hash/info', (req, res) => {
    console.log("inside hash info request and verifying user")
    const verified = verifyAccessToken(req.headers.authentication);
    console.log("this is verified", verified);
    if(!verified.success){
        res.status(401).json({"error" : "unauthorized"});
        return;
    }
    console.log("verified successfuly")
    const username = verified.data.username;
    const hash = req.params.hash;
    console.log("this is username and hash", username, hash);
    
    console.log("looking in redis cache for the url")
    redis.getUrl(hash)
    .then(url => {
        console.log("this was found: "+url)
        if(url){
            console.log("successful url, now getting clicks")
            redis.getClicks(url)
            .then(clicks => {
                console.log("this was the clicks found", clicks);
                res.status(200).json({
                    "url" : url,
                    "clicks" : clicks,
                    "username" : username 
                });
                return;
            });
        }
        else{
            console.log("couldn't find the url in redis now looking in mongo");
            schema.findUrlInstanceByHash(hash)
            .then(url => {
                console.log("this was found: "+url);
                if(url === undefined 
                || url === null
                || url.length === 0){
                    res.redirect('/notFound');
                    return;
                }
                res.status(200).json({
                    "url" : url,
                    "clicks" : clicks,
                    "username" : username 
                });
            });
        }
    });
});

app.get('/:hash', (req, res) => {

    redis.getUrl(req.params.hash).then(async data => {
        if(data){
            res.redirect(data.length >= 8 && data.substring(0, 8) === "https://" ? data : "https://"+data);

            redis.getClicks(data).then(async clicks => {
                clicks = Number(clicks);
                console.log(clicks);
                await redis.updateUrl(req.params.hash, data, clicks + 1);
            });
        }
        else{
            schema.findUrlInstanceByHash(req.params.hash).then(async dbData => {
                if(dbData !== undefined && dbData.length > 0){
                    const redirectTo = dbData[0].url.length >= 8 && dbData[0].url.substring(0, 8) === "https://" ? dbData[0].url : "https://"+dbData[0].url;
                    res.redirect(redirectTo);

                    redis.getClicks(dbData[0].url).then(async clicks => {
                        clicks = Number(clicks);
                        await redis.postUrl(req.params.hash, dbData[0].url, clicks + 1);
                    });
                }
                else{
                    res.sendStatus(404);
                }
            });
        }
        await schema.updateUrlClicks(req.params.hash);
    });
});

async function findValidHash(originalHash, hash, urlToLookFor, i){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    let ecnounteredBefore = false;
    while(!temp){
        let data = await schema.findUrlInstanceByHash(hash);
        if(5+i < originalHash.length){
            hash = originalHash.substring(i, i+5);
        }
        else{
            originalHash = hashUrl(hash);
            i = 0;
            hash = originalHash.substring(i, i+5);
        }
        if(data.length === 0){
            // url has not been stored before and found a new valid hash
            temp = true;
        }
        else if(data[0].url === urlToLookFor) {
            // url has been stored before
            ecnounteredBefore = true;
            temp = true;
        } 
        // not found yet so get a new substring
        else i=i+1;
        
    }
    return {validHash : hash, foundBefore : ecnounteredBefore};
}