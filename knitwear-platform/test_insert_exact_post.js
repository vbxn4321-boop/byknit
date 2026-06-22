const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    const email = 'admin@by-knit.com';
    const password = 'godqhrgkwk12!';

    console.log(`Logging in...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const user = authData.user;
    
    const title = `[이벤트] 바이니트에 오신 것을 환영합니다! 가입 인사 남기고 100 크레딧 받아가세요 🎁`;
    const content = `안녕하세요, 바이니트(byKnit) 니터 여러분! 운영팀 관리자입니다. 😊

드디어 전 세계 뜨개인들이 함께 도안을 그리고 소통할 수 있는 글로벌 뜨개 플랫폼 바이니트가 정식으로 문을 열었습니다!
바이니트 에디터로 나만의 도안도 그리고, AI 변환기를 이용해 최애 이미지를 도안으로 바꿔보며 즐거운 시간 보내고 계신가요?

새로운 뜨개 여정을 시작하는 니터분들을 환영하기 위해 아주 간단한 가입 인사 이벤트를 준비했습니다!

📌 참여 방법
1. 본 게시글 아래 댓글로 "가입 인사" 또는 "바이니트에서 해보고 싶은 활동/기대하는 점"을 자유롭게 남겨주세요!
2. 댓글을 남겨주신 모든 분께 에디터와 AI 도안 변환 등에서 바로 사용 가능한 100 크레딧을 선물해 드립니다!

📅 이벤트 기간: 상시 진행
🎁 이벤트 보상: 100 크레딧 (댓글 작성 확인 후 순차적 지급)

많은 참여와 관심 부탁드리며, 앞으로 바이니트에서 행복하고 편안한 뜨개 시간 보내세요. 감사합니다! 🧶`;

    const insertData = {
        user_id: user.id,
        title,
        content,
        locale: 'ko',
        category: 'general'
    };

    console.log(`Attempting exact insert...`);

    const { data: postData, error: insertError } = await supabase
        .from('posts')
        .insert(insertData)
        .select();

    if (insertError) {
        console.error('Insert failed with error:', insertError);
    } else {
        console.log('Insert successful! Post data:', postData);
        // clean up
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('id', postData[0].id);
        console.log('Cleanup delete error:', deleteError);
    }
}

run();
