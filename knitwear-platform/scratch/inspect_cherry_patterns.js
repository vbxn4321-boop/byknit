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
        const cherryPatterns = data.filter(p => {
            const koTitle = p.title?.ko || '';
            const enTitle = p.title?.en || '';
            return koTitle.includes('체리') || enTitle.toLowerCase().includes('cherry');
        });
        
        console.log(`Found ${cherryPatterns.length} cherry patterns:`);
        cherryPatterns.forEach(p => {
            console.log(`- ID: ${p.id}`);
            console.log(`  Title (KO): ${p.title?.ko}`);
            console.log(`  Title (EN): ${p.title?.en}`);
            console.log(`  Designer ID: ${p.designer_id}`);
            console.log(`  Created At: ${p.created_at}`);
            console.log(`  Status: ${p.status}`);
            console.log(`  Price USD: ${p.price_usd}`);
            console.log(`  Images: ${JSON.stringify(p.images)}`);
            console.log("=".repeat(50));
        });
    }
}

test();
