const urlSchema = require('../../model/schema/urlSchema.js');
const jwt = require('../../utilities/jwt/jwt.js');
const hashing = require('../../utilities/hashing/hash.js');
const redis = require('../../model/caching/redis.js');
const getUser = require('../users/userHandler.js').getUser;

function validateCustomHash(custom) {
    // if the user put a custom hash with ' ~,<>;\':"/\\[]^{}()=+!*@&$?%#|' it should not be allowed.
    const pattern = /[ ~,<>\';:"/\\[\]^{}()=+!*@&$?%#|]/;
    return !pattern.test(custom);
}

const getUserUrls = async function getUserUrls(username, accessToken) {
    const verified = jwt.verifyAccessToken(accessToken);
    if(!verified.success) {
        return 401;
    }
    
    let urls = [];
    let userUrls;
    try {
        userUrls = await urlSchema.findUserUrls(username);
        // a user could have no urls
        if (userUrls === null || userUrls === undefined) return 404;

        // check if the user exists
        const user = await getUser(username);
        if ((user === null) || (user === undefined)) return 404;
    }
    catch (error){
        console.log(error);
        return 404;
    }
    
    for(let url of userUrls){
        urls.push({
            "url" : url.url, 
            "code" : url.hash
        });
    }
    return(urls);
}

// if a user does not provide a custom hash
const saveUrlWithRandomHash = async function saveUrlWithRandomHash(url, accessToken) {
    const verified = jwt.verifyAccessToken(accessToken);
    if(!verified.success){
        return 401;
    }

    url = await url.toLowerCase();
    const validHash = await hashing.findValidHash(url);
    // url already has a hash
    if(validHash.foundBefore) return validHash.validHash;

    try {
        await urlSchema.createAndSaveUrlInstance(validHash.validHash, url, verified.data.username);
        await redis.postUrl(validHash.validHash, url);
    }
    catch (error) {
        console.log(error);
        return 409;
    }

    return validHash.validHash;
}

// if the user gives a custom hash
const saveUrlWithCustomHash = async function saveUrlWithCustomHash(custom, url, accessToken) {
    const verified = jwt.verifyAccessToken(accessToken);
    if(!verified.success){
        return 401;
    }
    if(!validateCustomHash(custom)) return 422;

    try {
        url = await url.toLowerCase();
        await urlSchema.createAndSaveUrlInstance(custom, url, verified.data.username);
        await redis.postUrl(custom, url);
    }
    catch(error) {
        console.log(error);
        return 409;
    }

    return 200;
}

// update a hash to a new url
const updateHash = async function updateHash(hash, newUrl, accessToken) {
    const verified = jwt.verifyAccessToken(accessToken);
    if(!verified.success){
        return 401;
    }

    try {
        newUrl = await newUrl.toLowerCase();
        await urlSchema.updateUrlInstance(hash, newUrl, verified.data.username);

        // check if it is already in redis.
        const redisUrl = await redis.getUrl(hash);
        if(redisUrl === null || redisUrl === undefined || redisUrl.length === 0){
            await redis.postUrl(hash, newUrl);
        }
        else {
            await redis.updateUrl(hash, newUrl);
        }
    }
    catch (error) {
        console.log(error);
        // the hash probably did not exist.
        return 404;
    }

    return 200;
}

const getAllUrlInfo = async function getAllUrlInfo(hash, accessToken) {
    const verified = jwt.verifyAccessToken(accessToken);
    if(!verified.success){
        return 401;
    }

    try {
        const data = await urlSchema.findUrlInstanceByHash(hash);
        if(data === null || data === undefined) return 404;

        const username = data.username;
        const clicks = data.clicks;
        const url = data.url;

        return {
            "username" : username,
            "clicks" : clicks,
            "url" : url
        };
    }
    catch (error) {
        console.log(error);
        return 404;
    }
}

const getUrl = async function getUrl(hash) {
    try {
        const data = await urlSchema.findUrlInstanceByHash(hash);
        if (data === null || data === undefined) return 404;

        await updateClicks(hash);
        return data.url.length > 8 && data.url.substring(0, 8) === "https://" 
                ? data.url 
                : "https://"+data.url;
    }
    catch (error) {
        console.log(error);
        return 404;
    }
}

const updateClicks = async function updateClicks(hash) {
    try {
        urlSchema.updateUrlClicks(hash);
    }
    catch (error) {
        console.log(error);
        throw new Error(error);
    }
}
module.exports = {getUserUrls, saveUrlWithRandomHash, saveUrlWithCustomHash, updateHash, getAllUrlInfo, getUrl, updateClicks};