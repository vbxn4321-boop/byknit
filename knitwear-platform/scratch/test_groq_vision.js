const OpenAI = require('openai');
require('dotenv').config({ path: '.env' });

const groqApiKeys = (process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);

async function test() {
    if (groqApiKeys.length === 0) {
        console.error('No Groq API keys found');
        return;
    }

    const key = groqApiKeys[0];
    const client = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.groq.com/openai/v1',
    });

    try {
        console.log('Fetching Groq models list...');
        const response = await client.models.list();
        const models = response.data.map(m => m.id);
        console.log('Available models:', models);
    } catch (e) {
        console.error('Error listing models:', e);
    }
}

test();
