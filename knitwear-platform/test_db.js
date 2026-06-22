const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
    const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
    const { data: post } = await supabase.from('posts').select('id, views').limit(1).single();
    
    console.log('Before views:', post.views);
    const { error: updateError } = await supabase.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id);
    const { data: postAfter } = await supabase.from('posts').select('id, views').eq('id', post.id).single();
    console.log('After views:', postAfter.views);
    console.log('Update Error:', updateError);
    
    const { data: like } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single();
    if (like) {
        const { error } = await supabase.from('post_likes').delete().eq('id', like.id);
        console.log('Deleted like, Error:', error);
    } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        console.log('Inserted like, Error:', error);
    }
}
test();
