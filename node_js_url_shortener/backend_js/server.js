const path = require('path');
const express = require('express');
const router = express.Router();
const app = express();
const bodyParser = require('body-parser');
const verifyAccessToken = require('./jwt/jwt.js').verifyAccessToken;
const urlManager = require('./urls/url.js');
const users = require("./users/manageUsers.js");

app.listen(3000, ()=> console.log('Listening on 3000'));

app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('*', (error, req, res, next)=>{
    console.log(error)
})

app.use((req, res, next) => {
    console.log(req.url, req.method);
    next();
});

app.get('/favicon.ico', (req, res) => {
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/signUp', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'signUpPage.html'))
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'loginPage.html'));
});

app.get("/unauthorized", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'unauthorized.html'));
});

app.get('/notFound', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'notFound.html'));
});

app.get('/unknownError', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'errors', 'unknownError.html'));
});

// sign up post request
app.post('/users/', async (req, res) => {
    const signUpCode = await users.signUp(req.body.username, req.body.email, req.body.password);
    if (signUpCode === 409) {
        res.sendStatus(409);
        return;
    }
    res.status(200).json(signUpCode);
});

// login
app.get('/users/:username/:password', async (req, res) => {
    const loginCode = await users.login(req.params.username, req.params.password);
    if (loginCode === 404) {
        res.sendStatus(404);
        return;
    }
    else if (loginCode === 409) {
        res.sendStatus(409);
        return;
    }

    res.status(200).json(loginCode);
});

app.get('/users/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'users', 'viewAllUsers.html'));
});

app.get('/users', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'users', 'viewAllUsers.html'));
});

app.get('/users/view', async (req, res) => {
    const allUsers = await users.getAllUsers(req.headers.authentication);
    if (allUsers === 400 || allUsers === 401){
        res.sendStatus(allUsers);
        return;
    } 
    res.status(200).json(allUsers);
});

// the two below are tied and the first one is basically used to force the request to include a header with the jwt that we sent so we can verify it
app.get('/users/:username', (req,res) => {
    res.render(path.join(__dirname, '..', 'views', 'users', 'users.html'), {username : req.params.username});
});
app.get("/users/:username/urls/view", async (req, res) => {
    
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

app.get('/urls', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
});

app.get('/urls/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'url.html'));
});

app.get('/jwt', (req, res) => {
    const verified = verifyAccessToken(req.headers.authentication);
    if(!verified.success){
        res.sendStatus(401);
        return;
    }
    res.sendStatus(200);
});

app.post('/urls/', async (req, res) => {
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
        res.redirect('/unauthorized');
        return;
    }
    else if (statusCode === 409) {
        res.sendStatus(409);
        return;
    }

    res.status(200).json({"hashGenerated" : statusCode});
});

app.put('/urls/:hash', async (req, res) => {
    const urlUpdate = await urlManager.updateHash(req.params.hash, req.body.url, req.headers.authentication);
    res.sendStatus(urlUpdate);
});

app.get('/urls/:hash', (req, res) => {
    
    const hash = req.params.hash;
    res.render(path.join(__dirname, '..', 'views', 'urlInfo.html'), { hash : hash });
});

app.get('/urls/:hash/info', async (req, res) => {
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

app.get('/:hash', async (req, res) => {
    const url = await urlManager.getUrl(req.params.hash);
    if (url === 404) {
        res.redirect('/notFound');
        return;
    }
    res.redirect(url);
});

app.get('*', (req, res) => {
    res.redirect('/notFound');
});