import { createClient } from '@/utils/supabase/server';

export async function checkAnalytics() {
    const supabase = await createClient();
    const { data: views } = await supabase.from('pattern_views').select('viewed_at').limit(50);
    console.log('Sample Views:', views);
}
