const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, display_name, email),
            likes:post_likes(count),
            comments:post_comments(count),
            pattern:patterns (id, title, thumbnail_url, images, price_usd, difficulty)
        `)
        .order('created_at', { ascending: false })
        .limit(1);

    console.log('Error:', error);
    console.log('Data:', JSON.stringify(data, null, 2));
}

test();
