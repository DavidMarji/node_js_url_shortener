const mongoose = require("mongoose");
const urlSchema = new mongoose.Schema({
    hash : String,
    url : String,
});

const Url = mongoose.model("Url", urlSchema);

const createAndSaveUrlInstance = async function createAndSaveUrlInstance(hashToSave, urlToSave){
    const url = new Url({hash: hashToSave, url: urlToSave});
    url.save();
}

const main = async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener');
  
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

main();

const findUrlInstanceByHash = async function findUrlInstanceByHash(hashToLookup){
    const urlFound = await Url.find({hash : hashToLookup});
    return urlFound;
}

const updateUrlInstance = async function updateUrlInstance(hashToLookup, newUrl){
    await Url.updateOne({hash : hashToLookup}, {hash : hashToLookup, url : newUrl});
}

const containsUrl = async function containsUrl(urlToLookup){
    const urlFound = await Url.find({url : urlToLookup});
    return urlFound;
}

module.exports = {createAndSaveUrlInstance, findUrlInstanceByHash, containsUrl, updateUrlInstance};