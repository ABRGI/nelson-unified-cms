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
    const {template, id} = req.query;
    if (!template && !id) {
        return res.status(400).send('No template and/or id provided');
    }
    const templateMatcher = (temp) => {
        return {
            website: 'index.html',
            email: 'email.html',
            sms: 'sms.html'
        }[temp];
    };
    const templateFile = templateMatcher(template);
    try {
        const dataToSend = {
            clientId: id,
            targetFile: templateFile
        };

        const response = await fetch(SITE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        const data = await response.text();

        const dom = new JSDOM(data, { url: SITE_URL });
        const { window, window: { document } } = dom;

        const links = await disableLinks(document);

        const downloadPromises = links.map(downloadAsset);
        await Promise.all(downloadPromises);

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
