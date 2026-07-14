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
            title: 'Welcome to the byKnit Beta Service!',
            category: 'notice',
            locale: 'en',
            content: `Welcome to the byKnit Beta Service!

byKnit is an AI-powered smart marketplace tailored for knitters and pattern designers alike.

Going beyond traditional, simple pattern-selling platforms, we provide smart calculators and conversion tools that truly understand the physical mechanics of knitting. You no longer have to be restricted by different descriptive styles from various designers. Now, you can seamlessly explore and customize patterns perfectly tailored to your own gauge, tension, and preferred techniques.

[We Value Your Feedback!]
byKnit is a platform built together with our community. During this beta period, please feel free to leave your thoughts, feature requests, or any bugs you encounter in the comments below. We will actively review and implement your precious feedback to make our services even more precise and intelligent.

Be the first to experience the new knitting ecosystem proposed by byKnit, and help us shape a better platform for everyone!`
        },
        {
            user_id: userId,
            title: '[Tip] Draw Patterns and Earn Credits! 100% Ultimate Guide to byKnit',
            category: 'tip',
            locale: 'en',
            content: `Hello, this is the byKnit team! 🧶

At byKnit, you can download other designers' patterns using 'Credits' earned entirely through your activities, without cash payments. It creates a beautiful cycle where your shared patterns bring joy to someone, and you, in turn, get to collect new patterns for free.

Here are the 3 easiest steps to make the most out of byKnit!

1. Draw a simple pattern in the Pattern Editor 🎨
Go to the [Pattern Editor] tab, set your width and height stitch counts, and open a new canvas.
It doesn't have to be a complicated garment! Draw your small ideas—like cute patches, colorwork patterns, or initials—using knitting/crochet symbols, and save them.

2. Share it on the Community to get +50 Credits 📎
On the community write screen, click **[Attach My Pattern]** at the bottom to link the pattern you just saved to your post.
Just by sharing your work with neighbors, a +50 Credits reward will be automatically charged to your wallet!

3. Download patterns you want with your earned Credits 🔄
The credits you accumulate through community activities work just like cash in the [Marketplace].
Go ahead and download those beautiful patterns you've had your eye on, paying with your credits instead of cash.

Each pattern you draw with care fills the byKnit community with warmth.

Why not head over to the [Pattern Editor] and draw your very first pattern today? Feel the joy of earning your first credits. Thank you!`
        },
        {
            user_id: userId,
            title: '[Event] Welcome to byKnit! Say hello in the comments and get 100 Credits 🎁',
            category: 'tip',
            locale: 'en',
            content: `Hello byKnit knitters! This is the Admin team. 😊

byKnit, a global knitting platform where crafters from all over the world can draw patterns and communicate together, has officially opened! We hope you are having a wonderful time drawing your own patterns in the Editor and converting your favorite images using our AI converter.

To welcome everyone embarking on this new crafting journey, we have prepared a simple sign-up hello event!

📌 How to Participate

Leave a comment below this post saying hello or sharing **"what you hope to do or expect from byKnit"**!
Everyone who leaves a comment will receive a gift of 100 Credits, which can be used right away for the editor, AI converters, and downloading patterns!
📅 Event Period: Ongoing 🎁 Reward: 100 Credits (distributed sequentially after checking comments)

We look forward to your active participation. Wishing you a happy and cozy crafting time at byKnit. Thank you! 🧶`
        },
        {
            user_id: userId,
            title: '[Tip] Is it illegal to crochet a free Pinterest pattern and post the photo on Instagram? 🤫',
            category: 'tip',
            locale: 'en',
            content: `Pinterest is a crafter's heaven that we visit ten times a day. It is so convenient with all the beautiful patterns and colorwork charts scattered around. However, did you know that replicating a pattern found on Pinterest and sharing it on social media or with others might violate copyright laws without you knowing?

Today, we clarify the guidelines based on Pinterest's copyright policy!

1. Is everything on Pinterest free to use? ❌
According to Pinterest's Terms of Service, the user who uploads an image holds full copyright responsibility. This means more than 90% of the pretty foreign patterns or charts you see on Pinterest are actually captures or scans uploaded without the original author's permission.

2. Is it illegal to knit/crochet it alone at home? 🏡
Crafting it alone for your personal hobby (private use) is completely legal.
Under copyright law, duplicating a copyrighted work for personal, non-commercial use within the home does not constitute infringement. In short, knitting it in your own room and keeping it to yourself is perfectly fine!

3. What if I post photos on Instagram or re-share the pattern? 🚨
- Posting the pattern file (or screen captures) on blogs/communities: Clearly illegal! It violates the "Right of Public Transmission" and can lead to legal action by the copyright holder.
- Posting the photo of the finished item on Instagram: A Gray Zone! Exhibiting a finished product created from an unauthorized copy (the Pinterest scan) in public could lead to disputes depending on how the original designer exercises their rights. Most importantly, the moment you agree to share the pattern file upon request, you cross the line.
- Selling the finished item on online marketplaces (e.g. Etsy, local flea markets): Highly risky! The moment commercial use is involved, you can face civil or criminal lawsuits from the copyright holder.

💡 Safe and Happy Crafting Guidelines for byKnitters
- Always credit the original designer. It is good manners to link to the original website (e.g., Ravelry, designer's blog) or mention their name.
- Use authentic patterns from the byKnit Marketplace. All patterns on byKnit are genuine creations uploaded directly by verified creators. You can proudly share photos of items made with these patterns on social media or sell them commercially with peace of mind!

🔥 What do you think, knitters? "It's a foreign pattern, so who cares?" vs "Even if it's free, we should avoid illegal scans." Share your thoughts in the comments! (We will draw winners among participants to reward Credits 🎁)`
        },
        {
            user_id: userId,
            title: `[Notice] "We Want to Hear From You!" Share your valuable feedback and feature requests 🗣️`,
            category: 'notice',
            locale: 'en',
            content: `Hello byKnit knitters! This is the Admin. 🙋‍♂️

At byKnit, we are constantly updating the service so you can draw patterns and knit in the most convenient way possible. However, the vivid voices of you, our active users, are our greatest driving force!

"I wish this tool was added to the Editor!" "It is a bit uncomfortable when using it on mobile." "It would be perfect if the translator had this feature."

Any minor suggestions, areas of disappointment, or even compliments are welcome. Feel free to share your thoughts in the comments below!

💡 Examples of Feedback Topics
- Suggestions for the Pattern Editor / AI converters (e.g., grid size adjustment, custom palettes)
- Improvements when using the Community and Marketplace
- Any other ideas or bugs encountered

Our team reads every single comment carefully and will actively reflect them in our future update roadmap. Let's build byKnit together. Thank you! 🤍`
        },
        {
            user_id: userId,
            title: 'How to Deal with WIPs (Works in Progress): On the Unfinished Projects We All Have',
            category: 'tip',
            locale: 'en',
            content: `"I'll finish this one before buying more yarn..."
Have you made this promise to yourself, only to find your room filled with half-knitted projects?
In the crafting community, leaving multiple projects unfinished at the same time is called having "WIPs (Works in Progress)".
You start a spring cardigan, then summer arrives so you switch to a summer bag, and then a winter yarn sale starts so you cast on a scarf... (I'm sure I'm not the only one! 😂)
Here are some mind-control tips for knitters who, like me, live with a large family of WIPs:

1. Assign dedicated zones: Place your WIPs in beautiful baskets. Keeping them neatly stored in a designated 'WIP Corner' helps ease the guilt of seeing them scattered.
2. The "One Out, One In" Rule: Establish a personal rule that you must cast off one project before opening a new skein of yarn. (Though it has a 90% failure rate, the resolution itself counts!)
3. Record it in the byKnit Editor: Drawing your designs in the Editor often reignites your passion to complete the actual project.

How many WIPs are currently living in your room? Let's confess honestly in the comments!`
        },
        {
            user_id: userId,
            title: `[Tip] If you don't know "this" when crocheting the Bear AirPods Case, the lid will keep slipping off! 🤫`,
            category: 'tip',
            locale: 'en',
            content: `Hello! 🧶
Today, the cute [AirPods Knitted Teddy Bear Case] pattern has launched in the Marketplace!
It is an aesthetic, 3-star (intermediate) difficulty pattern featuring cute ears, arms, and legs.
If you have ever crocheted an AirPods case, you probably have this common frustration:
"It was tight and perfect at first, but over time, the knitted lid keeps slipping off the AirPods body..."
Here is an incredibly simple tip to prevent this!

💡 Use a thin transparent silicone non-slip gel pad or double-sided clothing tape!
Cut a tiny piece (about half the size of a fingernail) of a thin transparent gel pad (available at local dollar stores or stationery shops) and stick it inside the knitted lid where it meets the AirPods casing. It holds the cover in place surprisingly well!
When you need to wash the case, simply peel it off and wash. It is that simple!

Make sure to apply this tip when making your own bear case with our newly released pattern.
If you have your own tricks to keep the cover secure, please share them in the comments! 😊`
        }
    ];

    console.log('Inserting 7 remaining English posts...');
    const { data, error } = await supabase
        .from('posts')
        .insert(englishPosts)
        .select();

    if (error) {
        console.error('Insert failed:', error);
    } else {
        console.log('Successfully inserted remaining 7 English posts:', data.map(d => ({ id: d.id, title: d.title })));
    }
}

run();
