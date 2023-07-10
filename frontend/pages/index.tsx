import type { NextPage } from 'next'
import Head from 'next/head'
import type { HomeProps } from '../types'
import {
  DynamoDBClient,
  ScanCommand
} from '@aws-sdk/client-dynamodb';

/**
 * DynamoDB client configuration.
 * @type {import('@aws-sdk/client-dynamodb').DynamoDBClientConfig}
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'LocalTestingDummyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'LocalTestingDummyKey'
  }
});

/**
 * Fetches static props for the Home component.
 * @returns {Promise<{props: HomeProps}>} The static props.
 */
export async function getStaticProps() {
  const command = new ScanCommand({ TableName: "lol" });
  const { Items } = await client.send(command);
  return {
    props: {
      posts: Items,
    },
  }
}

/**
 * Home component.
 * @type {NextPage<HomeProps>}
 */
const Home: NextPage<HomeProps> = ({ content }) => {
  return (
    <div>
      {JSON.stringify(content, null, 2)}
    </div>
  );
}

export default Home
