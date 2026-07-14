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

    console.log('Deleting admin-created Cozy Mug Cozy pattern (ad89a2f9-0fc4-4012-b13e-ce07900191dd)...');
    const { error } = await supabase
        .from('patterns')
        .delete()
        .eq('id', 'ad89a2f9-0fc4-4012-b13e-ce07900191dd');

    if (error) {
        console.error('Pattern delete failed:', error);
    } else {
        console.log('Pattern deleted successfully.');
    }
}

run();
