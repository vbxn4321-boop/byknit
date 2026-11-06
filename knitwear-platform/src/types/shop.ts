export interface ShopProduct {
    id: string;
    name: string;
    category: string;
    summary: string | null;
    description: string | null;
    price_krw: number;
    stock: number;
    images: string[];
    is_active: boolean;
    created_at: string;
}

export interface ShopOrderItem {
    id: string;
    product_id: string | null;
    product_name: string;
    product_image: string | null;
    unit_price: number;
    quantity: number;
}

export interface ShopOrder {
    id: string;
    order_no: string;
    user_id: string;
    status: string;
    items_amount: number;
    shipping_fee: number;
    total_amount: number;
    recipient_name: string;
    recipient_phone: string;
    postcode: string;
    address: string;
    address_detail: string | null;
    delivery_memo: string | null;
    transaction_id: string | null;
    courier: string | null;
    tracking_number: string | null;
    cancel_reason: string | null;
    paid_at: string | null;
    shipped_at: string | null;
    created_at: string;
    shop_order_items: ShopOrderItem[];
}

export interface ShopShippingInput {
    recipientName: string;
    phone: string;
    postcode: string;
    address: string;
    addressDetail?: string;
    memo?: string;
}

export interface ShopProductInput {
    id?: string;
    name: string;
    category: string;
    summary?: string;
    description?: string;
    priceKrw: number;
    stock: number;
    images: string[];
    isActive: boolean;
}
