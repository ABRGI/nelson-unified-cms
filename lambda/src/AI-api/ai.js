const { OpenAIApi, Configuration } = require('openai');

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

exports.handler = async (event) => {
	const {body} = event;
	const {text, section} = body;
	if (!text || !section) {
		return {
			statusCode: 400, body: JSON.stringify({message: 'clientId and/or targetFile is required'})
		};
	}

	try {
			let sectionRule;
			if (section === "title" || section === "question") {
				sectionRule = "Keep content length only 5 words maximum. Never go over 5 words.";
			} else {
				sectionRule = "Keep content length only 25 words maximum. Never go over 25 words.";
			}
			const openai = new OpenAIApi(ai_config);

			const chat_completion = await openai.createChatCompletion({
				model: "gpt-3.5-turbo", messages: messages.map((message) => ({
					...message, content: message.content.replace('{section}', sectionRule).replace('{text}', text),
				})),
			});

			const message = chat_completion.data.choices[0].message.content;
			return {
				statusCode: 200,
				body: JSON.stringify({ message })
			};

	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: 'Internal server error.'
		};
	}
};