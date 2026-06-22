const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const email = 'admin@by-knit.com';
    const password = 'godqhrgkwk12!';

    console.log(`Logging in...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const user = authData.user;
    const postId = 'fc3454fe-6a19-4ea1-abdd-7eaffb973462';

    // Fetch the post
    const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }

    console.log('Post owner ID:', post.user_id, 'Logged in User ID:', user.id);

    // Try updating via standard client
    const { error: updateError } = await supabase
        .from('posts')
        .update({
            title: post.title,
            content: post.content,
            category: post.category
        })
        .eq('id', postId);

    console.log('Update Error via standard client:', updateError);
}

run();
