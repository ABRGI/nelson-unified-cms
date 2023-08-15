const express = require('express');
const siteLoader = require('./routes/loader');
const startServer = require('./utils/startServer');
const { PUBLISH_ENDPOINT, UPDATE_ENDPOINT } = require('./config/config');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use('/loader', siteLoader);

app.get('/', (req, res) => {
   const htmlResponse = `
    <iframe id="editor-ui-iframe" src="loader" width="1280" height="800"></iframe>
    <br>
    <button
        id="save-button"
        style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Save
    </button>
    <button
        id="publish-button"
        style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Publish
    </button>
    <script>
        document.getElementById('save-button').addEventListener('click', async function() {
            const iframeContent = document.getElementById('editor-ui-iframe').contentWindow.document.body.innerHTML;
            const embedContent = obj => {
                const result = {};
                for (let key in obj) {
                    result[key] = {
                        content: obj[key]
                    };
                }
                return result;
			}
            const dataToSend = {
                clientId: 1,
                contentSections: embedContent(JSON.parse(localStorage.storeObject))
            };
			
            try {
                const response = await fetch('${UPDATE_ENDPOINT}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });
    
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
    
                const jsonResponse = await response.json();
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error.message);
            }
        });
        document.getElementById('publish-button').addEventListener('click', async function() {
            const dataToSend = {
                clientId: 1
            };
            try {
                const response = await fetch('${PUBLISH_ENDPOINT}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dataToSend)
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const jsonResponse = await response.json();
            } catch (error) {
                console.error('There was a problem with the fetch operation:', error.message);
            }
        });
    </script>
        `;
    res.send(htmlResponse);
});

startServer(app, port);