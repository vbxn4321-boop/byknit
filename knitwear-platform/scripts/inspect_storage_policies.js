const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting storage policies...');
    
    // We can query pg_policies using RPC if we had it, but since we don't, 
    // we can try to query storage.objects or see if we can perform a test upload/list.
    // Alternatively, we can try to fetch the bucket details.
    
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('patterns');
    if (bucketError) {
        console.error('Error getting bucket:', bucketError.message);
    } else {
        console.log('Bucket Info:', bucket);
    }

    // Let's try to query the pg_policies via a direct query if the service role has access.
    // Note: service role bypasses RLS, but might not have access to pg_catalog via postgrest.
    // Let's try to run a simple select on storage.objects to see if it's accessible.
    const { data: objects, error: objectsError } = await supabase
        .from('objects')
        .select('*')
        .limit(5);
        
    if (objectsError) {
        console.log('Could not query objects directly (expected if not exposed via API):', objectsError.message);
    } else {
        console.log('Objects:', objects);
    }
}

inspect();
