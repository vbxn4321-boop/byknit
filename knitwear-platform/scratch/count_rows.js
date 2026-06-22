const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const tables = ['profiles', 'patterns', 'posts', 'grid_projects', 'orders', 'reviews'];
    
    for (const table of tables) {
        const { count, error } = await adminClient
            .from(table)
            .select('*', { count: 'exact', head: true });
            
        if (error) {
            console.error(`Error counting ${table}:`, error.message);
        } else {
            console.log(`Table ${table} has ${count} rows.`);
        }
    }
}

run();
