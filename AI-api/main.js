const express = require('express');
const cors = require('cors');
const apiroute = require('./routes/api');
const startServer = require('./utils/startServer');

const app = express();
let port = 3000;

app.use(cors());
app.use(express.json());
app.use('/', apiroute);

startServer(app, port);