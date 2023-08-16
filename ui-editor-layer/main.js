const express = require('express');
const siteLoader = require('./routes/loader');
const startServer = require('./utils/startServer');
const { PUBLISH_ENDPOINT, UPDATE_ENDPOINT } = require('./config/config');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.use('/loader', siteLoader);

app.get('/', async (req, res) => {
    const {clientid} = req.query;
    if (!clientid) {
        return res.status(400).send('Missing clientid.');
    }
    const htmlResponse = `
        <h1 id="editor-nav">index</h1>
        <select id="editor-menu">
            <option value="website" data-default="true">Website</option>
            <option value="sms">SMS</option>
            <option value="email">EMAIL</option>
        </select><br>
        <iframe id="editor-ui-iframe" src="loader?template=website&id=${clientid}" width="1280" height="800"></iframe>
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
            window.addEventListener('beforeunload', function(e) {
              e.preventDefault();
              e.returnValue = '';
            });
            
            function isDefaultValueSelected() {
                const dropdown = document.getElementById('editor-menu');
                const selectedOption = dropdown.options[dropdown.selectedIndex];
                return selectedOption.hasAttribute('data-default');
            }
			
            const dropdown = document.getElementById('editor-menu');
            
            let currentSelectedValue = dropdown.value;
            
            document.getElementById('editor-menu').addEventListener('change', function(event) {
                const iframe = document.getElementById('editor-ui-iframe');
                const editorNav = document.getElementById('editor-nav');
                const selectedValue = this.value;
                const userConfirmed = confirm('Are you sure you want to change the selection, without saving first?');
            
                if (userConfirmed) {
                    // Update the current selected value
                    currentSelectedValue = this.value;
                    if (isDefaultValueSelected()) {
                        console.log('Default value is selected:', selectedValue);
                        iframe.src = "loader?template=website&id=${clientid}";
                        editorNav.innerHTML = "index";
                    } 
                    if (selectedValue === 'sms') {
                        iframe.src = "loader?template=sms&id=${clientid}";
                        console.log('A different value is selected:', selectedValue);
                        editorNav.innerHTML = selectedValue;
                    }
                    if (selectedValue === 'email') {
                        iframe.src = "loader?template=email&id=${clientid}";
                        console.log('A different value is selected:', selectedValue);
                        editorNav.innerHTML = selectedValue;
                    }
                } else {
                    // Revert back to the previous selection
                    this.value = currentSelectedValue;
                    return event.preventDefault();
                }
            });
    
            document.getElementById('save-button').addEventListener('click', async function() {
                const iframeContent = document.getElementById('editor-ui-iframe').contentWindow.document.body.innerHTML;
                const editorNav = document.getElementById('editor-nav');
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
                    clientId: ${clientid},
                    contentSections: embedContent(JSON.parse(localStorage.storeObject)),
                    targetFile: editorNav.innerText + ".html"
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
                const editorNav = document.getElementById('editor-nav');
                const dataToSend = {
                    clientId: ${clientid},
                    targetFile: editorNav.innerText + ".html"
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