const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching posts:', error);
    } else if (posts.length > 0) {
        console.log('Columns in posts table:', Object.keys(posts[0]));
        console.log('Sample post:', posts[0]);
    } else {
        console.log('No posts found.');
    }
}

test();
