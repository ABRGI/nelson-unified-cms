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
  
**Remember** <ins>_to move **index.html**, **sms.html** and **email.html** from **template folder** to **"template" s3 bucket** which you have to create._</ins>  
You can access s3ninja UI by going to http://localhost:9444/ui.

### Stack
Change `.env-example` to `.env` and fill the values correctly.  
You need to install dependencies.  
`npm i`  
and then you are ready to go:  
to start everything: `pm2 start pm2.config.js`  
to see logs: `pm2 logs --lines 20`  
to stop all the processes: `pm2 delete pm2.config.js`  

### Ready, set, go!
Once everything is running, you can find the services from the following urls:  
* http://localhost:3002/establish/?clientId=1&targetFile=index.html generate template file and bindings to db.
* http://localhost:3000/?clientid=1 UI-editor
* http://localhost:9444/ui s3ninja UI
* http://localhost:8001 dynamodb-admin UI