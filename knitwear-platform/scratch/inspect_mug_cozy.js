const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: patterns, error: pError } = await supabase
        .from('patterns')
        .select('*');

    if (pError) {
        console.error('Error fetching patterns:', pError);
        return;
    }

    const filtered = patterns.filter(p => {
        const koTitle = p.title?.ko || '';
        const enTitle = p.title?.en || '';
        return koTitle.includes('머그컵') || enTitle.toLowerCase().includes('mug');
    });

    console.log(`Found ${filtered.length} Mug Cozy patterns:`);
    for (const p of filtered) {
        console.log(`- ID: ${p.id}`);
        console.log(`  Title (KO): ${p.title?.ko}`);
        console.log(`  Title (EN): ${p.title?.en}`);
        console.log(`  Designer ID: ${p.designer_id}`);
        
        // Fetch designer profile
        if (p.designer_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username, email, role')
                .eq('id', p.designer_id)
                .single();
            if (profile) {
                console.log(`  Designer Username: ${profile.username}`);
                console.log(`  Designer Email: ${profile.email}`);
                console.log(`  Designer Role: ${profile.role}`);
            } else {
                console.log(`  No profile found for this designer.`);
            }
        }
        console.log("=".repeat(50));
    }
}

test();
