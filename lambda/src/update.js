const express = require('express');
const router = express.Router();
const { DynamoDBClient, UpdateItemCommand, QueryCommand, GetItemCommand} = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


/**
 * Creates an instance of router with predefined AWS S3 and DynamoDB operations.
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
	 * PUT endpoint for '/db'. Update an item(s) in DynamoDB.
	 *
	 * @param {Object} req - Express request object, expects a body with 'clientId' and 'contentSections'.
	 * @param {Object} res - Express response object.
	 */
	router.put('/db', async (req, res) => {

		/**
		 * Constructs the update parameters for the given client ID and section updates.
		 *
		 * @param {string} clientId - The client ID.
		 * @param {Object} sectionUpdates - Object containing section updates.
		 *
		 * @returns {Promise<Object>} The DynamoDB update parameters.
		 */
		const updateParams = async (clientId, sectionUpdates) => {
			const contentUpdates = marshall(sectionUpdates);
			let updateExpression = 'SET ';
			const expressionAttributeValues = {};
			const expressionAttributeNames = {};
			for (const [section, updates] of Object.entries(contentUpdates)) {
				if (!updates || typeof updates !== 'object') {
					throw new Error(`Invalid updates for section: ${section}`);
				}
				for (const [field, update] of Object.entries(updates)) {
					const key = `:${section}`;
					const sectionAlias = `#${section}`;
					expressionAttributeNames[sectionAlias] = section;
					updateExpression += `environments.dev.sections.${sectionAlias}.${Object.keys(update)[0]} = ${key}, `;
					expressionAttributeValues[key] = Object.values(update)[0];
				}
			}
			updateExpression = updateExpression.slice(0, -2);

			const getParams = {
				TableName: process.env.DYNAMODB_TABLE,
				Key: {
					clientId: { N: clientId }
				}
			}
			const data = await dynamoClient.send(new GetItemCommand(getParams));
			if (!data.Item) {
				throw new Error("Item doesn't exist, can't update");
			}

			return {
				TableName: process.env.DYNAMODB_TABLE,
				Key: {
					clientId: { N: clientId }
				},
				UpdateExpression: updateExpression,
				ExpressionAttributeValues: expressionAttributeValues,
				ExpressionAttributeNames: expressionAttributeNames,
				ReturnValues: "UPDATED_NEW"
			}
		};

		/**
		 * Validates the content sections in the request body.
		 *
		 * @param {Object} sectionUpdates - Object containing section updates.
		 *
		 * @returns {boolean} Whether the section updates are valid.
		 */
		const validateRequestBody = (sectionUpdates) => {
			const validSections = ["hero", "experiences", "gallery", "howitworks", "faq", "location"];
			const hasValidSection = validSections.some(section => sectionUpdates.hasOwnProperty(section));
			if (!hasValidSection) {
                throw new Error('Invalid section in request body.');
            }
			return hasValidSection;
		}

		const { clientId, contentSections } = req.body;
		console.log('clientId:', clientId);
		console.log('contentSections:', contentSections);
		if (!clientId) return res.status(400).json({ error: 'clientId is required' });
		if (!contentSections || typeof contentSections !== 'object') {
			return res.status(400).json({ error: 'contentSections is required and should be an object.' });
		}
		if (!validateRequestBody(contentSections)) {
			return res.status(400).json({ error: 'Invalid section updates in request body.' });
		}

		try {
			const params = await updateParams(clientId, contentSections);
			console.log('params:', params);
			const updatedData = await dynamoClient.send(new UpdateItemCommand(params));
			console.log('updatedData:', updatedData);
			res.status(200).send('Updated successfully.');
		} catch (error) {
			res.status(500).send(`${error}`);
			console.error("Error", error);
		}
	});

	/**
	 * PUT endpoint for '/html'. Uploads an HTML object to AWS S3.
	 *
	 * @param {Object} req - Express request object, expects a body with 'htmlObject' and 'clientId'.
	 * @param {Object} res - Express response object.
	 */
	router.put('/html', async (req, res) => {
		const { htmlObject, clientId } = req.body;
		if (!htmlObject || !clientId) res.status(400).send('Invalid request body.');

		try {
			const putObjectCommand = new PutObjectCommand({
				"Bucket": `test-environment-bucket-${clientId}`,
				"Key": 'index.html',
				"Body": htmlObject.toString(),
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