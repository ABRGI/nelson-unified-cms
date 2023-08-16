const {
    DynamoDBClient,
    CreateTableCommand,
    PutItemCommand,
    DeleteTableCommand,
    DescribeTableCommand
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
        secretAccessKey: process.env.SECRETKEY
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
            new DescribeTableCommand({ TableName: process.env.DYNAMODB_TABLE })
        );
        tableStatus = Table?.TableStatus;
        if (tableStatus !== 'ACTIVE') {
            console.log('Waiting for table to become active...');
            await new Promise((r) => setTimeout(r, 5000));
        }
    } while (tableStatus !== 'ACTIVE');

    console.log('Table is active and ready for use');
};

const populateTable = async () => {
    const section = (content, selector, type) => ({
        M: {
            show: { BOOL: true },
            content: { S: content },
            selector: { S: selector},
            type: { S: type }
        },
    });

    const sections = {
        M: {
            heroHeading: section('Hero content', 'div.hero-content .heading-hero', 'title'),
            heroParagraph: section('Experiences content', 'div.hero-content .paragraph-hero', 'content'),
            roomShowCase: section('', 'div.hero-content .room-showcase-container', 'container'),
            experiencesHeading: section('Experiences heading', '#experiences .content:nth-child(1) .text-section-title', 'title'),
            experiencesTitle1: section('Experiences title', '#experiences .content:nth-child(2) .cards div:nth-child(1) .text-card-title', 'title'),
            experiencesContent1: section('Experiences content', '#experiences .content:nth-child(2) .cards div:nth-child(1) .text-card-paragaraph', 'content'),
            experiencesTitle2: section('Experiences title', '#experiences .content:nth-child(2) .cards div:nth-child(2) .text-card-title', 'title'),
            experiencesContent2: section('Experiences content', '#experiences .content:nth-child(2) .cards div:nth-child(2) .text-card-paragaraph', 'content'),
            experiencesTitle3: section('Experiences title', '#experiences .content:nth-child(2) .cards div:nth-child(3) .text-card-title', 'title'),
            experiencesContent3: section('Experiences content', '#experiences .content:nth-child(2) .cards div:nth-child(3) .text-card-paragaraph', 'content'),
            experiencesTitle4: section('Experiences title', '#experiences .content:nth-child(2) .cards div:nth-child(4) .text-card-title', 'title'),
            experiencesContent4: section('Experiences content', '#experiences .content:nth-child(2) .cards div:nth-child(4) .text-card-paragaraph', 'content'),
            howitworksHeading: section('Heading', '#how-it-works .text-section-title', 'title'),
            howitworksTitle1: section('How It Works title', '#how-it-works .faq-container:nth-child(1) .text-header-blue', 'title'),
            howitworksContent1: section('How It Works content', '#how-it-works .faq-container:nth-child(1) .paragraph-md', 'content'),
            howitworksTitle2: section('How It Works title', '#how-it-works .faq-container:nth-child(2) .text-header-blue', 'title'),
            howitworksContent2: section('How It Works content', '#how-it-works .faq-container:nth-child(2) .paragraph-md', 'content'),
            howitworksTitle3: section('How It Works title', '#how-it-works .faq-container:nth-child(3) .text-header-blue', 'title'),
            howitworksContent3: section('How It Works content', '#how-it-works .faq-container:nth-child(3) .paragraph-md', 'content'),
            faqQuestion1: section('Question', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(1) .faq-container .text-faq-header', 'question'),
            faqAnswer1: section('Answer', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(1) .faq-container .rich-text--faq-answer', 'answer'),
            faqQuestion2: section('Question', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(2) .faq-container .text-faq-header', 'question'),
            faqAnswer2: section('Answer', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(2) .faq-container .rich-text--faq-answer', 'answer'),
            faqQuestion3: section('Question', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(3) .faq-container .text-faq-header', 'question'),
            faqAnswer3: section('Answer', '#faq .flex-v:nth-of-type(1) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(3) .faq-container .rich-text--faq-answer', 'answer'),
            faqQuestion4: section('Question', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(1) .faq-container .text-faq-header', 'question'),
            faqAnswer4: section('Answer', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(1) .faq-container .rich-text--faq-answer', 'answer'),
            faqQuestion5: section('Question', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(2) .faq-container .text-faq-header', 'question'),
            faqAnswer5: section('Answer', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(2) .faq-container .rich-text--faq-answer', 'answer'),
            faqQuestion6: section('Question', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(3) .faq-container .text-faq-header', 'question'),
            faqAnswer6: section('Answer', '#faq .flex-v:nth-of-type(2) #w-node-_17d3832c-7e64-c3aa-c9a3-152bf3b94af9-f3b94af9:nth-of-type(3) .faq-container .rich-text--faq-answer', 'answer'),
            longerStaysHeading: section('Longer Stays content', '#longer-stays .text-section-title', 'title'),
            locationHeading: section('Location', '#location .content:first-child .text-section-title', 'title'),
            locationContent: section('Location content', '#location .content:first-child .paragraph-md', 'content'),
            locationTitle1: section('Location title', '#location .content:nth-child(2) .grid > div:nth-child(1) .text-header-blue', 'title'),
            locationContent1: section('Location content', '#location .content:nth-child(2) .grid > div:nth-child(1) .paragraph-sm', 'content'),
            locationTitle2: section('Location title', '#location .content:nth-child(2) .grid > div:nth-child(2) .text-header-blue', 'title'),
            locationContent2: section('Location content', '#location .content:nth-child(2) .grid > div:nth-child(2) .flex-v-sm a', 'content'),
            locationTitle3: section('Location title', '#location .content:nth-child(2) .grid > div:nth-child(3) .text-header-blue', 'title'),
            locationContent3: section('Location content', '#location .content:nth-child(2) .grid > div:nth-child(3) .paragraph-sm', 'content'),
            locationTitle4: section('Location title', '#location .content:nth-child(2) .grid > div:nth-child(4) .text-header-blue', 'title'),
            locationContent4: section('Location content', '#location .content:nth-child(2) .grid > div:nth-child(4) div.flex-v-sm ul', 'content'),
        },
    };

    const environment = {
        M: {
            updated: { N: '1691052759' },
            environmentActive: { BOOL: true },
            website: sections,
            sms: { M: { smsMessage: section('Placeholder content', 'div.content', 'content') }},
            email: { M: { emailMessage: section('Placeholder content', 'div.content', 'content') }}
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
    try {
        await dropTable();
        await createTable();
    } catch (error) {
        console.error('Error dropping and creating the table:', error);
    }
    console.log('Trying to populate the table');
    await populateTable();
};

run().catch(console.error);