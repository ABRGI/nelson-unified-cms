const express = require('express');
const cors = require('cors');
const startServer = require('./utils/startServer');

const app = express();
let port = 3002;

const retrieval = require('./src/retrieval/retrieval');
const update = require('./src/update/update');
const publish = require('./src/publish/publish');
const mapping = require('./src/mapping/mapping');

app.use(cors());
app.use(express.json());

/**
 * Retrieval, update, and publish handlers for AWS operations.
 */

/**
 * Handles the POST request to retrieve data.
 *
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
app.post('/retrieve', (req, res) => {
	retrieval.handler({ body: req.body, httpMethod: 'POST' }).then((ret) => {
		res.statusCode = ret.statusCode;
		if (ret.statusCode === 200) return res.send(ret.HTML)
		return res.send(JSON.parse(ret.body));
	}).catch(function (err) {
		console.log(err);
	})
})

/**
 * Handles the PUT request to update data.
 *
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
app.put('/update', (req, res) =>   {
	update.handler({ body: req.body, httpMethod: 'PUT' }).then((ret) => {
		res.statusCode = ret.statusCode;
		res.send(JSON.parse(ret.body));
	}).catch(function (err) {
		console.log(err);
	})
})

/**
 * Handles the PUT request to publish data.
 *
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
app.put('/publish', (req, res) =>   {
	publish.handler({ body: req.body, httpMethod: 'PUT' }).then((ret) => {
		res.statusCode = ret.statusCode;
		res.send(JSON.parse(ret.body));
	}).catch(function (err) {
		console.log(err);
	})
})

/**
 * Handles the POST request to mapped data.
 *
 * @param {Object} req Express request object.
 * @param {Object} res Express response object.
 */
app.post('/mapping', (req, res) =>   {
	mapping.handler({ body: req.body, httpMethod: 'POST' }).then((ret) => {
		res.statusCode = ret.statusCode;
		res.send(JSON.parse(ret.body));
	}).catch(function (err) {
		console.log(err);
	})
})

startServer(app, port);