const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
