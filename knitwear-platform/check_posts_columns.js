const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Querying posts table structure...');
    // We can select a single row and print its keys
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error('Failed to select from posts:', error);
    } else if (data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('No rows in posts table. Trying to select columns via RPC or metadata.');
        // Let's try inserting a dummy row and check its columns
        const { data: dummy, error: dummyErr } = await supabase.from('posts').insert({
            user_id: '1c5cab92-64d4-4b8f-99cb-c20539ee740f',
            title: 'Temp',
            content: 'Temp',
            locale: 'ko',
            category: 'general'
        }).select();
        if (dummyErr) {
            console.error('Dummy insert failed:', dummyErr);
        } else {
            console.log('Columns from new insert:', Object.keys(dummy[0]));
            // delete
            await supabase.from('posts').delete().eq('id', dummy[0].id);
        }
    }
}

run();
