const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { SITE_URL } = require('../config/config');

/**
 * Downloads the asset file from a provided link if it doesn't exist locally.
 * Then, it sets the attribute of the link to the file name.
 *
 * @param {HTMLElement} link - An HTML element representing the link.
 * @returns {Promise<void>|undefined} A promise that resolves when the file has been downloaded and the link attribute set, or undefined if the URL is not relative. Rejects if an error occurs.
 * @throws {Error} Will throw an error if the asset download or file write fails.
 */
const downloadAsset = async (link) => {
    // If the element is an <a> element, ignore it
    if (link.tagName === 'A') return;

    let attribute = link.hasAttribute('src') ? 'src' : 'href';
    const url = link.getAttribute(attribute);

    // If the URL is not relative, skip it
    if (/^http/i.test(url)) return;

    // Create an absolute URL
    const absoluteUrl = new URL(url, SITE_URL).href;

    const fileName = url.split('/').pop();
    const localPath = path.join(__dirname, '../public/dl', fileName);

    // If file doesn't exist locally, fetch it
    try {
        // Check if the directory already exists
        if (!fs.existsSync(localPath)) {
            fs.mkdirSync(path.join(__dirname, '../public/dl'), { recursive: true });
            const assetResponse = await fetch(absoluteUrl);
            const assetData = await assetResponse.arrayBuffer();
            await fsp.writeFile(localPath, Buffer.from(assetData));
        }

        link.setAttribute(attribute, `/dl/${fileName}`);
    } catch (error) {
        console.error(`Failed to download asset at ${absoluteUrl}: ${error}`);
        throw error;
    }
};

module.exports = downloadAsset;