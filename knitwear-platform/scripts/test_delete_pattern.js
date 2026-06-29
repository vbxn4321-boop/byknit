const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

// We need a test user. Let's fetch one from profiles.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPatternDelete() {
    try {
        console.log('Fetching a user for test...');
        const { data: user, error: userErr } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
        if (userErr || !user) {
            console.error('User fetch failed:', userErr);
            return;
        }
        console.log('User ID:', user.id);

        // Create a pattern for this user
        console.log('Inserting a test pattern...');
        const { data: pattern, error: patternErr } = await supabaseAdmin.from('patterns').insert({
            title: { ko: 'Test Pattern Deletion RLS', en: 'Test Pattern Deletion RLS' },
            description: { ko: 'Desc', en: 'Desc' },
            price_usd: 0,
            price_krw: 0,
            images: [],
            category: 'Sweater',
            difficulty: 'Easy',
            designer_id: user.id,
            status: 'published',
            type: 'internal_pdf',
            content: { type: 'pdf', pdf_url: '' }
        }).select().single();

        if (patternErr || !pattern) {
            console.error('Failed to create pattern:', patternErr);
            return;
        }
        console.log('Created Pattern ID:', pattern.id);

        // Now create a client authenticated as this user to simulate standard supabase client
        // Wait, since we don't have user passwords, we can't easily sign in.
        // But we can check supabase RLS policies or we can check the error returned in the actual application.
        // Wait, is there a simpler way?
        // Yes, we can look at the RLS policy of patterns. Or we can just use supabaseAdmin since admin client bypasses RLS.
        // Wait! In deletePattern, the code says:
        // const clientToUse = isAdmin ? adminClient : supabase;
        // If the user is the owner, but NOT admin, clientToUse is supabase (user-authenticated client).
        // Does the RLS policy on the patterns table allow the designer to update the pattern's status to 'archived'?
        // Usually, the RLS policy for UPDATE on patterns is: designer_id = auth.uid().
        // If so, the designer is allowed to update any column of their own pattern, including the status column!
        // Let's run a check on the actual policies by querying supabase pg_policies if possible.
        
        console.log('Querying RLS policies for patterns table...');
        const { data: policies, error: polErr } = await supabaseAdmin.rpc('get_policies_for_table', { table_name: 'patterns' });
        if (polErr) {
            // If RPC doesn't exist, we can run a direct SQL query or check pg_policies
            const { data: directPol, error: directErr } = await supabaseAdmin.rpc('exec_sql', { 
                query_text: "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'patterns'" 
            });
            if (directErr) {
                console.log('Could not query policies directly:', directErr);
            } else {
                console.log('Policies:', directPol);
            }
        } else {
            console.log('Policies:', policies);
        }

        // Clean up test pattern
        console.log('Cleaning up pattern...');
        await supabaseAdmin.from('patterns').delete().eq('id', pattern.id);
        console.log('Cleanup complete.');
    } catch (e) {
        console.error('Error:', e);
    }
}

testPatternDelete();
