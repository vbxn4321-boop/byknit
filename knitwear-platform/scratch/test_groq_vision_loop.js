const OpenAI = require('openai');
const fs = require('fs');
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

    const imagePath = 'public/images/summer_flower_coaster.png';
    const base64Image = fs.readFileSync(imagePath).toString('base64');

    const candidateModels = [
        'llama-3.2-11b-vision-instruct',
        'llama-3.2-90b-vision-instruct',
        'llama-3.2-11b-vision',
        'llama-3.2-90b-vision',
        'llama-3.2-11b-vision-preview',
        'meta-llama/llama-3.2-11b-vision-instruct',
        'meta-llama/llama-3.2-90b-vision-instruct'
    ];

    for (const model of candidateModels) {
        try {
            console.log(`Trying model: ${model}...`);
            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Identify if this is knitting or crochet' },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 50
            });
            console.log(`SUCCESS with ${model}:`);
            console.log(completion.choices[0].message.content);
            return;
        } catch (e) {
            console.error(`FAILED with ${model}:`, e.message);
        }
    }
}

test();
