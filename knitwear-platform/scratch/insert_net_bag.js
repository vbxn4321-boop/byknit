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

    // 1. Insert Pattern
    const newPattern = {
        title: { 
            ko: '데일리 코튼 네트백', 
            en: 'Daily Cotton Net Bag' 
        },
        description: { 
            ko: '여름철에 어울리는 통기성 좋고 가벼운 네트 숄더백입니다. 동방면사나 마크라메용 실로 뜨기 좋으며, 기초 코바늘 사슬뜨기와 한길긴뜨기 기법만 사용하므로 누구나 쉽게 따라 할 수 있습니다. 넉넉한 수납과 탄탄한 짜임으로 매일 들고 다니기 딱 좋습니다.', 
            en: 'A lightweight, breathable net shoulder bag perfect for summer. Easy to crochet with cotton or macrame yarn, using basic chain stitches and double crochet. Spacious and sturdy, it makes a wonderful everyday tote.' 
        },
        price_usd: 0,
        price_krw: 0,
        is_free: true,
        status: 'published',
        item_type: 'digital',
        type: 'internal_pdf',
        category: 'home', // Standard category
        subcategory: 'bag',
        difficulty: 'beginner',
        images: ['/images/daily_cotton_net_bag.png'],
        designer_id: user.id,
        is_official: true,
        content: {
            type: 'pdf',
            pdf_url: '/daily_cotton_net_bag.pdf',
            original_filename: 'daily_cotton_net_bag.pdf',
            metadata: {
                craft_type: 'crochet',
                subcategory: 'bag',
                yarn_weight: 'worsted',
                needles: '코바늘 6/0호 (3.5mm)',
                gauge: '16코 x 8단',
                yardage: '약 120m',
                yarnParts: [
                    {
                        name: '동방면사 24합 (Dongbang Cotton Yarn)',
                        color: '크림/베이지',
                        needle: '코바늘 6/0호 (3.5mm)',
                        amount: '약 120m'
                    }
                ],
                sizeParts: [
                    {
                        id: '1',
                        name: '가로 x 세로 (Width x Height)',
                        detail: '약 25cm x 30cm (끈 제외)'
                    }
                ],
                sizes: {
                    ko: '원사이즈 (약 25cm x 30cm)',
                    en: 'One Size (Approx. 25cm x 30cm)'
                },
                measurements: {
                    ko: '가로: 25cm, 세로: 30cm',
                    en: 'Width: 25cm, Height: 30cm'
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
        console.error('Pattern insert failed:', insertError);
    } else {
        console.log('Pattern insert successful! ID:', patternData[0].id);
    }

    // 2. Insert Community Post
    const newPost = {
        title: '[자랑/도안] 여름에 딱! 내가 직접 뜬 데일리 코튼 네트백 자랑 🧶',
        content: `안녕하세요! 이번 여름 휴가 갈 때 가볍게 들고 가려고 '데일리 코튼 네트백'을 코바늘로 뚝딱 떠봤어요.

구멍이 숭숭 뚫려 있어서 통기성도 좋고, 텀블러나 지갑, 선글라스 같은 소지품이 아주 넉넉하게 들어갑니다! 동방 24합 면사를 사용해서 6/0호 코바늘로 떴는데, 생각보다 조직이 엄청 탄탄해서 축 처지지 않고 예쁘게 잡혀서 대만족 중입니다. 

도안 에디터로 정리한 서술형 가이드는 **마켓플레이스에 무료 도안**으로 올려두었습니다. '데일리 코튼 네트백'을 검색하면 바로 다운로드 받으실 수 있으니 모두 하나씩 득템해서 떠보세요! 

도안 보시다가 헷갈리시는 점은 댓글로 편하게 물어봐 주시면 답변드리겠습니다. 다들 시원한 뜨개 여름 보내세요! 😊`,
        locale: 'ko',
        category: 'tip', // Valid category
        user_id: user.id
    };

    console.log(`Inserting community post...`);
    const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert(newPost)
        .select();

    if (postError) {
        console.error('Community post insert failed:', postError);
    } else {
        console.log('Community post insert successful! ID:', postData[0].id);
    }
}

run();
