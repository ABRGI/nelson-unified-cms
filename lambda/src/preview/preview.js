const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall, marshall } = require("@aws-sdk/util-dynamodb");
const { CopyObjectCommand, GetObjectCommand, S3Client, ListBucketsCommand} = require("@aws-sdk/client-s3");
const { JSDOM } = require("jsdom");

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

const s3Client = new S3Client(s3Props);

const listAllBuckets = async () => {
	try {
		const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
		return Buckets.map(bucket => bucket.Name);
	} catch (error) {
		console.error("Error fetching buckets:", error);
		throw error;
	}
};

const getPageContent = async (bucketName, fileName) => {
	const params = {
		Bucket: bucketName,
		Key: fileName
	};

	try {
		const data = await s3Client.send(new GetObjectCommand(params));
		const body = await new Promise((resolve, reject) => {
			let result = '';

			data.Body.on('data', chunk => {
				result += chunk;
			});

			data.Body.on('end', () => resolve(result));
			data.Body.on('error', reject);
		});

		return body;
	} catch (error) {
		console.error("Error fetching page content:", error);
		throw error;
	}
};

exports.handler = async event => {
	const { bucket, file } = event.queryStringParameters;

	if (!bucket || !file) {
		return {
			statusCode: 400,
			body: 'Please provide both a bucket and a file.'
		};
	}

	try {
		if (file === "list") {
			const bucketNames = await listAllBuckets();
			return {
				statusCode: 300,
				body: JSON.stringify(bucketNames)
			};
		} else {
			const content = await getPageContent(bucket, file);
			const dom = new JSDOM(content);
			const renderedContent = dom.serialize();

			return {
				statusCode: 200,
				headers: {
					'Content-Type': 'text/html'
				},
				body: renderedContent,
				HTML: await dom.serialize()
			};
		}
	} catch (error) {
		return {
			statusCode: 500,
			body: 'Internal server error.'
		};
	}
};
