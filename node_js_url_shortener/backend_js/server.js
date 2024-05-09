const path = require('path');
const express = require('express');
const crypto = require('crypto');
const SHA256 = require("crypto-js/sha256");
const app = express();
const router = express.Router();
const schema = require("./urlSchema.js");

function hashUrl(url) {
	const hash = crypto.createHash('sha256');
	hash.update(url);
	return hash.digest('hex');
}

const server = app.listen(0, () => {
    console.log("Listening on " + server.address().port);
});

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
});

app.get('/url', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
});

app.post('/url/:url', (req, res) => {

    const originalHash = hashUrl(req.params.url.toLowerCase());
    let postedUrl = originalHash.substring(0, req.params.url.length/3);

    schema.findUrlInstanceByHash(postedUrl).then(async data => {
        //checking if hash already exists
        if(data !== undefined && data.length > 0){
            
            //find a new valid and short hash
            let validHash = await findValidHash(originalHash, postedUrl, req.params.url, 0);

            //url wasnt already stored and a new hash was found
            if(!validHash.foundBefore){
                schema.createAndSaveUrlInstance(validHash, req.params.url);
            }
            res.send({hashGenerated : validHash.validHash});
            return;
        }
        else{
            // hash is unique
            schema.createAndSaveUrlInstance(postedUrl, req.params.url);
            res.send({hashGenerated : postedUrl});
        } 
    });
});

app.get('/:hash', (req, res) => {
    schema.findUrlInstanceByHash(req.params.hash).then(async data => {
        console.log("this is data " + data);
        if(data !== undefined && data.length > 0){
            res.redirect("https://"+data[0].url);
            return;
        }
        else{
            res.statusCode(404);
            res.sendStatus();
        }
    });
});

async function findValidHash(originalHash, hash, urlToLookFor, i){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    let ecnounteredBefore = false;
    while(!temp){
        await schema.findUrlInstanceByHash(hash).then(data => {
            if(10+i < originalHash.length){
                hash = originalHash.substring(i, (urlToLookFor.length/3) + i);
            }
            else{
                originalHash = hashUrl(hash);
                i = 0;
                hash = originalHash.substring(i, (urlToLookFor.length/3) + i);
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