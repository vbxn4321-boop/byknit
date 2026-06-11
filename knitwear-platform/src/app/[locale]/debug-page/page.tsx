import { createAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebugPage() {
    const results: any = {
        timestamp: new Date().toISOString(),
        env: {
            NEXT_PUBLIC_SUPABASE_URL_exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_URL_value: process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            SUPABASE_SERVICE_ROLE_KEY_length: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0,
            SUPABASE_SERVICE_ROLE_KEY_preview: process.env.SUPABASE_SERVICE_ROLE_KEY 
                ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 8)}...${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 8)}`
                : null,
        }
    };

    try {
        // Test admin client connection
        const adminClient = await createAdminClient();
        const { data: profileCount, error: countError } = await adminClient
            .from('profiles')
            .select('id', { count: 'exact', head: true });

        results.adminClientConnection = {
            success: !countError,
            profilesCount: profileCount || 0,
            error: countError ? countError.message : null
        };

        // Check admin user details
        const { data: adminProfile, error: profileError } = await adminClient
            .from('profiles')
            .select('*')
            .eq('email', 'admin@by-knit.com')
            .maybeSingle();

        results.adminUserProfile = {
            success: !profileError,
            found: !!adminProfile,
            profile: adminProfile,
            error: profileError ? profileError.message : null
        };

        // Check columns of patterns table
        const { data: patternsData, error: patternsError } = await adminClient
            .from('patterns')
            .select('*')
            .limit(1);

        results.patternsTableTest = {
            success: !patternsError,
            error: patternsError ? {
                code: patternsError.code,
                message: patternsError.message,
                details: patternsError.details
            } : null
        };

        // Try updating a post as admin (welcome notice post)
        const otherPostId = 'a4aca9e9-fba8-4840-981b-edc9da2c88d8';
        const { data: postBefore, error: postFetchError } = await adminClient
            .from('posts')
            .select('*')
            .eq('id', otherPostId)
            .single();

        if (postFetchError) {
            results.adminPostUpdateTest = {
                success: false,
                error: `Failed to fetch post: ${postFetchError.message}`
            };
        } else {
            const originalTitle = postBefore.title;
            const testTitle = originalTitle + ' [Prod Debug]';
            
            const { error: updateError } = await adminClient
                .from('posts')
                .update({ title: testTitle })
                .eq('id', otherPostId);

            if (updateError) {
                results.adminPostUpdateTest = {
                    success: false,
                    error: `Update failed: ${updateError.message}`
                };
            } else {
                // Restore it
                await adminClient
                    .from('posts')
                    .update({ title: originalTitle })
                    .eq('id', otherPostId);

                results.adminPostUpdateTest = {
                    success: true,
                    message: 'Admin was able to update and restore other user\'s post successfully!'
                };
            }
        }

    } catch (e: any) {
        results.exception = {
            message: e.message,
            stack: e.stack
        };
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#121212', color: '#00ff00', minHeight: '100vh' }}>
            <h1>Admin Production Debug Panel</h1>
            <pre style={{ background: '#1e1e1e', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid #333' }}>
                {JSON.stringify(results, null, 2)}
            </pre>
        </div>
    );
}
