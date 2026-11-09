// 서버 전용: 크레딧 지급/차감. 'use server' 파일이 아니므로 브라우저에서 직접 호출할 수 없다.
// 호출하는 쪽에서 대상 사용자 권한을 먼저 확인해야 한다.
import { createAdminClient } from '@/utils/supabase/server';

async function applyCredits(userId: string, delta: number, type: string, description: string) {
    const supabase = await createAdminClient();

    // credit_transactions INSERT 트리거가 profiles.credits를 갱신한다
    const { error } = await supabase
        .from('credit_transactions')
        .insert({ user_id: userId, amount: delta, type, description });
    if (!error) return;

    console.warn('credit_transactions insert failed, updating profile directly:', error.message);
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    if (readError) throw new Error('Failed to update credits');

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: (profile.credits ?? 0) + delta })
        .eq('id', userId);
    if (updateError) throw new Error('Failed to update credits');
}

function assertPositiveInteger(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Invalid credit amount');
}

export async function grantCredits(userId: string, amount: number, description: string) {
    assertPositiveInteger(amount);
    await applyCredits(userId, amount, 'earning', description);
}

export async function spendCredits(userId: string, amount: number, description: string) {
    assertPositiveInteger(amount);

    const supabase = await createAdminClient();
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    if (error || (profile.credits ?? 0) < amount) throw new Error('Insufficient credits');

    await applyCredits(userId, -amount, 'spending', description);
}
