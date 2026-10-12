const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMore() {
  for (let i = 11; i <= 20; i++) {
    const email = 'influencer' + i + '@byknit.com';
    const password = 'byknit1234!';
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { username: '인플루언서' + i }
    });
    if (!error && data.user) {
        console.log('생성 완료: ' + email);
        await supabase.from('credit_transactions').insert({
            user_id: data.user.id,
            amount: 500,
            type: 'earning',
            description: 'Influencer Testing Bonus'
        });
    } else {
        console.log('에러 (' + email + '): ', error ? error.message : 'Unknown');
    }
  }
}
createMore();
