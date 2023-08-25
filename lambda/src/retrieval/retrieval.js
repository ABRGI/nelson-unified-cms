const jsdom = require('jsdom');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
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
	const { body } = event;
	const {clientId, targetFile} = body;
	if (!clientId || !targetFile) {
		return {
			statusCode: 400,
			body: JSON.stringify({ message: 'clientId and/or targetFile is required' })
		};
	}

	/**
	 * Checks if an object exists and is accessible in a specified S3 bucket.
	 *
	 * @async
	 * @function
	 * @param {string} bucket - Name of the S3 bucket.
	 * @param {string} targetFile - The key of the target file in the bucket.
	 * @returns {Promise<boolean>} Returns true if the object exists and is accessible, false otherwise.
	 */
	const bucketObjectExistsAndAccessible = async (bucket, targetFile) => {
		const command = {
			Bucket: bucket, Key: `${targetFile}`,
		};
		try {
			await s3Client.send(new GetObjectCommand(command));
			return true;
		} catch (error) {
			return false;
		}
	};

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

	let data;
	const checkData = await bucketObjectExistsAndAccessible(`test-environment-bucket-${clientId}`, targetFile);
	if (checkData === false) {
		const checkDataForTemplate = await bucketObjectExistsAndAccessible(`template-for-client-${clientId}`, targetFile);
		if (checkDataForTemplate === false) {
			throw new Error('Failed to fetch any site related data.');
		}
		data = await getFile(`template-for-client-${clientId}`, targetFile);
	} else {
		data = await getFile(`test-environment-bucket-${clientId}`, targetFile);
	}

	try {
		// Process the fetched HTML using JSDOM
		const dom = new JSDOM(data);
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