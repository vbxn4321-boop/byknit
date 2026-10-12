const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
    console.log('Querying Supabase patterns...');
    
    // Fetch patterns (excluding 'price')
    let res = await fetch(`${SUPABASE_URL}/rest/v1/patterns?select=id,title,download_count,view_count,designer_id`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    if (!res.ok) {
        console.error('Error fetching patterns:', await res.text());
        return;
    }
    
    const patterns = await res.json();
    console.log(`Found ${patterns.length} patterns:`);
    patterns.forEach(p => {
        console.log(`- [${p.id}] ${p.title} | Views: ${p.view_count} | Downloads: ${p.download_count}`);
    });

    console.log('\nQuerying Supabase orders/downloads...');
    res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    if (res.ok) {
        const orders = await res.json();
        console.log(`Found ${orders.length} orders in database.`);
        orders.slice(0, 10).forEach(o => {
            console.log(`- Order ID: ${o.id} | User: ${o.user_id} | Pattern: ${o.pattern_id} | Status: ${o.status}`);
        });
    } else {
        console.log('No orders table or error:', await res.text());
    }
}

main().catch(console.error);
