const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching posts:', error);
    } else {
        console.log(`Found ${posts.length} posts:`);
        posts.forEach(p => {
            console.log(`- ID: ${p.id} | Title: ${p.title} | Locale: ${p.locale} | Category: ${p.category}`);
            console.log(`  Content: ${p.content ? p.content.substring(0, 150) : ''}...`);
            console.log("=".repeat(40));
        });
    }
}

test();
