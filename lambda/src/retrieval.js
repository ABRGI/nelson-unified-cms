const express = require('express');
const router = express.Router();
const jsdom = require('jsdom');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { JSDOM } = jsdom;

/**
 * Creates an instance of router with predefined AWS S3 and DynamoDB operations.
 *
 * This module is primarily for fetching and formatting HTML templates stored in S3 template bucket.
 *
 * @param {Object} s3Props - The properties for AWS S3 client.
 * @param {Object} dynamoProps - The properties for AWS DynamoDB client.
 *
 * @returns {Object} The express router.
 */
module.exports = (s3Props, dynamoProps) => {
	const dynamoClient = new DynamoDBClient(dynamoProps);
	const s3Client = new S3Client(s3Props);

	/**
	 * GET endpoint for '/'. Retrieves a file from AWS S3, transforms it to a string and
	 * returns it after serializing.
	 *
	 * @param {Object} req - Express request object, expects a body with 'file'.
	 * @param {Object} res - Express response object.
	 */
	router.get('/', async (req, res) => {
		const {file} = req.body;
		if (!file) res.status(400).send('Invalid request body.');
		try {
			const command = new GetObjectCommand({
				Bucket: 'template', Key: file ?? null,
			});

			const response = await s3Client.send(command);
			const str = await response?.Body?.transformToString();
			const dom = new JSDOM(str);
			res.send(dom.serialize());
		} catch (error) {
			res.status(500).send('Internal server error.');
		}
	});
	return router;
}