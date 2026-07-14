const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const email = 'admin@by-knit.com';
    const password = 'godqhrgkwk12!';

    console.log(`Logging in to get admin session...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    console.log('Deleting temporary community post c27c01bf-01e4-4792-9b88-b45625128ef3...');
    const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', 'c27c01bf-01e4-4792-9b88-b45625128ef3');

    if (postError) {
        console.error('Post delete failed:', postError);
    } else {
        console.log('Post deleted successfully.');
    }

    console.log('Deleting temporary pattern 0f2a962b-0c59-4c38-bbda-c2fabdd154af...');
    const { error: patternError } = await supabase
        .from('patterns')
        .delete()
        .eq('id', '0f2a962b-0c59-4c38-bbda-c2fabdd154af');

    if (patternError) {
        console.error('Pattern delete failed:', patternError);
    } else {
        console.log('Pattern deleted successfully.');
    }
}

run();
