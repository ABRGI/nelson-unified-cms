/**
 * @fileOverview Express router for handling a GET request.
 * @module Router
 */

const express = require('express');
const router = express.Router();
const jsdom = require('jsdom');
const { SITE_URL } = require('../config/config');
const downloadAsset = require('../utils/downloadAssets');
const { disableLinks } = require('../utils/disableLinks');
const { updateBindings } = require('../utils/updateBindings');
const { JSDOM } = jsdom;

/**
 * Handles a GET request and performs various operations on the response data.
 *
 * @name GET /
 * @function
 * @async
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operations are completed.
 */
router.get('/', async (req, res) => {
    try {
        const dataToSend = {
            clientId: 1,
            targetFile: "index.html"
        };

        const response = await fetch(SITE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        const selectorsWithType = await fetch(process.env.MAPPING_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({clientId: 1})
        })
        const selectorsWithTypeData = await selectorsWithType.json();
        const data = await response.text();
        console.log(data)
        const dom = new JSDOM(data, { url: SITE_URL });
        const { window, window: { document } } = dom;

        const links = await disableLinks(document);
        await updateBindings(document, selectorsWithTypeData);
        const downloadPromises = links.map(downloadAsset);
        await Promise.all(downloadPromises);

        const micromodal = document.createElement('script')
        micromodal.src = "https://unpkg.com/micromodal/dist/micromodal.min.js";
        micromodal.type = "module";
        document.body.appendChild(micromodal);

        const script = document.createElement('script');
        script.src = "/bundle.js";
        document.body.appendChild(script);

        const style = document.createElement('link');
        style.href = "/style.css";
        style.rel = "stylesheet";
        style.type = "text/css";
        document.head.appendChild(style);

        res.send(dom.serialize());
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred' + error);
    }
});

module.exports = router;
