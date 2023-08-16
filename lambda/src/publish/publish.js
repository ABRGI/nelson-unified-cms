const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { CopyObjectCommand, GetObjectCommand, S3Client } = require("@aws-sdk/client-s3");

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
 * Generates the parameters required for DynamoDB operations.
 *
 * @param {string} clientId - The client ID.
 *
 * @returns {Object} The DynamoDB parameters.
 */
const getParams = (clientId) => {
	return{
		TableName: process.env.DYNAMODB_TABLE,
		Key: {
			clientId: { N: clientId }
		}
	};
};

/**
 * AWS Lambda handler function to copy values and files in AWS DynamoDB and S3 respectively.
 *
 * @param {Object} event - The AWS Lambda event object.
 * @param {Object} event.body - The body of the request.
 * @param {string} event.body.clientId - The client ID.
 *
 * @returns {Promise<Object>} Response object with status and body.
 */
exports.handler = async (event) => {
	const { body } = event;
	const { clientId, targetFile } = body;

	/**
	 * Generates the parameters required for updating a DynamoDB item.
	 *
	 * @param {string} clientId - The client ID.
	 * @param {Object} devValues - The values to be updated in the database.
	 *
	 * @returns {Object} The DynamoDB update parameters.
	 */
	const updateParams = (clientId, devValues) => {
		return {
			TableName: process.env.DYNAMODB_TABLE,
			Key: {
				clientId: { N: clientId }
			},
			UpdateExpression: "SET environments.prod = :devValues",
			ExpressionAttributeValues: {
				":devValues": { M: marshall(devValues) }
			}
		};
	};

	/**
	 * Generates the parameters required for copying an S3 object.
	 *
	 * @param {string} clientId - The client ID.
	 *
	 * @returns {Object} The S3 copy parameters.
	 */
	const copyParams = (clientId) => {
		return {
			CopySource: `test-environment-bucket-${clientId}/index.html`,
			Bucket: `production-environment-bucket-${clientId}`,
			Key: `${targetFile}`
		};
	};

	if (!clientId) {
		return {
			statusCode: 400, body: JSON.stringify({message: 'clientId is required'})
		};
	}
	const data = await dynamoClient.send(new GetItemCommand(getParams(clientId)));
	if (!data.Item) {
		throw new Error("Item doesn't exist, can't copy values");
	}
	try {
		const devValues = unmarshall(data.Item).environments.dev;
		const params = updateParams(clientId, devValues);
		await dynamoClient.send(new UpdateItemCommand(params));
		await s3Client.send(new CopyObjectCommand(copyParams(clientId)));
		return {
			statusCode: 200,
			body: JSON.stringify({ message: 'Copied successfully' })
		};
    } catch (error) {
		console.error("Error", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error })
		};
    }

}