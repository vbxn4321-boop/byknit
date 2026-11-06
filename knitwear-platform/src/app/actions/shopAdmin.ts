'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { SHOP_CATEGORIES } from '@/constants/shop';
import { cancelPortonePayment } from '@/utils/shopPayment';
import type { ShopOrder, ShopProduct, ShopProductInput } from '@/types/shop';

/** 모든 관리자 액션의 첫 줄에서 호출한다. 관리자가 아니면 null */
async function getAdminClientIfAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = await createAdminClient();
    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role === 'admin' ? admin : null;
}

const FORBIDDEN = '관리자 권한이 필요합니다.';

function revalidateShop() {
    revalidatePath('/[locale]/shop', 'layout');
}

export async function adminListShopProducts(): Promise<{ products: ShopProduct[]; error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { products: [], error: FORBIDDEN };

    const { data, error } = await admin
        .from('shop_products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return { products: [], error: error.message };
    return { products: data as ShopProduct[] };
}

export async function adminSaveShopProduct(input: ShopProductInput): Promise<{ success?: boolean; error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };

    const name = input.name?.trim();
    if (!name || name.length > 100) return { error: '상품명은 1~100자로 입력해 주세요.' };
    if (!SHOP_CATEGORIES.some(c => c.id === input.category)) return { error: '카테고리를 선택해 주세요.' };
    if (!Number.isInteger(input.priceKrw) || input.priceKrw < 100) return { error: '가격은 100원 이상이어야 합니다.' };
    if (!Number.isInteger(input.stock) || input.stock < 0) return { error: '재고는 0 이상의 정수여야 합니다.' };
    if (input.isActive && input.images.length === 0) return { error: '판매 중으로 설정하려면 이미지를 1장 이상 등록해 주세요.' };

    const row = {
        name,
        category: input.category,
        summary: input.summary?.trim() || null,
        description: input.description || null,
        price_krw: input.priceKrw,
        stock: input.stock,
        images: input.images,
        is_active: input.isActive,
        updated_at: new Date().toISOString(),
    };

    const { error } = input.id
        ? await admin.from('shop_products').update(row).eq('id', input.id)
        : await admin.from('shop_products').insert(row);

    if (error) return { error: error.message };
    revalidateShop();
    return { success: true };
}

/** 주문 이력이 있는 상품은 내역 보존을 위해 삭제하지 않고 판매 중지한다 */
export async function adminDeleteShopProduct(id: string): Promise<{ result?: 'deleted' | 'hidden'; error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };

    const { count, error: countError } = await admin
        .from('shop_order_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', id);
    if (countError) return { error: countError.message };

    if ((count ?? 0) > 0) {
        const { error } = await admin.from('shop_products').update({ is_active: false }).eq('id', id);
        if (error) return { error: error.message };
        revalidateShop();
        return { result: 'hidden' };
    }

    const { error } = await admin.from('shop_products').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidateShop();
    return { result: 'deleted' };
}

export async function adminListShopOrders(): Promise<{ orders: ShopOrder[]; error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { orders: [], error: FORBIDDEN };

    const { data, error } = await admin
        .from('shop_orders')
        .select('*, shop_order_items(*)')
        .neq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) return { orders: [], error: error.message };
    return { orders: data as ShopOrder[] };
}

export async function adminMarkPreparing(orderId: string): Promise<{ error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };

    const { data, error } = await admin
        .from('shop_orders')
        .update({ status: 'preparing', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'paid')
        .select('id');

    if (error) return { error: error.message };
    if (!data?.length) return { error: '결제 완료 상태의 주문만 변경할 수 있습니다.' };
    return {};
}

export async function adminMarkShipped(orderId: string, courier: string, trackingNumber: string): Promise<{ error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };
    if (!courier?.trim() || !trackingNumber?.trim()) return { error: '택배사와 송장번호를 입력해 주세요.' };

    const now = new Date().toISOString();
    const { data, error } = await admin
        .from('shop_orders')
        .update({
            status: 'shipped',
            courier: courier.trim(),
            tracking_number: trackingNumber.trim(),
            shipped_at: now,
            updated_at: now,
        })
        .eq('id', orderId)
        .in('status', ['paid', 'preparing', 'shipped'])
        .select('id');

    if (error) return { error: error.message };
    if (!data?.length) return { error: '배송 처리할 수 없는 주문 상태입니다.' };
    return {};
}

export async function adminMarkDelivered(orderId: string): Promise<{ error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };

    const { data, error } = await admin
        .from('shop_orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'shipped')
        .select('id');

    if (error) return { error: error.message };
    if (!data?.length) return { error: '배송중인 주문만 변경할 수 있습니다.' };
    return {};
}

/** 실제 결제를 전액 취소한 뒤 주문에 반영하고 재고를 복구한다 */
export async function adminRefundShopOrder(orderId: string, reason: string): Promise<{ error?: string }> {
    const admin = await getAdminClientIfAdmin();
    if (!admin) return { error: FORBIDDEN };

    const { data: order, error: orderError } = await admin
        .from('shop_orders')
        .select('id, status, transaction_id')
        .eq('id', orderId)
        .single();

    if (orderError || !order) return { error: '주문을 찾을 수 없습니다.' };
    if (['pending', 'cancelled', 'refunded'].includes(order.status)) return { error: '환불할 수 없는 주문 상태입니다.' };
    if (!order.transaction_id) return { error: '결제 정보가 없는 주문입니다.' };

    const refundReason = reason?.trim() || '관리자 환불';
    const cancelled = await cancelPortonePayment(order.transaction_id, refundReason);
    if (!cancelled) return { error: '결제 취소에 실패했습니다. 포트원 콘솔에서 결제 상태를 확인해 주세요.' };

    const { error } = await admin.rpc('cancel_shop_order', { p_order_id: orderId, p_reason: refundReason });
    if (error) return { error: `결제는 취소되었지만 주문 반영에 실패했습니다: ${error.message}` };

    revalidateShop();
    return {};
}
