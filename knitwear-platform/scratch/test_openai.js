const OpenAI = require('openai');
require('dotenv').config({ path: '.env' });

function test() {
    const key = process.env.OPENAI_API_KEY || '';
    console.log('OPENAI_API_KEY exists:', !!key);
    if (key) {
        console.log('Key prefix:', key.substring(0, 7));
    }
}

test();
