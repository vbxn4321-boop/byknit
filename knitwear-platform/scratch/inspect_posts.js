const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Fetching posts...');
    const { data: posts, error } = await adminClient
        .from('posts')
        .select('*');

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} posts:`);
    posts.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`User ID: ${p.user_id}`);
        console.log(`Category: ${p.category}`);
        console.log(`Created At: ${p.created_at}`);
        console.log('------------------------');
    });
}

run();
