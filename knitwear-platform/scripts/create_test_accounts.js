const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://ggtykciehwqiwtjrebmw.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAccounts() {
  console.log("홍보용 인플루언서 계정 10개를 생성합니다...");
  let successCount = 0;

  for (let i = 1; i <= 10; i++) {
    const email = `influencer${i}@byknit.com`;
    const password = `byknit1234!`;
    
    // Create user via Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: `인플루언서${i}`
      }
    });

    if (error) {
       console.log(`[실패] ${email} - ${error.message}`);
       // If it already exists, let's still add credits
       if (error.message.includes('already registered')) {
            const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
            if (existingUser) {
                 await supabase.from('credit_transactions').insert({
                    user_id: existingUser.id,
                    amount: 500,
                    type: 'earning',
                    description: 'Influencer Testing Bonus'
                 });
                 console.log(`[크레딧만 추가됨] ${email}`);
                 successCount++;
            }
       }
    } else {
       console.log(`[성공] 아이디: ${email} / 비밀번호: ${password}`);
       successCount++;
       
       // Ensure they have credits
       await supabase.from('credit_transactions').insert({
            user_id: data.user.id,
            amount: 500, // Give them 500 credits for plenty of testing!
            type: 'earning',
            description: 'Influencer Testing Bonus'
        });
    }
  }
  console.log(`총 ${successCount}개의 계정 세팅이 완료되었습니다!`);
}

createAccounts();
