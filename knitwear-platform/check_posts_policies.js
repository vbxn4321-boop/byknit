const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Querying RLS policies for posts table...');
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT * FROM pg_policies WHERE tablename = 'posts';"
    });

    if (error) {
        // If exec_sql RPC does not exist, we can use a direct SQL query or check if there's another way
        console.error('Failed via RPC:', error);
        
        // Let's try executing query another way (some databases have custom RPCs)
        console.log('Trying alternative select...');
        const { data: data2, error: error2 } = await supabase
            .from('posts')
            .select('id')
            .limit(1);
        console.log('Select success, error was:', error2);
    } else {
        console.log('Policies:', data);
    }
}

run();
