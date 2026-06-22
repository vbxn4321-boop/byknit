const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ggtykciehwqiwtjrebmw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndHlrY2llaHdxaXd0anJlYm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczODkxNSwiZXhwIjoyMDk0MzE0OTE1fQ.8yeBxo0TQYvwSoa9WgTsjRVSgK9vb2JvIVtZHJIC1-A';
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
