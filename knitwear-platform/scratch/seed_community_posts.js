const SUPABASE_URL = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHlrY2llaHdxaXd0anJlYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczODkxNSwiZXhwIjoyMDk0MzE0OTE1fQ.8yeBxo0TQYvwSoa9WgTsjRVSgK9vb2JvIVtZHJIC1-A';

const INFLUENCERS = [
    'df2460bd-7aa8-48f0-bb7d-7c8198267ce6', // influencer1
    'fe6a8df5-8c46-4ea9-af81-f295316961f4', // influencer2
    '77e3f07f-89f5-4048-9900-a85e382f787b', // influencer3
    'de941bf2-5419-4c2c-8502-e13f8fd03818', // influencer4
    '59590511-fe70-4a7f-bb38-7102ec3ee967'  // influencer5
];

async function createPost(postData, pollData = null) {
    // 1. Insert post
    let res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(postData)
    });
    
    if (!res.ok) {
        console.error('Failed to create post:', await res.text());
        return null;
    }
    
    const [insertedPost] = await res.json();
    console.log(`Created Post: "${insertedPost.title}" [ID: ${insertedPost.id}]`);
    
    // 2. Insert poll if present
    if (pollData && insertedPost) {
        let pollRes = await fetch(`${SUPABASE_URL}/rest/v1/polls`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                post_id: insertedPost.id,
                question: pollData.question
            })
        });
        
        if (pollRes.ok) {
            const [insertedPoll] = await pollRes.json();
            console.log(`- Created Poll: "${insertedPoll.question}" [ID: ${insertedPoll.id}]`);
            
            // 3. Insert poll options
            const options = pollData.options.map(opt => ({
                poll_id: insertedPoll.id,
                option_text: opt
            }));
            
            let optionsRes = await fetch(`${SUPABASE_URL}/rest/v1/poll_options`, {
                method: 'POST',
                headers: {
                    'apikey': SERVICE_KEY,
                    'Authorization': `Bearer ${SERVICE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });
            
            if (optionsRes.ok) {
                console.log(`  - Inserted ${options.length} options for the poll.`);
            } else {
                console.error('Failed to insert poll options:', await optionsRes.text());
            }
        } else {
            console.error('Failed to create poll:', await pollRes.text());
        }
    }
}

async function main() {
    console.log('Seeding mock community posts...');
    
    // Post 1: Beanie yarn poll
    await createPost({
        user_id: INFLUENCERS[0],
        title: '요즘 핫한 Y2K 캣 비니 뜨시는 분들 있나요? 실 추천해주세요! 🐱',
        content: '인스타 숏폼 보다가 너무 귀여워서 캣 비니 떠보려고 하는데요! 귀 모양이 쫑긋하고 이쁘게 서려면 두꺼운 털실을 써야 한다던데, 어떤 실이 제일 잘 설까요? 다들 사용해보신 실 추천이나 투표 부탁드려요!',
        locale: 'ko',
        category: 'general'
    }, {
        question: '어떤 실로 뜨는 게 고양이 귀 모양이 가장 이쁘게 살까요?',
        options: [
            '메리노 울 벌키사 (도톰한 두께감)',
            '부드럽고 가벼운 아크릴 혼방사',
            '탄탄하게 잡아주는 패브릭 얀',
            '자연스러운 느낌의 코튼 튜브사'
        ]
    });
    
    // Post 2: Dog Collar show off
    await createPost({
        user_id: INFLUENCERS[1],
        title: '🌸 우리 집 댕댕이 꽃칼라 케이프 완성했어요! 너무 귀여워서 오열 중ㅠㅠ',
        content: '바이니트에 새로 올라온 반려동물 꽃 케이프 도안 보고 크림색이랑 연두색 실 남은걸로 주말 동안 떠봤는데 진짜 대박이에요!! 산책 나갔더니 동네 댕댕이 견주분들이 다들 어디서 샀냐고 물어보시네요ㅎㅎ 코바늘 초보인데도 서술 도안이 너무 친절해서 이틀 만에 금방 완성했습니다! 강아지 키우시는 니터분들 무조건 뜨세요!!',
        locale: 'ko',
        category: 'general',
        image_url: '/images/pet_flower_collar.png'
    });
    
    // Post 3: Summer lace top progress
    await createPost({
        user_id: INFLUENCERS[2],
        title: '☀️ 드디어 여름 린넨 레이스 탑 시작했습니다! 같이 뜨실 분?',
        content: '썸머 린넨 레이스 탑 도안 보자마자 린넨 실 150g 질렀어요. 레이스 무늬가 섬세하고 5성급 난이도라 집중해야 하지만, 한 단 한 단 무늬가 올라갈 때마다 예술이네요! 올여름 휴가 때 바닷가에서 나시 위에 레이어드해서 입으려고 달리는 중입니다. 혹시 게이지 저랑 비슷하게 나오시는 분 있나요? 같이 뜨면서 팁 나눠요!',
        locale: 'ko',
        category: 'general',
        image_url: '/images/summer_lace_top.png'
    });
    
    // Post 4: Knit BGM poll
    await createPost({
        user_id: INFLUENCERS[3],
        title: '🎧 다들 뜨개질 하실 때 어떤 BGM 들으시나요?',
        content: '코 잡고 메리야스 무한 뜨기 단에 들어가면 손은 기계처럼 움직이고 머리는 비워지잖아요ㅎㅎ 이럴 때 듣기 좋은 최애 노래나 라디오 있으신가요? 저는 주로 새벽에 조용히 로파이 비트 틀어두는데 집중력 최고예요! 여러분의 뜨개 메이트 BGM을 투표해주세요!',
        locale: 'ko',
        category: 'general'
    }, {
        question: '나만의 최애 뜨개 메이트 BGM 스타일은?',
        options: [
            '잔잔하고 분위기 있는 Lo-Fi 비트 / 재즈',
            '감성 가득한 K-indie / 포크 어쿠스틱',
            '넷플릭스 드라마나 예능 배경음으로 틀어두기',
            '유튜브 뜨개 브이로그나 수다 방송 듣기',
            '아무 소리 없는 완벽한 고요 상태'
        ]
    });
    
    // Post 5: Men's open collar polo query
    await createPost({
        user_id: INFLUENCERS[4],
        title: '👕 남친 선물로 오픈카라 반팔 니트 도전해보려는데 초보도 될까요?',
        content: '남자친구 생일 선물로 린넨 오픈카라 니트 도전해보고 싶은데 대바늘 옷 뜨기는 완전 처음이라 떨려요... 난이도가 별 4개짜리던데 설명 보니까 독일식 되돌아뜨기 경사뜨기 기법이랑 진동 코줍기가 들어가더라고요! 뜨개 왕초보도 천천히 유튜브 검색해가면서 서술 도안 따라 하면 완성할 수 있을까요? 먼저 떠보신 분들의 진심 어린 조언과 용기 부탁드립니다!!',
        locale: 'ko',
        category: 'general',
        image_url: '/images/mens_knit_polo.png'
    });
    
    console.log('Seeding completed successfully!');
}

main().catch(console.error);
