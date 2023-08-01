const express = require('express');
const siteLoader = require('./routes/loader');
const startServer = require('./utils/startServer');

const app = express();
const port = 3000;

app.use(express.static('public'));

app.use('/loader', siteLoader);

app.get('/', (req, res) => {
    res.send("<iframe src='/loader' width='1280' height='800'></iframe>");
});

startServer(app, port);