const express = require('express');
const router = express.Router();
const jsdom = require('jsdom');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { JSDOM } = jsdom;

/**
 * Creates an instance of router with predefined AWS S3 and DynamoDB operations.
 * This module is primarily for fetching and formatting HTML templates stored in S3 template bucket.
 *
 * @param {Object} s3Props - The properties for AWS S3 client.
 * @param {Object} dynamoProps - The properties for AWS DynamoDB client.
 *
 * @returns {express.Router} The express router with AWS operations.
 */
module.exports = (s3Props, dynamoProps) => {
	const dynamoClient = new DynamoDBClient(dynamoProps);
	const s3Client = new S3Client(s3Props);

	/**
	 * POST endpoint for '/html'. Retrieves a file from AWS S3, transforms it to a string
	 * and sends it as a response after serializing.
	 *
	 * @param {Object} req - Express request object, expects a body with 'clientId' and 'targetFile'.
	 * @param {Object} res - Express response object.
	 */
	router.post('/html', async (req, res) => {
		const {targetFile, clientId} = req.body;

		/**
		 * Fetches the specified file from the given S3 bucket.
		 *
		 * @param {string} bucket - The name of the S3 bucket.
		 * @param {string} targetFile - The key of the target file in the S3 bucket.
		 *
		 * @returns {Promise<string|undefined>} The file content as a string, or undefined if not found.
		 */
		const getFile = async (bucket, targetFile) => {
			const command = {
                "Bucket": bucket, "Key": targetFile,
            };
			const response = await s3Client.send(new GetObjectCommand(command));
			return response?.Body?.transformToString();
		}
		let data = await getFile(`test-environment-bucket-${clientId}`, targetFile);
		if (!data) {
			data = await getFile('template', targetFile)
		}
		try {
			const dom = new JSDOM(data);
			res.send(dom.serialize());
		} catch (error) {
			res.status(500).send('Internal server error.');
			console.error(error);
		}
	});
	return router;
}