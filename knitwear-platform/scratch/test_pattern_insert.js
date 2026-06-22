const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Testing insert for patterns...');
    
    // First, let's find a valid user ID (from profiles)
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
        
    if (profileError || !profile) {
        console.error('Failed to get user profile:', profileError);
        return;
    }
    
    const userId = profile.id;
    console.log('Using user ID:', userId);

    // Replicate publishPattern fields (from editor.ts)
    const mockPatternEditor = {
        designer_id: userId,
        type: 'internal_pdf',
        title: { ko: '테스트 타이틀', en: 'Test Title' },
        description: { ko: '테스트 설명', en: 'Test Description' },
        price_usd: 10,
        category: 'general',
        difficulty: 'easy',
        thumbnail_url: 'https://example.com/thumb.jpg',
        images: ['https://example.com/thumb.jpg'],
        subcategory: 'sweater',
        craft_type: 'knitting',
        yarn_weight: 'medium',
        yardage: 200, // int
        needles: '3.5mm',
        gauge: '20 sts x 28 rows',
        grid_data: [[]],
        palette: [],
        grid_width: 10,
        grid_height: 10,
        content: {
            type: 'internal_pdf',
            metadata: {
                yarnParts: []
            }
        }
    };

    console.log('\n--- 1. Testing insert matching publishPattern (from editor.ts) ---');
    const { data: res1, error: err1 } = await adminClient
        .from('patterns')
        .insert(mockPatternEditor)
        .select();

    if (err1) {
        console.error('Insert 1 failed:', err1);
    } else {
        console.log('Insert 1 succeeded!', res1[0].id);
        // Clean up
        await adminClient.from('patterns').delete().eq('id', res1[0].id);
    }

    // Replicate createPdfPattern fields (from pattern.ts)
    const mockPatternPdf = {
        title: { ko: '테스트 PDF 타이틀', en: 'Test PDF Title' },
        description: { ko: '테스트 PDF 설명', en: 'Test PDF Description' },
        price: 15,
        price_usd: 15,
        is_free: false,
        images: ['https://example.com/thumb.jpg'],
        category: 'general',
        difficulty: 'medium',
        designer_id: userId,
        status: 'published', // wait, we expect this to fail if column status doesn't exist
        content: {
            type: 'pdf',
            pdf_url: 'https://example.com/test.pdf',
            original_filename: 'test.pdf'
        }
    };

    console.log('\n--- 2. Testing insert matching createPdfPattern (from pattern.ts) ---');
    const { data: res2, error: err2 } = await adminClient
        .from('patterns')
        .insert(mockPatternPdf)
        .select();

    if (err2) {
        console.error('Insert 2 failed:', err2);
    } else {
        console.log('Insert 2 succeeded!', res2[0].id);
        // Clean up
        await adminClient.from('patterns').delete().eq('id', res2[0].id);
    }
}

run();
