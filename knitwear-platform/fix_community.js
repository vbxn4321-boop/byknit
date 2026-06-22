
const fs = require('fs');
let code = fs.readFileSync('src/app/actions/community.ts', 'utf8');

// 1. Fix revalidatePath
code = code.replace(/revalidatePath\('?\/\[locale\]\/community'?, 'page'\);/g, 'revalidatePath(\'/\', \'layout\');');

// 2. Import createAdminClient
if (!code.includes('createAdminClient } from')) {
    code = code.replace(
        /import \{ createClient \} from '@\/utils\/supabase\/server';/,
        'import { createClient, createAdminClient } from \'@/utils/supabase/server\';'
    );
}

// 3. Fix incrementPostViews (remove revalidatePath, use admin client)
code = code.replace(
    /export async function incrementPostViews\([^)]+\) \{[\s\S]*?(^}$|^})/m,
    'export async function incrementPostViews(postId: string) {\n' +
    '    const supabase = await createAdminClient();\n' +
    '    const { error } = await supabase.rpc(\'increment_post_views\', { post_id: postId });\n' +
    '    if (error) {\n' +
    '        const { data: post } = await supabase.from(\'posts\').select(\'views\').eq(\'id\', postId).single();\n' +
    '        if (post) {\n' +
    '            await supabase.from(\'posts\').update({ views: (post.views || 0) + 1 }).eq(\'id\', postId);\n' +
    '        }\n' +
    '    }\n' +
    '}\n'
);

// 4. Inject adminClient into all mutation functions
const functionsToPatch = ['toggleLike', 'toggleFollow', 'createComment', 'deleteComment', 'updatePost', 'deletePost', 'toggleBookmark', 'createPost'];

for (const fn of functionsToPatch) {
    let startIndex = code.indexOf('export async function ' + fn);
    if (startIndex === -1) continue;
    
    let endKeyword = 'export async function';
    let endIndex = code.indexOf(endKeyword, startIndex + 10);
    if (endIndex === -1) endIndex = code.length;
    
    let fnBody = code.substring(startIndex, endIndex);
    
    // Inject adminClient declaration right after createClient()
    if (!fnBody.includes('createAdminClient()')) {
        fnBody = fnBody.replace(
            /const supabase = await createClient\(\);/,
            'const supabase = await createClient();\n    const adminClient = await createAdminClient();'
        );
        
        // Replace all supabase.from with adminClient.from
        fnBody = fnBody.replace(/supabase\.from/g, 'adminClient.from');
        // Replace all supabase.rpc with adminClient.rpc
        fnBody = fnBody.replace(/supabase\.rpc/g, 'adminClient.rpc');
        
        code = code.substring(0, startIndex) + fnBody + code.substring(endIndex);
    }
}

fs.writeFileSync('src/app/actions/community.ts', code, 'utf8');
console.log('Success');
