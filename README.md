# nelson-unified-cms
Unified CMS to manage content for client website, guest comms, but, etc.

## High-level diagram
```mermaid
graph LR
    subgraph "Editor layer"
        e(Editor layer)
    end

    subgraph "AI API layer"
        a(AI api layer)
    end

    subgraph "MUI"
        m(MUI)
    end

    subgraph "S3 Bucket"
        n(website)
    end

    subgraph "DynamoDB"
        d[(DynamoDB)]
    end

    e---cc(action - AI magic)---a
    e---iframe---m
    e---bb(save - update.js)--->d & n
    n & d---aa(initializer - retrieval.js)--->e
   ```

## Local Development

### S3 bucket 
https://s3ninja.net/

### DB
#### DynamoDB
tools can be locate under the following path `./tools/dynamodb-utils`  
to setup local dynamodb, you need docker for this.  
Run DynamoDB locally use the following command:  
`docker-compose up --build`

#### DynamoDB admin
install  
`npm install -g dynamodb-admin`  

Local DynamoADMIN command:  
`DYNAMO_ENDPOINT=localDynamoDBipAddress:port dynamodb-admin`