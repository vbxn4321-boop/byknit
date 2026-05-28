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
        console.log(`Testing deduct_credits RPC for user: ${testUser.id} (${testUser.display_name}) with current credits: ${testUser.credits}`);
        
        // Let's call deduct_credits RPC
        const { data, error } = await supabase.rpc('deduct_credits', {
            p_user_id: testUser.id,
            p_amount: 10,
            p_description: 'Test RPC Deduction'
        });

        if (error) {
            console.error('RPC deduct_credits FAILED:', error.message, error.details, error.hint);
        } else {
            console.log('RPC deduct_credits SUCCESSFUL!', data);
            
            // Let's verify the updated credits
            const { data: updatedUser } = await supabase.from('profiles').select('credits').eq('id', testUser.id).single();
            console.log(`Updated credits for user: ${updatedUser.credits}`);
        }
    }
}

run();
