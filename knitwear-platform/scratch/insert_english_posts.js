const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const email = 'admin@by-knit.com';
    const password = 'godqhrgkwk12!';

    console.log(`Logging in to get admin session...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`Auth successful. User ID: ${userId}`);

    const englishPosts = [
        {
            user_id: userId,
            title: 'Matches perfectly with AirPods! Showcasing my hand-crocheted Mini Taiyaki Keyring Pouch 🧶',
            category: 'showcase',
            locale: 'en',
            content: `Hi everyone, it's already July! I just crocheted this super cute 'Mini Taiyaki (Fish Bread) Keyring Pouch' that you can hang on your bag.

I used the oval crochet technique to make a flat, chubby fish body, and then attached side fins and a tail to complete it. I added a drawstring on the back so small essentials like AirPods, lip balm, or cards fit inside perfectly!

Crocheted with light brown yarn, it looks just like a warm custard taiyaki. The little black bead eyes give it a silly, adorable expression that steals the show.

The step-by-step written pattern made with our Pattern Editor has been uploaded to the Marketplace as a free official pattern. Just search for 'Mini Taiyaki (Fish Bread) Keyring Pouch' to download it for free and make your own!

If you have any questions while crocheting, feel free to leave a comment below. Wishing you all a cool and happy crafting summer! 😊`
        },
        {
            user_id: userId,
            title: `[Notice] "What should I make next?" 🤔 New Community 'Poll/Voting' Feature is Live! 🗳️`,
            category: 'notice',
            locale: 'en',
            content: `💡 When is the voting feature useful?

1. Conducting Demand Surveys for New Patterns
   "Should my next free pattern be a Toast Coaster or a Taiyaki Pouch?" Designers can gauge the preference of their next creations beforehand by running a quick vote.

2. Gathering Craft Preferences & Discussions
   Host casual knitting balance games to engage with the community: "Knitting vs. Crochet - what's your favorite tool?", or "For summer yarn, is linen the best vs. cotton?"

3. Real-time Voting Rates & Result Visualization
   Once you vote, you can instantly see the percentages (%) and vote counts displayed in a clean, visual graph in real-time.

This new voting feature brings designers and knitters one step closer! Give it a try by posting a simple poll in the community now and see how users react.

We will continue to improve byKnit to provide a more convenient and exciting crafting life. Thank you! 🧶❤️`
        }
    ];

    console.log('Inserting English posts...');
    const { data, error } = await supabase
        .from('posts')
        .insert(englishPosts)
        .select();

    if (error) {
        console.error('Insert failed:', error);
    } else {
        console.log('Successfully inserted English posts:', data.map(d => ({ id: d.id, title: d.title })));
    }
}

run();
