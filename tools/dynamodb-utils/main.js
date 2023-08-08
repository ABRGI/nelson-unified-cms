const {
    DynamoDBClient,
    CreateTableCommand,
    PutItemCommand,
    DeleteTableCommand,
    DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');
const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb');

/**
 * AWS DynamoDB properties setup.
 * If running in local mode, use the provided access key, secret key, and DynamoDB endpoint.
 * If not in local mode, just set the region.
 */
const dynamoProps = { region: process.env.ENV_REGION };
if (process.env.LOCAL) {
    dynamoProps.credentials = {
        accessKeyId: process.env.ACCESSKEY,
        secretAccessKey: process.env.SECRETKEY,
    };
    dynamoProps.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const dynamoClient = new DynamoDBClient(dynamoProps);

const dropTable = async () => {
    const deleteTableParams = {
        TableName: process.env.DYNAMODB_TABLE,
    };
    await dynamoClient.send(new DeleteTableCommand(deleteTableParams));
    console.log('Table deleted');
};

const createTable = async () => {
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        KeySchema: [{ AttributeName: 'clientId', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'clientId', AttributeType: 'N' }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    await dynamoClient.send(new CreateTableCommand(params));
    console.log('Table is being created...');

    // Wait until the table is active
    let tableStatus = null;
    do {
        const { Table } = await dynamoClient.send(
            new DescribeTableCommand({ TableName: 'NUC' })
        );
        tableStatus = Table.TableStatus;
        if (tableStatus !== 'ACTIVE') {
            console.log('Waiting for table to become active...');
            await new Promise((r) => setTimeout(r, 5000));
        }
    } while (tableStatus !== 'ACTIVE');

    console.log('Table is active and ready for use');
};

const populateTable = async () => {
    const section = (content) => ({
        M: {
            show: { BOOL: true },
            content: { S: content },
        },
    });

    const sections = {
        M: {
            hero: section('Hero content'),
            experiences: section('Experiences content'),
            gallery: section('Gallery content'),
            howitworks: section('How It Works content'),
            faq: section('FAQ content'),
            longerstays: section('Longer Stays content'),
            location: section('Location content'),
        },
    };

    const environment = {
        M: {
            updated: { N: '1691052759' },
            environmentActive: { BOOL: true },
            sections,
        },
    };

    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            clientId: { N: '1' },
            updated: { N: '1691052759' },
            environments: {
                M: {
                    prod: environment,
                    dev: environment,
                },
            },
        },
    };

    const data = await dynamoClient.send(new PutItemCommand(params));
    console.log('Success, item inserted.', data);
};

const run = async () => {
    await dropTable();
    await createTable();
    await populateTable();
};

run().catch(console.error);