const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

/**
 * AWS DynamoDB and S3 properties setup.
 * If running in local mode, use the provided access key, secret key, and S3 endpoint.
 * If not in local mode, just set the region.
 */
const dynamoProps = { region: process.env.ENV_REGION }
const s3Props = { region: process.env.ENV_REGION }
if (process.env.LOCAL === "true") {
	s3Props.endpoint = process.env.S3_ENDPOINT;
	s3Props.sslEnabled = false;
	s3Props.forcePathStyle = true;
	dynamoProps.endpoint = process.env.DYNAMODB_ENDPOINT;
	dynamoProps.sslEnabled = false;
	dynamoProps.credentials = {
		accessKeyId: process.env.ACCESSKEY,
		secretAccessKey: process.env.SECRETKEY
	};
	s3Props.credentials = {
		accessKeyId: process.env.ACCESSKEY,
		secretAccessKey: process.env.SECRETKEY
	};
}
const dynamoClient = new DynamoDBClient(dynamoProps);
const s3Client = new S3Client(s3Props);

/**
 * AWS Lambda handler function to update content sections in DynamoDB and process HTML templates.
 *
 * @param {Object} event - The AWS Lambda event object.
 * @param {Object} event.body - The body of the request.
 * @param {string} event.body.clientId - The client ID.
 * @param {Object} event.body.contentSections - The content sections to update.
 *
 * @returns {Promise<Object>} Response object with status and body.
 */
exports.handler = async (event) => {
	const { body } = event;
	const {clientId, contentSections} = body;

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
	const validateRequestBody = async (clientId, sectionUpdates) => {
		const contentSections = await fetchContentSectionsFromDynamo(clientId);
		const validSections = Object.keys(contentSections);
		const hasValidSection = validSections.some(section => sectionUpdates.hasOwnProperty(section));
		return hasValidSection;
	}

	if (!clientId) return {
		statusCode: 400,
		body: JSON.stringify({ message: 'clientId is required.' })
	};
	if (!contentSections || typeof contentSections !== 'object') {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'contentSections is required and should be an object.' })
		};
	}

	if (!validateRequestBody(clientId, contentSections)) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'Invalid section updates in request body.' })
		};
	}

	/**
	 * Fetch content sections from DynamoDB for a given client ID.
	 *
	 * @param {string} clientId - The client ID.
	 *
	 * @returns {Promise<Object|null>} Content sections or null if not found.
	 */
	async function fetchContentSectionsFromDynamo(clientId) {
		const tableName = "NUC";
		const params = {
			TableName: tableName,
			Key: {
				clientId: { N: clientId }
			}
		};

		try {
			const data = await dynamoClient.send(new GetItemCommand(params));
			if (data.Item) {
				const item = data.Item;
				return item.environments.M.dev.M.sections.M;
			} else {
				console.log(`No content sections found for clientId: ${clientId}`);
				return null;
			}
		} catch (error) {
			console.error(`Error fetching content sections for clientId: ${clientId}`, error);
			throw error;
		}
	}

	/**
	 * Process the template with content sections and save it to S3.
	 *
	 * @param {string} clientId - The client ID.
	 *
	 * @returns {Promise<void>}
	 */
	async function processAndSaveTemplate(clientId) {
		const getObjectParams = {
			Bucket: "template",
			Key: "index.html"
		};

		const templateData = await s3Client.send(new GetObjectCommand(getObjectParams));
		const templateArrayBuffer = await new Response(templateData.Body).arrayBuffer();
		const template = new TextDecoder('utf-8').decode(templateArrayBuffer);

		const contentSections = await fetchContentSectionsFromDynamo(clientId);

		let processedTemplate = template;

		for (const [section, value] of Object.entries(contentSections)) {
			processedTemplate = processedTemplate.replace(`{{ heroHeading }}`, value.M.content.S);
		}

		const putObjectParams = {
			Bucket: `test-environment-bucket-${clientId}`,
			Key: "index.html",
			Body: processedTemplate,
			ContentType: "text/html"
		};

		await s3Client.send(new PutObjectCommand(putObjectParams));
	}
	try {
		const params = await updateParams(clientId, contentSections);
		console.log('params:', params);
		const updatedData = await dynamoClient.send(new UpdateItemCommand(params));
		console.log('updatedData:', updatedData);
		await (async () => {
			try {
				await processAndSaveTemplate(clientId);
				console.log("Processing completed!");
			} catch (error) {
				console.error("An error occurred:", error);
			}
		})();
		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Updated successfully.' })
		};
	} catch (error) {
		console.error("Error", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error })
		};
	}

}