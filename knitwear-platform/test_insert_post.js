const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const email = 'admin@by-knit.com';
    const password = 'godqhrgkwk12!';

    console.log(`Logging in to get user session...`);
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

    // Try inserting a post
    const insertData = {
        user_id: user.id,
        title: 'Test Title ' + Date.now(),
        content: 'Test Content',
        locale: 'ko',
        category: 'general'
    };

    console.log(`Attempting insert:`, insertData);

    const { data: postData, error: insertError } = await supabase
        .from('posts')
        .insert(insertData)
        .select();

    if (insertError) {
        console.error('Insert failed with error:', insertError);
    } else {
        console.log('Insert successful! Post data:', postData);
        // clean up
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postData[0].id);
        console.log('Cleanup delete error:', deleteError);
    }
}

run();
