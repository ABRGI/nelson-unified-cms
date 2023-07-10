const { Configuration } = require('openai');

const messages = [
    {
        role: 'user',
        content: `I need hotel related text for this section (it is css class name): {section}. The text that needs to be used as base is the following and you need to improve or and extend it according to your knowledge of the area or text: {text}. If the text is empty, provide generic hotel text. What comes to instructions dont write anything besides just the text. And remember to follow the best practices, and make it short.`,
    },
];

const ai_config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
    messages,
    ai_config,
};