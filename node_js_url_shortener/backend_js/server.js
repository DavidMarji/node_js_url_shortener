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

app.post('/urls/', (req, res) => {
    const originalHash = hashUrl((req.body.url).toLowerCase());
    let postedHash = originalHash.length >= 5 
                    ? originalHash.substring(0, 5) 
                    : originalHash.substring(0, (req.body.url).length/2);

    schema.findUrlInstanceByHash(postedHash).then(data => {
        //checking if hash already exists
        console.log("this is data[0] in findUrlInstanceByHash", data[0]);
        if(data !== undefined && data.length > 0){
            
            //find a new valid and short hash 
            let validHash;
            findValidHash(originalHash, postedHash, req.body.url, 0).then((returnedJson) => {
                validHash = returnedJson;
                if(!validHash.foundBefore){
                    schema.createAndSaveUrlInstance(validHash.validHash, req.body.url).then(() => {});
                }
                redis.postUrl(validHash.validHash, req.body.url)
                    .then(() => {
                        res.send({hashGenerated : validHash.validHash});
                        return;
                    });    
            });
            //url wasnt already stored and a new hash was found
        }
        else{
            // hash is unique
            schema.createAndSaveUrlInstance(postedHash, req.body.url).then(() => {});
            redis.postUrl(postedHash, req.body.url).then(() => {});
            res.send({hashGenerated : postedHash});
        } 
    });
});

app.put('/urls/:hash', (req, res) => {
    const newUrl = (req.body.url).toLowerCase();

    schema.findUrlInstanceByHash(req.params.hash).then(async data => {
        if(data[0] !== undefined && data.length> 0) {
            schema.updateUrlInstance(req.params.hash, req.body.url).then((success) => {
                console.log("updated url in mongo");
            });
            redis.updateUrl(req.params.hash, req.body.url).then(() => {
                console.log("updated redis cache");
            })
            res.sendStatus(200);
            return;
        }
        res.sendStatus(404);
    });
});

app.get('/favicon.ico', (req, res) => {
    res.status(200).send();
});

app.get('/urls/:hash', (req, res) => {
        redis.getUrl(req.params.hash).then(async data => {
            if(data !== null){
                cacheData = data;
                res.redirect(data.length >= 8 && data.substring(0, 8) === "https://" ? data : "https://"+data);
                return;
            }
            schema.findUrlInstanceByHash(req.params.hash).then(async data => {
                if(data !== undefined && data.length > 0){
                    const redirectTo = data[0].url.length >= 8 && data[0].url.substring(0, 8) === "https://" ? data[0].url : "https://"+data[0].url;
                    res.redirect(redirectTo);
                }
                else{
                    res.statusCode(404);
                }
            });
        });
});

async function findValidHash(originalHash, hash, urlToLookFor, i){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    console.log("hi");
    let ecnounteredBefore = false;
    while(!temp){
        console.log("This is hash findValidHash\n", hash);
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