const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pageController = require('./controllers/pageController.js');
const userController = require('./controllers/userController.js');
const urlController = require('./controllers/urlController.js');

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
    
app.use(pageController.router);
app.use(userController.router);
app.use(urlController.router);

app.get('*', (req, res) => {
    res.redirect('/notFound');
});