const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function run() {
    console.log('Testing translation action...');
    try {
        const { translatePatternMetadata } = require('../src/app/actions/translate');
        console.log('Imported successfully.');
        
        const start = Date.now();
        const result = await translatePatternMetadata({
            title: 'Test Title',
            briefDescription: 'This is a brief description of a pattern.',
            detailedDescription: 'Detailed instructions go here.',
            sizes: 'One Size',
            measurements: '10cm x 10cm'
        });
        
        console.log(`Translation completed in ${Date.now() - start}ms`);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Translation failed:', e);
    }
}

run();
