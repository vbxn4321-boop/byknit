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
    } else {
        console.log('Profiles:', profiles);
    }

    if (profiles && profiles.length > 0) {
        const testUser = profiles[0];
        console.log(`Testing credit transaction for user: ${testUser.id} (${testUser.display_name}) with current credits: ${testUser.credits}`);
        
        const { data: tx, error: txError } = await supabase.from('credit_transactions').insert({
            user_id: testUser.id,
            amount: -10,
            type: 'spending',
            description: 'Test Spending'
        });

        if (txError) {
            console.error('Credit transaction insert FAILED:', txError.message, txError.details, txError.hint);
        } else {
            console.log('Credit transaction insert SUCCESSFUL!', tx);
        }
    }
}

run();
