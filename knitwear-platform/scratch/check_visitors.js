const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchCount(table) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'count=exact'
        }
    });
    if (!res.ok) {
        return { success: false, error: await res.text() };
    }
    // Supabase returns count in the Content-Range header when Prefer: count=exact is used,
    // or we can read it from Content-Range.
    const range = res.headers.get('content-range');
    if (range) {
        const count = range.split('/').pop();
        return { success: true, count: parseInt(count) };
    }
    return { success: false, error: 'No content-range header' };
}

async function main() {
    console.log('--- Checking Website Visitor & User Statistics ---');
    
    const tables = ['profiles', 'posts', 'patterns', 'pattern_views', 'orders', 'reviews'];
    for (const table of tables) {
        const result = await fetchCount(table);
        if (result.success) {
            console.log(`- ${table.toUpperCase()} Count: ${result.count}`);
        } else {
            console.log(`- ${table.toUpperCase()}: Failed to fetch (${result.error})`);
        }
    }
}

main().catch(console.error);
