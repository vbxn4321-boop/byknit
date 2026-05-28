const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching profiles...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error('Error fetching profiles:', pError);
        return;
    }

    if (profiles && profiles.length > 0) {
        const testUser = profiles[0];
        console.log(`Testing direct profile credits update for user: ${testUser.id} (${testUser.display_name}) with current credits: ${testUser.credits}`);
        
        // Try to update credits directly on profiles
        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: testUser.credits - 10 })
            .eq('id', testUser.id)
            .select();

        if (error) {
            console.error('Direct profile update FAILED:', error.message, error.details, error.hint);
        } else {
            console.log('Direct profile update SUCCESSFUL! New credits:', data[0].credits);
            
            // Revert it back
            await supabase
                .from('profiles')
                .update({ credits: testUser.credits })
                .eq('id', testUser.id);
            console.log('Credits reverted back.');
        }
    }
}

run();
