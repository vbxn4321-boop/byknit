const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDelete() {
    try {
        console.log('Fetching a user...');
        const { data: user, error: userErr } = await supabase.from('profiles').select('id').limit(1).single();
        if (userErr || !user) {
            console.error('Failed to fetch user:', userErr);
            return;
        }
        console.log('User ID:', user.id);

        console.log('Inserting a temporary test post...');
        const { data: post, error: postErr } = await supabase.from('posts').insert({
            user_id: user.id,
            title: 'Temp Test Delete Post',
            content: 'Testing database constraints on delete',
            locale: 'ko',
            category: 'general'
        }).select().single();

        if (postErr || !post) {
            console.error('Failed to insert post:', postErr);
            return;
        }
        console.log('Created post ID:', post.id);

        console.log('Inserting a comment for the post...');
        const { data: comment, error: commentErr } = await supabase.from('post_comments').insert({
            post_id: post.id,
            user_id: user.id,
            content: 'Test comment'
        }).select().single();

        if (commentErr) {
            console.error('Failed to insert comment:', commentErr);
        } else {
            console.log('Created comment ID:', comment.id);
        }

        console.log('Inserting a like for the post...');
        const { data: like, error: likeErr } = await supabase.from('post_likes').insert({
            post_id: post.id,
            user_id: user.id
        }).select().single();

        if (likeErr) {
            console.error('Failed to insert like:', likeErr);
        } else {
            console.log('Created like ID:', like?.id);
        }

        console.log('Now trying to delete the post...');
        const { error: deleteErr } = await supabase.from('posts').delete().eq('id', post.id);

        if (deleteErr) {
            console.error('DELETE FAILED WITH ERROR:', deleteErr);
            console.log('\n--- This indicates a database constraint issue (Cascade delete missing) ---');
        } else {
            console.log('DELETE SUCCEEDED! No constraint issues for likes/comments.');
        }

        // Cleanup just in case it didn't delete
        if (deleteErr) {
            console.log('Cleaning up manually...');
            await supabase.from('post_likes').delete().eq('post_id', post.id);
            await supabase.from('post_comments').delete().eq('post_id', post.id);
            await supabase.from('posts').delete().eq('id', post.id);
            console.log('Manual cleanup complete.');
        }
    } catch (e) {
        console.error('Error during test:', e);
    }
}

checkDelete();
