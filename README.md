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

### DynamoDB
Native dynamoDB-local

### Run S3ninja, DynamoDB local and DynamoDB-admin locally
Tools can be locate under the following path:  
`./tools/dynamodb-utils`  
to setup both S3 and DynamoDB locally, you need docker for this.  
Run them locally use the following command:  
`docker-compose up --build`

### Stack
Change `.env-example` to `.env` and fill the values correctly.  
You need to install PM2  
`npm install pm2 -g`  
then give correct rights for the following files  
`chmod +x startDev.sh stopDev.sh`  
and then you are ready to go:  
`./startDev.sh`  
to stop process use:  
`./stopDev.sh` 

### Ready, set, go!
Once everything is running, you can find the services from the following urls:  
* http://localhost:3000/?clientid=1 UI-editor
* http://localhost:9444/ui s3ninja UI
* http://localhost:8001 dynamodb-admin UI