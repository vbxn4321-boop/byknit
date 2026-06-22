const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
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
    console.log(`Auth successful. User ID: ${user.id}`);

    // Create a dummy post first to test update on
    const { data: postData, error: insertError } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            title: 'Temp Title',
            content: 'Temp Content',
            locale: 'ko',
            category: 'general'
        })
        .select();

    if (insertError) {
        console.error('Insert failed:', insertError);
        return;
    }

    const postId = postData[0].id;
    console.log(`Post created. ID: ${postId}. Testing update via standard client...`);

    // 1. Try update via standard client (owner update)
    const { error: updateError } = await supabase
        .from('posts')
        .update({ title: 'Updated Title' })
        .eq('id', postId);

    console.log('Standard client update error:', updateError);

    // 2. Try update via admin client (admin update)
    const { error: adminUpdateError } = await adminClient
        .from('posts')
        .update({ title: 'Admin Updated Title' })
        .eq('id', postId);

    console.log('Admin client update error:', adminUpdateError);

    // Clean up
    await adminClient.from('posts').delete().eq('id', postId);
}

run();
