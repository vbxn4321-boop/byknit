const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Fetching all patterns...');
    const { data: patterns, error } = await adminClient
        .from('patterns')
        .select('id, title, designer_id, status, price_usd');

    if (error) {
        console.error('Error fetching patterns:', error);
        return;
    }

    console.log(`Found ${patterns.length} patterns:`);
    patterns.forEach(p => {
        console.log(`ID: ${p.id} | Title: ${JSON.stringify(p.title)} | Designer ID: ${p.designer_id} | Status: ${p.status} | Price: ${p.price_usd}`);
    });
}

run();
