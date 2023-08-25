const jsdom = require('jsdom');
const { DynamoDBClient, BatchWriteItemCommand, QueryCommand, DeleteItemCommand, UpdateItemCommand} = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { GetObjectCommand, S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");
const { JSDOM } = jsdom;

/**
 * AWS DynamoDB and S3 properties setup.
 * If running in local mode, use the provided access key, secret key, and S3 endpoint.
 * If not in local mode, just set the region.
 */
const dynamoProps = { region: process.env.ENV_REGION };
const s3Props = { region: process.env.ENV_REGION };
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
 * AWS Lambda handler function to fetch and return HTML content from an S3 bucket.
 *
 * @param {Object} event - The AWS Lambda event object.
 * @param {Object} event.body - The body of the request.
 * @param {string} event.body.clientId - The client ID.
 * @param {string} event.body.targetFile - The target file name.
 *
 * @returns {Promise<Object>} Response object with status and body.
 */
exports.handler = async (event) => {
	const { queryStringParameters } = event;
	const {clientId, targetFile} = queryStringParameters;

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
			Bucket: bucket, Key: `${targetFile}`,
		};
		let response = await s3Client.send(new GetObjectCommand(command));
		return response?.Body?.transformToString();
	};

	/**
     * Transforms the specified HTML content into a DynamoDB item.
     *
     * @param {string} html - The HTML content.
     * @param {string} clientId - The client ID.
	 */
	const extractBindingsFromHtml = (html) => {
		const document = html.window.document;

		const elementsWithBindings = [...document.querySelectorAll('[x-binding-key][x-binding-type]')];
		const bindings = {};
		elementsWithBindings.forEach(el => {
			bindings[el.getAttribute('x-binding-key')] = {
				key: el.getAttribute('x-binding-key'),
				type: el.getAttribute('x-binding-type'),
				content: el.getAttribute('x-binding-type') === "container" ? { L: marshall([...el.getElementsByTagName('img')].map(img => img.getAttribute('src'))) } : { S: el.textContent.trim() },
			};
		});
		return bindings;
	};

	/**
	 * Saves content to the specified S3 bucket.
	 *
	 * @async
	 * @function
	 * @param {string} bucketName - Name of the S3 bucket.
	 * @param {string} clientId - Client identifier.
	 * @param {string} content - Content to save.
	 * @param {string} targetFile - File to target.
	 * @throws {Error} If the save operation to S3 fails.
	 */
	const saveToS3 = async (bucketName, clientId, content, targetFile)=> {
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: `${targetFile}`,
			Body: content,
			ContentType: "text/html"
		});

		try {
			await s3Client.send(command);
			console.log(`HTML saved to ${bucketName}/${targetFile}`);
		} catch (error) {
			console.error(`Failed to save HTML to ${bucketName}/${targetFile}`, error);
			throw error;
		}
	};
	/**
	 * Fetches and returns transformed data for a given client ID.
	 *
	 * @async
	 * @function
	 * @param {string} clientId - Client identifier.
	 * @param targetFile
	 * @returns {Promise<Object>} The transformed data.
	 * @throws {Error} If the fetch operation fails.
	 */
	const getTransformedData = async (clientId, targetFile) => {
		const response = await fetch(process.env.MAPPING_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ clientId, targetFile })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch transformed data');
		}
		return await response.json();
	};

	/**
	 *
	 * @param bindings
	 * @param clientId
	 * @param keysToAdd
	 * @returns {{PutRequest: {Item: {}}}[]}
	 */
	const buildDatabaseEntries = async (bindings, clientId, keysToAdd) => {
		for (const key of keysToAdd) {
			const value = bindings[key];
			const params = {
				TableName: process.env.DYNAMODB_TABLE,
				Key: {
					clientId: { N: clientId }
				},
				UpdateExpression: `SET environments.#dev.#website.#key = :value`,
				ExpressionAttributeNames: {
					"#dev": "dev",
					"#website": "website",
					"#key": key
				},
				ExpressionAttributeValues: {
					":value": {
						M: {
							type: { S: value.type },
							content: value.content,
							show: { BOOL: true },
							key: { S: value.key }
						}
					}
				},
				ReturnValues: "ALL_NEW"
			};

			try {
				const result = await dynamoClient.send(new UpdateItemCommand(params));
				console.log(`Successfully added key ${key} to DynamoDB`, result.Attributes);
			} catch (error) {
				console.error(`Error adding key ${key} to DynamoDB`, error);
			}
		}
	};

	/**
	 *
	 * @param entries
	 * @param clientId
	 * @returns {Promise<void>}
	 */
	const storeToDatabase = async (entries, clientId) => {
		for (const [key, value] of Object.entries(entries)) {
			const params = {
				TableName: process.env.DYNAMODB_TABLE,
				Key: {
					clientId: { N: clientId }
				},
				UpdateExpression: `SET environments.#dev.#website.#key = :value`,
				ExpressionAttributeNames: {
					"#dev": "dev",
					"#website": "website",
					"#key": key
				},
				ExpressionAttributeValues: {
					":value": { M: marshall(value) }
				},
				ReturnValues: "ALL_NEW"
			};

			try {
				const result = await dynamoClient.send(new UpdateItemCommand(params));
				console.log("Successfully stored to DynamoDB", result.Attributes);
			} catch (error) {
				console.error("Error storing to DynamoDB", error);
			}
		}
	};

	/**
	 *
	 * @param html
	 * @returns {Promise<void>}
	 */
	const createTemplateForClient = async(html) => {
		const sections = await getTransformedData(clientId, targetFile);
		for (const [sectionAttributeKey, sectionKey] of Object.entries(sections.message)) {
			const elements = html.window.document.querySelectorAll(`[x-binding-key=${sectionAttributeKey}]`);
			for (const element of elements) {
				if (sectionKey.type === "container") {
					const getImages = element.querySelectorAll('.swiper-wrapper img');
					getImages.forEach((img, index) => {
						img.id = `${sectionKey.dbMap}-image-${index}`;
					});
				} else {
					element.innerHTML = `{{ ${sectionKey.dbMap} }}`;
				}
			}
		}
		await saveToS3(`template-for-client-${clientId}`, clientId, html.serialize(), targetFile);
	};

	/**
	 *
	 * @param clientId
	 * @returns {Promise<*[]>}
	 */
	const fetchKeysFromDBUsingQuery = async (clientId) => {
		const command = {
			TableName: process.env.DYNAMODB_TABLE,
			KeyConditionExpression: "clientId = :value",
			ExpressionAttributeValues: {
				":value": { N: clientId }
			}
		};

		const data = await dynamoClient.send(new QueryCommand(command));

		const keys = [];
		if (data.Items) {
			for (const item of data.Items) {
				const environments = item.environments?.M?.dev?.M?.website?.M;
				if (environments) {
					keys.push(...Object.keys(environments));
				}
			}
		}

		return keys;
	};

	/**
	 *
	 * @param keyToDelete
	 * @param clientId
	 * @returns {Promise<Record<string, AttributeValue.BMember | AttributeValue.BOOLMember | AttributeValue.BSMember | AttributeValue.LMember | AttributeValue.MMember | AttributeValue.NMember | AttributeValue.NSMember | AttributeValue.NULLMember | AttributeValue.SMember | AttributeValue.SSMember | AttributeValue.$UnknownMember>|null>}
	 */
	const deleteKeyFromDatabase = async (keyToDelete, clientId) => {
		const params = {
			TableName: process.env.DYNAMODB_TABLE,
			Key: {
				clientId: { N: clientId }
			},
			UpdateExpression: `REMOVE environments.#dev.#website.#keyToRemove`,
			ExpressionAttributeNames: {
				"#dev": "dev",
				"#website": "website",
				"#keyToRemove": keyToDelete
			},
			ReturnValues: "ALL_NEW"
		};
		try {
			const data = await dynamoClient.send(new UpdateItemCommand(params));
			return data.Attributes;
		} catch (error) {
			console.error("An error occurred while deleting the key:", error);
			return null;
		}
	};

	/**
	 *
	 * @param html
	 * @param clientId
	 * @returns {Promise<void>}
	 */
	const processHTMLAndStoreToDB = async (html, clientId) => {
		const existingKeys = await fetchKeysFromDBUsingQuery(clientId);
		const bindings = extractBindingsFromHtml(html);
		const newKeys = Object.keys(bindings);

		const keysToAdd = newKeys.filter(k => !existingKeys.includes(k));
		const keysToRemove = existingKeys.filter(k => !newKeys.includes(k));

		const dbEntries = buildDatabaseEntries(bindings,clientId, keysToAdd);
		await storeToDatabase(dbEntries, clientId);

		for (const key of keysToRemove) {
			await deleteKeyFromDatabase(key, clientId);
		}

		await createTemplateForClient(html);
	};

	try {
		const data = await getFile(`template`, targetFile);
		// Process the fetched HTML using JSDOM
		await processHTMLAndStoreToDB(await new JSDOM(data), clientId);
		const dom = await new JSDOM(await getFile(`template-for-client-${clientId}`, targetFile));
		if (process.env.LOCAL === "true") {
			return {
				statusCode: 200,
				body: 'HTML delivered.',
				HTML: await dom.serialize()
			};
		}
		return await dom.serialize();
	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: 'Internal server error.'
		};
	}
};