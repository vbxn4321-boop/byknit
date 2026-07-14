const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const ids = [
        'a4aca9e9-fba8-4840-981b-edc9da2c88d8',
        '338d7e00-b886-4c5a-8fa0-dcd1a85bee6a',
        'fc3454fe-6a19-4ea1-abdd-7eaffb973462'
    ];
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
        console.log(`Content:\n${p.content}`);
        console.log("=".repeat(60));
    });
}

run();
