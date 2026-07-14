const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const ids = [
        'a4aca9e9-fba8-4840-981b-edc9da2c88d8',
        '338d7e00-b886-4c5a-8fa0-dcd1a85bee6a',
        'fc3454fe-6a19-4ea1-abdd-7eaffb973462',
        '2feb1834-d59e-48da-a66c-1f56126d2352',
        '9828997b-c0e3-4d3e-9c71-9942b3242aa8',
        'eccf5a20-5d97-4939-90a1-a98c5325fd1f',
        'd29469c7-6783-49dd-bf5f-6eb0cc39a083'
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
        console.log(`User ID: ${p.user_id}`);
        console.log(`ContentLength: ${p.content ? p.content.length : 0}`);
        console.log(`Content:\n${p.content}`);
        console.log("=".repeat(60));
    });
}

run();
