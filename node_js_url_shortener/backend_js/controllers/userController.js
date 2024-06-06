const express = require('express');
const router = express.Router();
const users = require('../handlers/users/userHandler.js');
const urlManager = require('../handlers/urls/urlHandler.js');

router.get('/home/users', async (req, res) => {
    console.log("inside get /users/view");
    console.log("this is the jwt in /home/users", req.headers.authentication);

    const allUsers = await users.getAllUsers(req.headers.authentication);
    if (allUsers === 400 || allUsers === 401){
        res.sendStatus(allUsers);
        return;
    } 
    res.status(200).json(allUsers); 
});

// sign up post request
router.post('/home/users', async (req, res) => {
    console.log("inside post /users/");
    const signUpCode = await users.signUp(req.body.username, req.body.email, req.body.password);
    if (signUpCode === 409) {
        res.sendStatus(409);
        return;
    }
    res.status(200).json(signUpCode);
});

// login
router.get('/home/users/:username/:password', async (req, res) => {
    console.log("inside get /users/:username/:password");
    const loginCode = await users.login(req.params.username, req.params.password);
    if (loginCode === 404) {
        res.sendStatus(404);
        return;
    }
    else if (loginCode === 409) {
        res.sendStatus(409);
        return;
    }
    res.status(200).json({loginCode});
});

router.get("/home/users/:username/urls/view", async (req, res) => {
    console.log("inside get /users/:username/urls/view");
    const urls = await urlManager.getUserUrls(req.params.username, req.headers.authentication);
    if (urls === 401){
        res.sendStatus(401);
        return;
    } 
    else if (urls === 404){
        res.sendStatus(404);
        return;
    } 

    // no error so send the list of urls
    res.status(200).json(urls);
});

module.exports = {router};