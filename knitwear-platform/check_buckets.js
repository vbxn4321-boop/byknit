const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Listing storage buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Failed to list buckets:', error);
    } else {
        console.log('Buckets:', data);
    }
}

run();
