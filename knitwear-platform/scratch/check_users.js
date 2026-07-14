const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHlrY2llaHdxaXd0anJlYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczODkxNSwiZXhwIjoyMDk0MzE0OTE1fQ.8yeBxo0TQYvwSoa9WgTsjRVSgK9vb2JvIVtZHJIC1-A';

async function main() {
    console.log('Querying Supabase profiles...');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,email`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    if (!res.ok) {
        console.error('Error:', await res.text());
        return;
    }
    
    const profiles = await res.json();
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => {
        console.log(`- [${p.id}] Display Name: ${p.display_name} | Email: ${p.email}`);
    });
}

main().catch(console.error);
