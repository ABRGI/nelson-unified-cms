const { Configuration } = require('openai');

const messages = [
    {
        'role': 'system',
        'content': `
            Reply only and follow the provided instructions, dont expose that you are an AI model. 
            {section}.
            If the text is empty, provide generic hotel text as reply.
            Follow the best practices while keeping SEO in mind.
            Add an human touch to the text.
        `,
    },
    {
        'role': 'user',
        'content': `Hotel related text and the text that needs to be used as base is the following and you need to improve or and extend it according to your knowledge of the area or text: {text}.`,
    },
    {
        'role': 'system',
        'content': `
            Reply only and follow the provided instructions, dont expose that you are an AI model. 
            {section}.
            If the text is empty, provide generic hotel text as reply.
            Follow the best practices while keeping SEO in mind.
            Add an human touch to the text.
        `,
    },
];

const ai_config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
    messages,
    ai_config,
};