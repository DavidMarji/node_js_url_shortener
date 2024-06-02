const redis = require('redis');
const client = redis.createClient({
    socket: {
        host: "127.0.0.1",
        port: 6379
    },
});

(async () => {
    // Connect to redis server
    await client.connect();
})();

client.on('connect', async () => {
    console.log('Connected to redis!');
});

const getUrl = async function getUrl(hash){
    const data = await client.get(hash);
    return data;
}

const getClicks = async function getClicks(url){
    const data = await client.get(url);
    return data;
}

const postUrl = async function postUrl(hash, url, clicks) {
    await client.set(hash, url);
    await client.set(url, clicks);
}

const updateUrl = async function updateUrl(hash, url, clicks){
    // delete the clicks saved with the url
    await client.del(await client.get(hash));
    // delete the url saved with the hash
    await client.del(hash);

    // save the hash and url
    await client.set(hash, url);
    // save the url and clicks
    await client.set(url, clicks);
}

module.exports = {postUrl, getUrl, updateUrl, getClicks};