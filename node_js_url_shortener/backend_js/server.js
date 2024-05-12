const path = require('path');
const express = require('express');
const crypto = require('crypto');
const SHA256 = require("crypto-js/sha256");
const app = express();
const router = express.Router();
const schema = require("./urlSchema.js");
const bodyParser = require('body-parser');

function hashUrl(url) {
	const hash = crypto.createHash('sha256');
	hash.update(url);
	return hash.digest('hex');
}

app.listen(3000);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
});

app.get('/', (req, res) => {
    res.redirect('/urls');
});

app.get('/urls', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
})

app.post('/urls/', (req, res) => {
    const originalHash = hashUrl((req.body.url).toLowerCase());
    let postedUrl = originalHash.substring(0, Math.floor(Math.random() * Math.floor(req.body.url.length/2)) + 1);


    schema.findUrlInstanceByHash(postedUrl).then(async data => {
        //checking if hash already exists
        if(data !== undefined && data.length > 0){
            
            //find a new valid and short hash
            let validHash = await findValidHash(originalHash, postedUrl, req.body.url, 0);

            //url wasnt already stored and a new hash was found
            if(!validHash.foundBefore){
                await schema.createAndSaveUrlInstance(validHash, req.body.url);
            }
            res.send({hashGenerated : validHash.validHash});
            return;
        }
        else{
            // hash is unique
            await schema.createAndSaveUrlInstance(postedUrl, req.body.url);
            res.send({hashGenerated : postedUrl});
        } 
    });
});

app.get('/favicon.ico', (req, res) => {
    res.status(200).send();
});

app.get('/urls/:hash', (req, res) => {
    schema.findUrlInstanceByHash(req.params.hash).then(async data => {
        console.log("this is data " + data);
        if(data !== undefined && data.length > 0){
            res.redirect(data[0].url.length >= 8 && data[0].url.substring(0, 8) === "https://" ? data[0].url : "https://"+data[0].url);
            return;
        }
        else{
            res.statusCode(404);
        }
    });
});

async function findValidHash(originalHash, hash, urlToLookFor, i){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    let ecnounteredBefore = false;
    while(!temp){
        await schema.findUrlInstanceByHash(hash).then(data => {
            let trialLength = Math.floor(Math.random() * Math.min(Math.floor(urlToLookFor.length/2), originalHash.length) + 1);
            if(trialLength < originalHash.length){
                hash = originalHash.substring(i, trialLength);
            }
            else{
                originalHash = hashUrl(hash);
                i = 0;
                hash = originalHash.substring(i, Math.floor(trialLength/2));
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
        });
    }
    return {validHash : hash, foundBefore : ecnounteredBefore};
}