const crypto = require('crypto');
const urlSchema = require('../schema/urlSchema.js');

function hashUrl(url) {
	const hash = crypto.createHash('sha256');
	hash.update(url);
	return hash.digest('hex');
}

const findValidHash = async function findValidHash(url){
    //continuously check if the updated hash is valid until one is found
    let temp = false;
    let encounteredBefore = false;
    let originalHash = hashUrl(url);
    let hash = originalHash.substring(0, 5);
    let i = 0;
    while(!temp){
        let data = await urlSchema.findUrlInstanceByHash(hash);
        
        if(data.length === 0){
            // url has not been stored before and found a new valid hash
            temp = true;
        }
        else if(data[0].url === url) {
            // url has been stored before
            encounteredBefore = true;
            temp = true;
        } 
        else{
            i++;
        }

        if(!temp && 5+i < originalHash.length){
            hash = originalHash.substring(i, i+5);
        }
        else if(!temp){
            originalHash = hashUrl(hash);
            i = 0;
            hash = originalHash.substring(i, i+5);
        }
    }
    return {validHash : hash, foundBefore : encounteredBefore};
}

module.exports = {findValidHash};