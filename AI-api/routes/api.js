const express = require('express');
const router = express.Router();
const { OpenAIApi } = require('openai');
const { messages, ai_config } = require('../config/config.js');

/**
 * Route handling POST requests to the root path.
 * This route expects 'text' and 'section' in the request body.
 * It uses these to make requests to the OpenAI API and returns the response.
 * In case of missing data in the request or an internal error, appropriate HTTP status codes are sent.
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @route {POST} /
 * @async
 */
router.post('/', async (req, res) => {
    const { text, section } = req.body;
    req.setTimeout(100000);

    try {
        if (text && section) {
            let sectionRule;
            if (section === "title" || section === "question") {
                sectionRule = "Keep content length only 5 words maximum. Never go over 5 words."
            } else {
                sectionRule = "Keep content length only 25 words maximum. Never go over 25 words."
            }
            const openai = new OpenAIApi(ai_config);

            const chat_completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages.map((message) => ({
                    ...message,
                    content: message.content.replace('{section}', sectionRule).replace('{text}', text),
                })),
            });
            console.log(section, text)
            const message = chat_completion.data.choices[0].message.content;
            res.status(200).json({message});
        } else {
            // Either 'text' or 'section' is missing in the request body
            res.status(400).send('Invalid request body.');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal server error.');
    }
});

module.exports = router;