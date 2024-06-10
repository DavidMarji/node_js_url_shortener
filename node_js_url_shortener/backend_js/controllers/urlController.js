const express = require('express');
const router = express.Router();
const urlManager = require('../handlers/urls/urlHandler.js');

router.post('/home/urls/', async (req, res) => {
    console.log("inside post /urls/");
    if(req.body.custom) {
        const statusCode = await urlManager.saveUrlWithCustomHash(req.body.custom, req.body.url, req.headers.authentication);
        if (statusCode === 401) {
            res.sendStatus(401);
            return;
        }
        else if (statusCode === 422) {
            res.sendStatus(422);
            return;
        }
        else if (statusCode === 409) {
            res.sendStatus(409);
            return;
        }

        res.status(200).json({"hashGenerated" : req.body.custom});
        return;
    }

    const statusCode = await urlManager.saveUrlWithRandomHash(req.body.url, req.headers.authentication);
    if (statusCode === 401) {
        res.redirect('/errors/unauthorized');
        return;
    }
    else if (statusCode === 409) {
        res.sendStatus(409);
        return;
    }

    res.status(200).json({"hashGenerated" : statusCode});
});

router.put('/home/urls/:hash', async (req, res) => {
    console.log("inside get /urls/:hash");
    const urlUpdate = await urlManager.updateHash(req.params.hash, req.body.url, req.headers.authentication);
    res.sendStatus(urlUpdate);
});

router.get('/home/urls/:hash/info', async (req, res) => {
    console.log("inside get /urls/:hash/info");
    const urlJson = await urlManager.getAllUrlInfo(
        req.params.hash,
        req.headers.authentication
    );

    if (urlJson === 404) {
        res.sendStatus(404);
        return;
    }
    else if (urlJson === 401) {
        res.sendStatus(401);
        return;
    }

    res.status(200).json(urlJson);
});

router.get('/:hash', async (req, res) => {
    console.log("inside get /:hash");

    const url = await urlManager.getUrl(req.params.hash);
    if (url === 404) {
        res.redirect('/errors/notFound');
        return;
    }
    res.redirect(url);
});

module.exports = {router};