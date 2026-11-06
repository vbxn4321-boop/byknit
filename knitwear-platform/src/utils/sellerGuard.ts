import type { SupabaseClient } from '@supabase/supabase-js';

export const SELLER_APPROVAL_REQUIRED_MESSAGE =
    '유료 도안 판매는 판매자 승인 후 가능합니다. 입점 신청을 먼저 진행해 주세요. (무료 도안은 승인 없이 등록할 수 있습니다.)';

// 유료(price > 0) 판매는 관리자이거나 seller_status가 'approved'인 사용자만 가능하다.
export async function assertCanSellPaid(
    adminClient: SupabaseClient,
    userId: string,
    isAdmin: boolean,
    priceKrw: number
): Promise<void> {
    if (isAdmin || !(priceKrw > 0)) return;

    const { data: profile } = await adminClient
        .from('profiles')
        .select('seller_status')
        .eq('id', userId)
        .single();

    if (profile?.seller_status !== 'approved') {
        throw new Error(SELLER_APPROVAL_REQUIRED_MESSAGE);
    }
}
