import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SHOP_MAX_QUANTITY } from '@/constants/shop';

// 실물 상품 전용 장바구니. 도안 장바구니(useCartStore)와 결제 흐름이 달라 분리되어 있다.
// 가격과 재고는 저장하지 않고 화면에 표시할 때 서버에서 다시 가져온다.
export interface ShopCartItem {
    productId: string;
    quantity: number;
}

interface ShopCartState {
    items: ShopCartItem[];
    addItem: (productId: string, quantity: number) => void;
    setQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clear: () => void;
}

const clampQuantity = (quantity: number) => Math.min(SHOP_MAX_QUANTITY, Math.max(1, Math.floor(quantity) || 1));

export const useShopCartStore = create<ShopCartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (productId, quantity) => {
                const existing = get().items.find(i => i.productId === productId);
                if (existing) {
                    get().setQuantity(productId, existing.quantity + quantity);
                } else {
                    set({ items: [...get().items, { productId, quantity: clampQuantity(quantity) }] });
                }
            },
            setQuantity: (productId, quantity) => {
                set({
                    items: get().items.map(i =>
                        i.productId === productId ? { ...i, quantity: clampQuantity(quantity) } : i,
                    ),
                });
            },
            removeItem: productId => {
                set({ items: get().items.filter(i => i.productId !== productId) });
            },
            clear: () => set({ items: [] }),
        }),
        { name: 'byknit-shop-cart' },
    ),
);
