const express = require('express');
const router = express.Router();
const path = require('path');
const verifyAccessToken = require('../utilities/jwt/jwt.js').verifyAccessToken;

router.get('/', (req, res) => {
    console.log("hi");
    res.redirect('/home/login');
});

router.get('/home/login', (req, res) => {
    console.log("inside login");
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'loginPage.html'));
});

router.get('/home/signUp', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'signUpPage.html'))
});

router.get('/favicon.ico', (req, res) => {
    res.sendStatus(200);
});

router.get("/errors/unauthorized", (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'errors', 'unauthorized.html'));
});

router.get('/errors/notFound', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'errors', 'notFound.html'));
});

router.get('/errors/unknownError', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'errors', 'unknownError.html'));
});

router.get('/home/users/all', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'users', 'viewAllUsers.html'));
});

router.get('/home/users/all/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'users', 'viewAllUsers.html'));
});

router.get('/home/urls', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'url.html'));
});

router.get('/jwt', (req, res) => {
    console.log("inside get /jwt");
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.sendStatus(401);
        return;
    }
    res.sendStatus(200);
});

router.get('/home/users/profiles/:username', (req,res) => {
    res.render(path.join(__dirname, '..', '..', 'views', 'users', 'users.html'), {username : req.params.username});
});

router.get('/home/url-shortener/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'url.html'));
});

router.get('/home/urls/:hash', (req, res) => {
    
    const hash = req.params.hash;
    res.render(path.join(__dirname, '..', '..', 'views', 'urlInfo.html'), { hash : hash });
});

module.exports = {router};