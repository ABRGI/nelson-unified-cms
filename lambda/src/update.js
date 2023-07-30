const express = require('express');
const router = express.Router();
const { DynamoDBClient, UpdateItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


/**
 * Creates an instance of router with predefined AWS S3 and DynamoDB operations.
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
	 * PUT endpoint for '/dbentry'. Update an item in DynamoDB.
	 *
	 * @param {Object} req - Express request object, expects a body with 'primaryKey'.
	 * @param {Object} res - Express response object.
	 */
	router.put('/dbentry', async (req, res) => {
		const { primaryKey } = req.body;
		if (!primaryKey) res.status(400).send('Invalid request body.');
		const queryCommand = new QueryCommand({
			TableName: process.env.DYNAMODB_TABLE,
			KeyConditionExpression: '#pk = :pk',
			ExpressionAttributeNames: {
				'#pk': 'primaryKey'
			},
			ExpressionAttributeValues: {
				':pk': { S: primaryKey }
			}
		});

		try {
			const data = await dynamoClient.send(queryCommand);
			if (data.Items.length > 0) {
				const updateItemCommand = new UpdateItemCommand({
					TableName: process.env.DYNAMODB_TABLE,
					Item: {
						'primaryKey': { S: req.body.primaryKey },
						'attributeName': { S: '' }
					}
				});
				await dynamoClient.send(updateItemCommand);
				res.status(200).send('Updated successfully.');
			} else {
				res.status(404).send('Not found.');
			}
		} catch (error) {
			res.status(500).send('Internal server error.');
			console.error(error);
		}
	});

	/**
	 * PUT endpoint for '/htmlentry'. Uploads an HTML object to AWS S3.
	 *
	 * @param {Object} req - Express request object, expects a body with 'htmlObject' and 'clientName'.
	 * @param {Object} res - Express response object.
	 */
	router.put('/htmlentry', async (req, res) => {
		const { htmlObject, clientName } = req.body;
		if (!htmlObject || !clientName) res.status(400).send('Invalid request body.');

		try {
			const putObjectCommand = new PutObjectCommand({
				"Bucket": clientName,
				"Key": 'index.html',
				"Body": htmlObject,
				"ContentType": 'text/html'
			});
			await s3Client.send(putObjectCommand);
			res.status(200).send('Updated successfully.');
		} catch (error) {
			res.status(500).send('Internal server error.');
			console.error(error);
		}
	});

	return router;
}