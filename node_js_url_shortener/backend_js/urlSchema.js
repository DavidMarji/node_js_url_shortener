const mongoose = require("mongoose");
const urlSchema = new mongoose.Schema({
    hash : String,
    url : String,
});

const Url = mongoose.model("Url", urlSchema);

const createAndSaveUrlInstance = function createAndSaveUrlInstance(hashToSave, urlToSave){
    console.log(urlToSave);
    const url = new Url({hash: hashToSave, url: urlToSave});
    console.log(url);
    url.save();
}

const main = async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener');
  
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

main();

const findUrlInstanceByHash = async function findUrlInstanceByHash(hashtoLookup){
    const urlFound = await Url.find({hash : hashtoLookup});
    console.log("this is url found in findurlinstancbyhash " + urlFound);
    return urlFound;
}

const containsUrl = async function containsUrl(urlToLookup){
    const urlFound = await Url.find({url : urlToLookup});
    console.log("this is containsUrl " + urlFound);
    return urlFound;
}

module.exports = {createAndSaveUrlInstance, findUrlInstanceByHash, containsUrl};