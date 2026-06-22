const axios = require('axios');
require('dotenv').config({ path: '.env' });

async function run() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    
    try {
        console.log('Fetching OpenAPI schema from Supabase...');
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/openapi+json'
            }
        });
        
        const schema = response.data;
        
        console.log('Tables found:', Object.keys(schema.definitions));
        
        // Print columns of 'patterns' table
        if (schema.definitions.patterns) {
            console.log('\n--- Columns of "patterns" table ---');
            const props = schema.definitions.patterns.properties;
            for (const propName in props) {
                console.log(`- ${propName}: ${props[propName].type} (${props[propName].format || ''})`);
            }
        } else {
            console.log('\n"patterns" table definition not found.');
        }

        // Print columns of 'posts' table
        if (schema.definitions.posts) {
            console.log('\n--- Columns of "posts" table ---');
            const props = schema.definitions.posts.properties;
            for (const propName in props) {
                console.log(`- ${propName}: ${props[propName].type} (${props[propName].format || ''})`);
            }
        } else {
            console.log('\n"posts" table definition not found.');
        }
        
    } catch (error) {
        console.error('Error fetching schema:', error.message);
        if (error.response) {
            console.error('Response details:', error.response.data);
        }
    }
}

run();
