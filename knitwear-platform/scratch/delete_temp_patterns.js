const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUp() {
    console.log('Cleaning up recently published patterns...');
    
    const idsToDelete = [
        '1516611e-2eab-467c-a67d-e2b95be51ba7', // Teddy Bear AirPods Case
        '5471a03b-0ae1-4a6d-9e83-aa28dc6b9043'  // Cozy Cherry Potholder
    ];

    for (const id of idsToDelete) {
        const { error } = await supabase
            .from('patterns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Failed to delete pattern ${id}:`, error.message);
        } else {
            console.log(`Successfully deleted pattern ${id}`);
        }
    }
}

cleanUp();
