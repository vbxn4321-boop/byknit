const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const ids = ['fe38f663-3c38-4ba2-9a6f-06c8216cf08f', 'd4f5dd7e-d234-4a01-9651-1b07b17876c2'];
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .in('id', ids);

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    posts.forEach(p => {
        console.log(`=== ID: ${p.id} ===`);
        console.log(`Title: ${p.title}`);
        console.log(`Category: ${p.category}`);
        console.log(`User ID: ${p.user_id}`);
        console.log(`Content:\n${p.content}`);
        console.log(`Images: ${JSON.stringify(p.images)}`);
        console.log(`Image URL: ${p.image_url}`);
        console.log(`Pattern ID: ${p.pattern_id}`);
        console.log("=".repeat(60));
    });
}

run();
