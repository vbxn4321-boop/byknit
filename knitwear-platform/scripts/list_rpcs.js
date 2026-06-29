const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function run() {
    try {
        console.log('Fetching Supabase API definition...');
        const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        const paths = Object.keys(response.data.paths || {});
        console.log(`Found ${paths.length} paths.`);
        const rpcs = paths.filter(p => p.startsWith('/rpc/'));
        console.log('Available RPCs:');
        rpcs.forEach(rpc => console.log(` - ${rpc}`));
        if (rpcs.length === 0) {
            console.log('Sample paths:', paths.slice(0, 10));
        }
    } catch (e) {
        console.error('Error fetching API definition:', e.message);
    }
}

run();
