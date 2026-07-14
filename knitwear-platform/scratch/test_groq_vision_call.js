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
    if (!fs.existsSync(imagePath)) {
        console.error('Image does not exist:', imagePath);
        return;
    }

    const base64Image = fs.readFileSync(imagePath).toString('base64');

    try {
        console.log('Sending vision query to Groq...');
        const completion = await client.chat.completions.create({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Analyze this knitting/crochet fabric. What craft type and stitch pattern do you see?' },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/png;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        console.log('Success! Response:');
        console.log(completion.choices[0].message.content);
    } catch (e) {
        console.error('Failed to call Groq vision model:', e.message);
    }
}

test();
