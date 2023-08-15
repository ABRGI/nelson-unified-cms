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

exports.handler = async (event) => {
	const { body } = event;
	const { clientId } = body;

	const params = {
		TableName: process.env.DYNAMODB_TABLE,
		Key: {
			clientId: { N: clientId }
		}
	};

	try {
		const data = await dynamoClient.send(new GetItemCommand(params));
		if (data && data.Item && data.Item.environments && data.Item.environments.M.dev && data.Item.environments.M.dev.M.sections) {

			/**
			 * Processes the raw data from DynamoDB to generate a transformed data object.
			 *
			 * @type {Object} sections - Contains the configuration data for each section within the 'dev' environment.
			 * @type {Object} transformedData - An object to store the processed and transformed data.
			 *
			 * The for-loop iterates through each section in the `sections` object. If the `show` attribute of a section is set to `true` (or `BOOL` in DynamoDB terms), the loop retrieves the section's type and selector. If a `sectionSelector` exists, the `transformedData` object is updated with the `sectionSelector` as the key and an object containing the `type` and `dbMap` (sectionKey) as the value.
			 */
			const sections = data.Item.environments.M.dev.M.sections.M;
			const transformedData = {};

			for (const sectionKey in sections) {
				if (sections[sectionKey].M.show.BOOL) {
					const sectionType = sections[sectionKey].M.type.S;
					const sectionSelector = sections[sectionKey].M.selector.S;

					if (sectionSelector) {
						transformedData[sectionSelector] = {
							type: sectionType,
							dbMap: sectionKey
						};
					}
				}
			}
			return {
				statusCode: 200,
				body: JSON.stringify({ message: transformedData })
			};
		} else {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Something went wrong.' })
			};
		}
	} catch (error) {
		console.error("Error", error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: error })
		};
	}
}