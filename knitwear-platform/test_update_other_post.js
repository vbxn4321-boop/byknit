const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    // The other post is 'a4aca9e9-fba8-4840-981b-edc9da2c88d8', owned by another user
    const otherPostId = 'a4aca9e9-fba8-4840-981b-edc9da2c88d8';
    
    // Fetch current title
    const { data: post, error: fetchError } = await adminClient
        .from('posts')
        .select('*')
        .eq('id', otherPostId)
        .single();
        
    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }
    
    console.log(`Attempting to update other user's post (ID: ${otherPostId}) as admin...`);
    
    const { error: updateError } = await adminClient
        .from('posts')
        .update({
            title: post.title + ' (Updated by Admin)'
        })
        .eq('id', otherPostId);
        
    if (updateError) {
        console.error('Admin update failed:', updateError);
    } else {
        console.log('Admin update successful!');
        
        // Restore original title
        const { error: restoreError } = await adminClient
            .from('posts')
            .update({
                title: post.title
            })
            .eq('id', otherPostId);
        console.log('Restore error:', restoreError);
    }
}

run();
