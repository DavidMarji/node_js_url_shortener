const path = require('path');
const express = require('express');
const crypto = require('crypto');
const app = express();
const schema = require('./urlSchema.js');
const bodyParser = require('body-parser');
const redis = require('./redis.js')

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

app.post('/urls/', async (req, res) => {
    const originalHash = hashUrl((req.body.url).toLowerCase());
    let postedHash = originalHash.length >= 5 
                    ? originalHash.substring(0, 5) 
                    : originalHash.substring(0, (req.body.url).length/2);

    console.log("this is the posted Hash assignment " + postedHash);

    schema.findUrlInstanceByHash(postedHash).then(async data => {
        //checking if hash already exists
        if(data !== undefined && data.length > 0){
            
            //find a new valid and short hash
            let validHash = await findValidHash(originalHash, postedHash, req.body.url, 0);
            console.log("this is valid hash", validHash);
            //url wasnt already stored and a new hash was found
            if(!validHash.foundBefore){
                await schema.createAndSaveUrlInstance(validHash.validHash, req.body.url);
            }
            await redis.postUrl(validHash.validHash, req.body.url);
            res.send({hashGenerated : validHash.validHash});
            return;
        }
        else{
            // hash is unique
            console.log(postedHash);
            await schema.createAndSaveUrlInstance(postedHash, req.body.url);
            await redis.postUrl(postedHash, req.body.url);
            res.send({hashGenerated : postedHash});
        } 
    });
});

app.get('/favicon.ico', (req, res) => {
    res.status(200).send();
});

app.get('/urls/:hash', (req, res) => {
    let cacheData = null;
    (async () => {
        await redis.getUrl(req.params.hash).then(async data => {
            console.log(data);
            if(data !== null){
                cacheData = data;
                console.log("inside redis");
                console.log(data.length >= 8 && data.substring(0, 8) === "https://" ? data : "https://"+data);
                res.redirect(data.length >= 8 && data.substring(0, 8) === "https://" ? data : "https://"+data);
                return;
            }
        });
        console.log("this is cacheData", cacheData);
    
        if(cacheData) return;
    
        await schema.findUrlInstanceByHash(req.params.hash).then(async data => {
            console.log("this is data " + data);
            if(data !== undefined && data.length > 0){
                res.redirect(data[0].url.length >= 8 && data[0].url.substring(0, 8) === "https://" ? data[0].url : "https://"+data[0].url);
            }
            else{
                res.statusCode(404);
            }
        });
    })();
});

async function findValidHash(originalHash, hash, urlToLookFor, i){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    let ecnounteredBefore = false;
    while(!temp){
        await schema.findUrlInstanceByHash(hash).then(data => {
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
        });
    }
    return {validHash : hash, foundBefore : ecnounteredBefore};
}