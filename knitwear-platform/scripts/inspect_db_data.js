const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectData() {
    try {
        console.log('--- PROFILES ---');
        const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, display_name, email, role');
        if (profErr) {
            console.error('Error fetching profiles:', profErr);
        } else {
            console.log(profiles);
        }

        console.log('\n--- PATTERNS ---');
        const { data: patterns, error: patErr } = await supabase.from('patterns').select('id, title, designer_id, status, price_usd');
        if (patErr) {
            console.error('Error fetching patterns:', patErr);
        } else {
            console.log(patterns);
        }

        console.log('\n--- RECENT SESSIONS/AUTH USERS (FROM AUTH.USERS IF ACCESSIBLE) ---');
        // Note: auth.users is usually protected, but let's see if we can get anything
    } catch (e) {
        console.error(e);
    }
}

inspectData();
