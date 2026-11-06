'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { calcShippingFee, SHOP_MAX_QUANTITY } from '@/constants/shop';
import { settleShopPayment } from '@/utils/shopPayment';
import type { ShopOrder, ShopProduct, ShopShippingInput } from '@/types/shop';

const PRODUCT_COLUMNS = 'id, name, category, summary, description, price_krw, stock, images, is_active, created_at';

export async function getShopProducts(): Promise<ShopProduct[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('shop_products')
        .select(PRODUCT_COLUMNS)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Shop] getShopProducts:', error.message);
        return [];
    }
    return data as ShopProduct[];
}

export async function getShopProduct(id: string): Promise<ShopProduct | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('shop_products')
        .select(PRODUCT_COLUMNS)
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error('[Shop] getShopProduct:', error.message);
        return null;
    }
    return data as ShopProduct | null;
}

/** 장바구니 표시용: 저장해 둔 값이 아니라 현재 가격과 재고를 가져온다 */
export async function getShopProductsByIds(ids: string[]): Promise<ShopProduct[]> {
    if (ids.length === 0) return [];
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('shop_products')
        .select(PRODUCT_COLUMNS)
        .in('id', ids)
        .eq('is_active', true);

    if (error) {
        console.error('[Shop] getShopProductsByIds:', error.message);
        return [];
    }
    return data as ShopProduct[];
}

function validateShipping(input: ShopShippingInput): string | null {
    if (!input.recipientName?.trim()) return '받는 분 이름을 입력해 주세요.';
    if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test((input.phone || '').trim())) return '연락처를 올바르게 입력해 주세요.';
    if (!/^\d{5}$/.test((input.postcode || '').trim())) return '우편번호 5자리를 입력해 주세요.';
    if (!input.address?.trim()) return '주소를 입력해 주세요.';
    return null;
}

function generateOrderNo(): string {
    const date = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    return `BK${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * 결제 전에 주문을 만든다. 금액은 클라이언트 값을 믿지 않고 DB 가격으로 계산한다.
 * 재고 차감은 결제가 확인된 뒤 finalize_shop_order 에서 일어난다.
 */
export async function createShopOrder(
    items: { productId: string; quantity: number }[],
    shipping: ShopShippingInput,
): Promise<{ orderId?: string; orderNo?: string; amount?: number; orderName?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: '로그인이 필요합니다.' };

    if (!Array.isArray(items) || items.length === 0) return { error: '장바구니가 비어 있습니다.' };
    if (new Set(items.map(i => i.productId)).size !== items.length) return { error: '잘못된 주문입니다.' };
    if (items.some(i => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > SHOP_MAX_QUANTITY)) {
        return { error: '수량이 올바르지 않습니다.' };
    }

    const shippingError = validateShipping(shipping);
    if (shippingError) return { error: shippingError };

    const admin = await createAdminClient();
    const { data: products, error: productError } = await admin
        .from('shop_products')
        .select('id, name, price_krw, stock, images, is_active')
        .in('id', items.map(i => i.productId));

    if (productError) {
        console.error('[Shop] createShopOrder products:', productError.message);
        return { error: '상품 정보를 불러오지 못했습니다.' };
    }

    const lines = [];
    for (const item of items) {
        const product = products?.find(p => p.id === item.productId);
        if (!product || !product.is_active) return { error: '판매가 종료된 상품이 포함되어 있습니다.' };
        if (product.stock < item.quantity) return { error: `'${product.name}' 재고가 부족합니다. (남은 수량 ${product.stock}개)` };
        lines.push({ product, quantity: item.quantity });
    }

    const itemsAmount = lines.reduce((sum, l) => sum + l.product.price_krw * l.quantity, 0);
    const shippingFee = calcShippingFee(itemsAmount);
    const totalAmount = itemsAmount + shippingFee;

    const { data: order, error: orderError } = await admin
        .from('shop_orders')
        .insert({
            order_no: generateOrderNo(),
            user_id: user.id,
            items_amount: itemsAmount,
            shipping_fee: shippingFee,
            total_amount: totalAmount,
            recipient_name: shipping.recipientName.trim(),
            recipient_phone: shipping.phone.trim(),
            postcode: shipping.postcode.trim(),
            address: shipping.address.trim(),
            address_detail: shipping.addressDetail?.trim() || null,
            delivery_memo: shipping.memo?.trim() || null,
        })
        .select('id, order_no')
        .single();

    if (orderError || !order) {
        console.error('[Shop] createShopOrder insert:', orderError?.message);
        return { error: '주문을 만들지 못했습니다.' };
    }

    const { error: itemsError } = await admin.from('shop_order_items').insert(
        lines.map(l => ({
            order_id: order.id,
            product_id: l.product.id,
            product_name: l.product.name,
            product_image: l.product.images?.[0] ?? null,
            unit_price: l.product.price_krw,
            quantity: l.quantity,
        })),
    );

    if (itemsError) {
        console.error('[Shop] createShopOrder items:', itemsError.message);
        await admin.from('shop_orders').delete().eq('id', order.id);
        return { error: '주문을 만들지 못했습니다.' };
    }

    const first = lines[0].product.name;
    return {
        orderId: order.id,
        orderNo: order.order_no,
        amount: totalAmount,
        orderName: lines.length > 1 ? `${first} 외 ${lines.length - 1}건` : first,
    };
}

/** 결제창 완료 후 호출: 본인 주문인지 확인하고 결제를 검증해 주문을 확정한다 */
export async function confirmShopPayment(
    orderId: string,
    paymentId: string,
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    // RLS로 본인 주문만 조회된다
    const { data: order } = await supabase
        .from('shop_orders')
        .select('id')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .maybeSingle();
    if (!order) return { success: false, error: '주문을 찾을 수 없습니다.' };

    const result = await settleShopPayment(paymentId, orderId);
    if (result.ok) {
        revalidatePath('/[locale]/shop', 'layout');
        return { success: true };
    }
    return { success: false, error: result.message };
}

/** 결제 대기 주문은 고객에게 의미가 없으므로 제외한다 */
export async function getMyShopOrders(): Promise<ShopOrder[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('shop_orders')
        .select('*, shop_order_items(*)')
        .eq('user_id', user.id)
        .neq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[Shop] getMyShopOrders:', error.message);
        return [];
    }
    return data as ShopOrder[];
}
