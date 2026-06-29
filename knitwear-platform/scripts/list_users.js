const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Listing profiles...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, credits, created_at')
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log(`Found ${data.length} profiles:`);
        data.forEach(p => {
            console.log(` - ID: ${p.id} | Email: ${p.email} | Name: ${p.display_name} | Role: ${p.role} | Credits: ${p.credits} | Created: ${p.created_at}`);
        });
    }
}

run();
