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

    const user = authData.user;
    console.log(`Auth successful. User ID: ${user.id}`);

    const newPattern = {
        title: { 
            ko: '여름 린넨 꽃 티코스터', 
            en: 'Summer Linen Flower Coaster' 
        },
        description: { 
            ko: '여름 테이블을 싱그럽게 만들어줄 꽃 모양의 티코스터 도안입니다. 시원한 린넨 실을 사용하여 빠르게 뜰 수 있으며, 초보자도 1시간 내로 완성할 수 있는 간단한 난이도입니다. 유리컵 아래 깔아두면 물기를 쏙 흡수해주고 인테리어 소품으로도 제격이에요.', 
            en: 'A flower-shaped tea coaster pattern to freshen up your summer table. Knitted quickly using cool linen yarn, it is simple enough for beginners to finish in under an hour. Perfect for absorbing condensation under glass cups and as a cute home decor accent.' 
        },
        price_usd: 0,
        price_krw: 0,
        is_free: true,
        status: 'published',
        item_type: 'digital',
        type: 'internal_pdf',
        category: 'home',
        subcategory: 'coaster',
        difficulty: 'beginner',
        images: ['/images/summer_flower_coaster.png'],
        designer_id: user.id,
        is_official: true,
        content: {
            type: 'pdf',
            pdf_url: '/summer_flower_coaster.pdf',
            original_filename: 'summer_flower_coaster.pdf',
            metadata: {
                craft_type: 'crochet',
                subcategory: 'coaster',
                yarn_weight: 'sport',
                needles: '코바늘 5/0호 (3.0mm)',
                gauge: '22코 x 10단',
                yardage: '약 30m',
                yarnParts: [
                    {
                        name: '린넨 실 (Linen Yarn)',
                        color: '아이보리/베이지',
                        needle: '코바늘 5/0호 (3.0mm)',
                        amount: '약 30m'
                    }
                ],
                sizeParts: [
                    {
                        id: '1',
                        name: '지름 (Diameter)',
                        detail: '약 11cm'
                    }
                ],
                sizes: {
                    ko: '원사이즈 (지름 약 11cm)',
                    en: 'One Size (Approx. 11cm diameter)'
                },
                measurements: {
                    ko: '지름: 약 11cm',
                    en: 'Diameter: Approx. 11cm'
                }
            }
        }
    };

    console.log(`Inserting new pattern...`);
    const { data: patternData, error: insertError } = await supabase
        .from('patterns')
        .insert(newPattern)
        .select();

    if (insertError) {
        console.error('Insert failed:', insertError);
    } else {
        console.log('Insert successful! Pattern data:', patternData);
    }
}

run();
