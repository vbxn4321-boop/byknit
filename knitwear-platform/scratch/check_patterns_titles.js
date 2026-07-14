const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHlrY2llaHdxaXd0anJlYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczODkxNSwiZXhwIjoyMDk0MzE0OTE1fQ.8yeBxo0TQYvwSoa9WgTsjRVSgK9vb2JvIVtZHJIC1-A';

async function main() {
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
        const titleKo = p.title?.ko || p.title?.en || JSON.stringify(p.title);
        console.log(`- [${p.id}] ${titleKo} | Views: ${p.view_count} | Downloads: ${p.download_count}`);
    });
}

main().catch(console.error);
