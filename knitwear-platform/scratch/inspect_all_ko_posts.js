const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*');

    if (error) {
        console.error('Error fetching posts:', error);
    } else {
        const koPosts = posts.filter(p => p.locale === 'ko');
        const enPosts = posts.filter(p => p.locale === 'en');
        console.log(`Total Korean posts (ko): ${koPosts.length}`);
        console.log(`Total English posts (en): ${enPosts.length}`);
        console.log("\n--- Korean Posts List ---");
        koPosts.forEach((p, idx) => {
            console.log(`${idx + 1}. ID: ${p.id} | Title: ${p.title} | Category: ${p.category}`);
        });
        console.log("\n--- English Posts List ---");
        enPosts.forEach((p, idx) => {
            console.log(`${idx + 1}. ID: ${p.id} | Title: ${p.title} | Category: ${p.category}`);
        });
    }
}

test();
