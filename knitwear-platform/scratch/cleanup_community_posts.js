const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHlrY2llaHdxaXd0anJlYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczODkxNSwiZXhwIjoyMDk0MzE0OTE1fQ.8yeBxo0TQYvwSoa9WgTsjRVSgK9vb2JvIVtZHJIC1-A';

const INFLUENCERS = [
    'df2460bd-7aa8-48f0-bb7d-7c8198267ce6', // influencer1
    'fe6a8df5-8c46-4ea9-af81-f295316961f4', // influencer2
    '77e3f07f-89f5-4048-9900-a85e382f787b', // influencer3
    'de941bf2-5419-4c2c-8502-e13f8fd03818', // influencer4
    '59590511-fe70-4a7f-bb38-7102ec3ee967'  // influencer5
];

async function cleanup() {
    console.log('Cleaning up mock community data...');
    
    // 1. Find all posts created by influencers
    const queryUrl = `${SUPABASE_URL}/rest/v1/posts?select=id&user_id=in.(${INFLUENCERS.join(',')})`;
    let res = await fetch(queryUrl, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    if (!res.ok) {
        console.error('Error fetching posts for cleanup:', await res.text());
        return;
    }
    
    const posts = await res.json();
    const postIds = posts.map(p => p.id);
    console.log(`Found ${postIds.length} mock posts to delete.`);
    
    if (postIds.length === 0) {
        console.log('No mock posts found. Cleanup complete.');
        return;
    }
    
    // 2. Find polls associated with these posts
    const pollQueryUrl = `${SUPABASE_URL}/rest/v1/polls?select=id&post_id=in.(${postIds.join(',')})`;
    let pollRes = await fetch(pollQueryUrl, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    if (pollRes.ok) {
        const polls = await pollRes.json();
        const pollIds = polls.map(p => p.id);
        console.log(`Found ${pollIds.length} mock polls to delete.`);
        
        if (pollIds.length > 0) {
            // Delete poll votes
            await fetch(`${SUPABASE_URL}/rest/v1/poll_votes?poll_id=in.(${pollIds.join(',')})`, {
                method: 'DELETE',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`
                }
            });
            console.log('Deleted poll votes.');
            
            // Delete poll options
            await fetch(`${SUPABASE_URL}/rest/v1/poll_options?poll_id=in.(${pollIds.join(',')})`, {
                method: 'DELETE',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`
                }
            });
            console.log('Deleted poll options.');
            
            // Delete polls
            await fetch(`${SUPABASE_URL}/rest/v1/polls?id=in.(${pollIds.join(',')})`, {
                method: 'DELETE',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`
                }
            });
            console.log('Deleted polls.');
        }
    }
    
    // Delete post comments
    await fetch(`${SUPABASE_URL}/rest/v1/post_comments?post_id=in.(${postIds.join(',')})`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    console.log('Deleted post comments.');

    // Delete post likes
    await fetch(`${SUPABASE_URL}/rest/v1/post_likes?post_id=in.(${postIds.join(',')})`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    console.log('Deleted post likes.');

    // 3. Delete posts
    let deletePostsRes = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=in.(${postIds.join(',')})`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    
    if (deletePostsRes.ok) {
        console.log('Successfully deleted all mock posts.');
    } else {
        console.error('Failed to delete posts:', await deletePostsRes.text());
    }
}

cleanup().catch(console.error);
