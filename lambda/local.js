const express = require('express');
const cors = require('cors');
const startServer = require('./utils/startServer');

const app = express();
let port = 3002;

/**
 * AWS DynamoDB and S3 properties setup.
 * If running in local mode, use the provided access key, secret key, and S3 endpoint.
 * If not in local mode, just set the region.
 */
const dynamoProps = { region: process.env.ENV_REGION }
const s3Props = { region: process.env.ENV_REGION }
if (process.env.LOCAL) {
	dynamoProps.credentials = {
		accessKeyId: process.env.ACCESSKEY,
		secretAccessKey: process.env.SECRETKEY
	};
	s3Props.credentials = {
		accessKeyId: process.env.ACCESSKEY,
		secretAccessKey: process.env.SECRETKEY
	};
	s3Props.endpoint = process.env.S3_ENDPOINT;
	s3Props.sslEnabled = false;
	s3Props.forcePathStyle = true;
}
const retrieval = require('./src/retrieval')(s3Props, dynamoProps);
const update = require('./src/update')(s3Props, dynamoProps);
const publish = require('./src/publish')(s3Props, dynamoProps);

app.use(cors());
app.use(express.json());

/**
 * Retrieval, update, and publish handlers for AWS operations.
 */
app.use('/retrieve', retrieval);
app.use('/update', update);
app.use('/publish', publish);

startServer(app, port);