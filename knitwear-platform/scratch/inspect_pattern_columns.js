const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Fetching a single row of patterns to inspect columns...');
    const { data, error } = await adminClient
        .from('patterns')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching pattern row:', error);
    } else {
        console.log('Pattern row columns/values:', data[0]);
    }
}

run();
