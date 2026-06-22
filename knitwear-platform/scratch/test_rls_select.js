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

    console.log(`Logging in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const user = authData.user;
    console.log(`Logged in. User ID: ${user.id}`);

    // Fetch profile
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    console.log('Profile role:', profile?.role, 'Error:', profileError?.message);

    // Let's find a post owned by someone else
    const { data: posts, error: postsError } = await adminClient
        .from('posts')
        .select('id, user_id')
        .neq('user_id', user.id)
        .limit(1);

    if (postsError || !posts || posts.length === 0) {
        console.log('No other user posts found or error:', postsError?.message);
    } else {
        const otherPostId = posts[0].id;
        console.log(`Found other post ID: ${otherPostId} owned by: ${posts[0].user_id}`);

        // Try to select it using supabase (standard client)
        const { data: postSelect, error: postSelectError } = await supabase
            .from('posts')
            .select('user_id')
            .eq('id', otherPostId)
            .single();

        console.log('Select post as admin using standard client:', postSelect, 'Error:', postSelectError?.message);
    }

    // Let's find a pattern owned by someone else
    const { data: patterns, error: patternsError } = await adminClient
        .from('patterns')
        .select('id, designer_id')
        .neq('designer_id', user.id)
        .limit(1);

    if (patternsError || !patterns || patterns.length === 0) {
        console.log('No other user patterns found or error:', patternsError?.message);
    } else {
        const otherPatternId = patterns[0].id;
        console.log(`Found other pattern ID: ${otherPatternId} owned by: ${patterns[0].designer_id}`);

        // Try to select it using supabase (standard client)
        const { data: patternSelect, error: patternSelectError } = await supabase
            .from('patterns')
            .select('designer_id')
            .eq('id', otherPatternId)
            .single();

        console.log('Select pattern as admin using standard client:', patternSelect, 'Error:', patternSelectError?.message);
    }
}

run();
