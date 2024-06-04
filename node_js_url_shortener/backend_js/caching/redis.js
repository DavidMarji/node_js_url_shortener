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

const postUrl = async function postUrl(hash, url) {
    await client.set(hash, url, 'EX', 60 * 60 * 24);
}

const updateUrl = async function updateUrl(hash, url){
    // delete the url saved with the hash
    await client.del(hash);

    // save the hash and url
    await client.set(hash, url, 'EX', 60 * 60 * 24);
}

module.exports = {postUrl, getUrl, updateUrl};