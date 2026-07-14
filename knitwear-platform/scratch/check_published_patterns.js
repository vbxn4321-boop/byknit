const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase
        .from('patterns')
        .select('id, title, price_krw, is_free, status');

    if (error) {
        console.error('Error fetching patterns:', error);
    } else {
        console.log(`Found ${data.length} patterns:`);
        data.forEach(p => {
            console.log(`- ID: ${p.id} | Title: ${JSON.stringify(p.title)} | Price: ${p.price_krw} | Free: ${p.is_free} | Status: ${p.status}`);
        });
    }
}

test();
