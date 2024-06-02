const mongoose = require("mongoose");
const urlSchema = new mongoose.Schema({
    hash : {type: String, unique: true, required: true},
    url : {type: String, required: true},
    username: {type: String, required: true},
    clicks: {type: Number, required: true}
});

const Url = mongoose.model("Url", urlSchema);

const createAndSaveUrlInstance = async function createAndSaveUrlInstance(hashToSave, urlToSave, usernameToSave){
    const url = new Url({
        hash: hashToSave,
        url: urlToSave,
        username: usernameToSave,
        clicks: 0
    });
    url.save();
}

const main = async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/url_shortener');
}

main();

const findUrlInstanceByHash = async function findUrlInstanceByHash(hashToLookup){
    let urlFound = await Url.find({hash : hashToLookup});
    return urlFound;
}

// only the same user can update a url
const updateUrlInstance = async function updateUrlInstance(hashToLookup, newUrl, inpUsername){
    await Url.updateOne({hash : hashToLookup}, 
        {
            hash : hashToLookup,
            url : newUrl, 
            username : inpUsername,
            clicks : 0
        });
}

const updateUrlClicks = async function updateUrlClicks(hashToLookup){
    try {
        await Url.updateOne({ hash: hashToLookup }, {
            $inc: { clicks: 1 }
        });
    } catch (error) {
        console.error(`Failed to update clicks for hash ${hashToLookup}:`, error);
    }
}

const findUserUrls = async function findUserUrls(usernameToLookup){
    const userUrls = await Url.find({username: usernameToLookup})
    return userUrls;
}

module.exports = {createAndSaveUrlInstance, findUrlInstanceByHash, updateUrlInstance, findUserUrls, updateUrlClicks};