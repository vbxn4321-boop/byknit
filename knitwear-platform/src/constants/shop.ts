// 뜨개 샵 운영 설정. 배송비 정책은 여기서 바꾸면 화면과 결제 금액에 함께 반영된다.
export const SHOP_SHIPPING_FEE = 3000;
export const SHOP_FREE_SHIPPING_OVER = 50000;
export const SHOP_MAX_QUANTITY = 99;

export const SHOP_CATEGORIES = [
    { id: 'needles', ko: '대바늘', en: 'Knitting Needles' },
    { id: 'hooks', ko: '코바늘', en: 'Crochet Hooks' },
    { id: 'notions', ko: '부자재', en: 'Notions' },
    { id: 'tools', ko: '측정·보조 도구', en: 'Tools' },
    { id: 'kits', ko: '세트', en: 'Kits' },
    { id: 'etc', ko: '기타', en: 'Other' },
] as const;

export const SHOP_ORDER_STATUS: Record<string, { ko: string; en: string; className: string }> = {
    pending: { ko: '결제 대기', en: 'Awaiting payment', className: 'bg-stone-100 text-stone-600' },
    paid: { ko: '결제 완료', en: 'Paid', className: 'bg-blue-50 text-blue-700' },
    preparing: { ko: '배송 준비중', en: 'Preparing', className: 'bg-amber-50 text-amber-700' },
    shipped: { ko: '배송중', en: 'Shipped', className: 'bg-indigo-50 text-indigo-700' },
    delivered: { ko: '배송 완료', en: 'Delivered', className: 'bg-emerald-50 text-emerald-700' },
    cancelled: { ko: '주문 취소', en: 'Cancelled', className: 'bg-stone-100 text-stone-500' },
    refunded: { ko: '환불 완료', en: 'Refunded', className: 'bg-rose-50 text-rose-600' },
    refund_required: { ko: '환불 필요', en: 'Refund pending', className: 'bg-red-100 text-red-700' },
};

export function shopCategoryLabel(id: string, locale: string): string {
    const category = SHOP_CATEGORIES.find(c => c.id === id);
    if (!category) return id;
    return locale === 'ko' ? category.ko : category.en;
}

export function calcShippingFee(itemsAmount: number): number {
    if (itemsAmount <= 0) return 0;
    return itemsAmount >= SHOP_FREE_SHIPPING_OVER ? 0 : SHOP_SHIPPING_FEE;
}
