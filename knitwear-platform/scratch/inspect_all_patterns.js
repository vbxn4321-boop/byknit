const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase
        .from('patterns')
        .select('*');

    if (error) {
        console.error('Error fetching patterns:', error);
    } else {
        console.log(`Found ${data.length} patterns:`);
        data.forEach(p => {
            console.log(`- ID: ${p.id}`);
            console.log(`  Title: ${JSON.stringify(p.title)}`);
            console.log(`  Price USD: ${p.price_usd} | Price KRW: ${p.price_krw} | Is Free: ${p.is_free}`);
            console.log(`  Status: ${p.status} | Item Type: ${p.item_type} | Type: ${p.type}`);
            console.log(`  Category: ${p.category} | Subcategory: ${p.subcategory}`);
            console.log(`  Images: ${JSON.stringify(p.images)}`);
            console.log("=".repeat(40));
        });
    }
}

test();
