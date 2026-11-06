-- 뜨개 도구 샵: 관리자가 등록한 실물 상품 판매 (상품 / 주문 / 주문 품목)
-- 주문 생성과 상태 변경은 서버(service role)만 수행한다. 클라이언트는 읽기만 가능.

-- 1. 관리자 판별 헬퍼 (20261106_seller_approval.sql 과 동일한 정의)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 2. 상품
CREATE TABLE IF NOT EXISTS public.shop_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  category text NOT NULL DEFAULT 'etc',
  summary text,
  description text,
  price_krw integer NOT NULL CHECK (price_krw >= 100),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_products_active ON public.shop_products (is_active, created_at DESC);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active shop products" ON public.shop_products;
CREATE POLICY "Anyone can view active shop products"
  ON public.shop_products FOR SELECT
  USING (is_active OR public.is_admin());

-- 3. 주문
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_no text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- 결제 대기
    'paid',             -- 결제 완료
    'preparing',        -- 배송 준비중
    'shipped',          -- 배송중
    'delivered',        -- 배송 완료
    'cancelled',        -- 취소 (재고 차감 전 취소, 자동 환불 완료 포함)
    'refunded',         -- 결제 후 환불 완료 (재고 복구됨)
    'refund_required'   -- 자동 환불 실패: 관리자가 직접 환불해야 함
  )),
  items_amount integer NOT NULL CHECK (items_amount >= 0),
  shipping_fee integer NOT NULL CHECK (shipping_fee >= 0),
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  postcode text NOT NULL,
  address text NOT NULL,
  address_detail text,
  delivery_memo text,
  transaction_id text UNIQUE,
  courier text,
  tracking_number text,
  cancel_reason text,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON public.shop_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders (status, created_at DESC);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shop orders" ON public.shop_orders;
CREATE POLICY "Users can view own shop orders"
  ON public.shop_orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- 4. 주문 품목 (상품이 바뀌어도 주문 내역이 유지되도록 이름/가격을 복사해 둔다)
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.shop_products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON public.shop_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_product ON public.shop_order_items (product_id);

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shop order items" ON public.shop_order_items;
CREATE POLICY "Users can view own shop order items"
  ON public.shop_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_orders o
      WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_admin())
    )
  );

-- 5. 결제 확정: 재고 차감과 상태 변경을 한 트랜잭션으로 처리한다.
--    클라이언트 콜백과 웹훅이 동시에 호출해도 한 번만 반영된다.
CREATE OR REPLACE FUNCTION public.finalize_shop_order(
  p_order_id uuid,
  p_payment_id text,
  p_paid_amount integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.shop_orders%ROWTYPE;
  v_item record;
BEGIN
  SELECT * INTO v_order FROM public.shop_orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_order.transaction_id = p_payment_id
     AND v_order.status IN ('paid', 'preparing', 'shipped', 'delivered') THEN
    RETURN 'already_paid';
  END IF;

  IF v_order.status <> 'pending' THEN
    RETURN 'invalid_status';
  END IF;

  IF v_order.total_amount <> p_paid_amount THEN
    RETURN 'amount_mismatch';
  END IF;

  BEGIN
    -- 동시 주문 간 교착을 막기 위해 항상 같은 순서로 잠근다
    FOR v_item IN
      SELECT product_id, quantity FROM public.shop_order_items
      WHERE order_id = p_order_id
      ORDER BY product_id
    LOOP
      UPDATE public.shop_products
      SET stock = stock - v_item.quantity, updated_at = now()
      WHERE id = v_item.product_id AND stock >= v_item.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'out_of_stock' USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    UPDATE public.shop_orders
    SET status = 'paid', transaction_id = p_payment_id, paid_at = now(), updated_at = now()
    WHERE id = p_order_id;
  EXCEPTION
    WHEN raise_exception THEN
      RETURN 'out_of_stock'; -- 위 블록의 재고 차감은 모두 되돌려진다
    WHEN unique_violation THEN
      RETURN 'payment_reused'; -- 이미 다른 주문에 쓰인 결제
  END;

  RETURN 'paid';
END;
$$;

-- 6. 주문 취소/환불 반영: 재고가 차감된 주문만 재고를 복구한다. 중복 호출에 안전하다.
CREATE OR REPLACE FUNCTION public.cancel_shop_order(
  p_order_id uuid,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_item record;
BEGIN
  SELECT status INTO v_status FROM public.shop_orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_status IN ('cancelled', 'refunded') THEN
    RETURN 'already_cancelled';
  END IF;

  IF v_status IN ('paid', 'preparing', 'shipped', 'delivered') THEN
    FOR v_item IN
      SELECT product_id, quantity FROM public.shop_order_items
      WHERE order_id = p_order_id AND product_id IS NOT NULL
      ORDER BY product_id
    LOOP
      UPDATE public.shop_products
      SET stock = stock + v_item.quantity, updated_at = now()
      WHERE id = v_item.product_id;
    END LOOP;

    UPDATE public.shop_orders
    SET status = 'refunded', cancel_reason = p_reason, updated_at = now()
    WHERE id = p_order_id;
    RETURN 'refunded';
  END IF;

  -- pending, refund_required: 재고가 차감된 적이 없다
  UPDATE public.shop_orders
  SET status = 'cancelled', cancel_reason = p_reason, updated_at = now()
  WHERE id = p_order_id;
  RETURN 'cancelled';
END;
$$;

-- 위 함수는 재고와 주문 상태를 직접 바꾸므로 서버(service role)만 호출할 수 있다
REVOKE ALL ON FUNCTION public.finalize_shop_order(uuid, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_shop_order(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_shop_order(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_shop_order(uuid, text) TO service_role;

-- 7. 상품 이미지 버킷 (누구나 조회, 관리자만 업로드)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-products',
  'shop-products',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view shop product images" ON storage.objects;
CREATE POLICY "Public can view shop product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-products');

DROP POLICY IF EXISTS "Admins can upload shop product images" ON storage.objects;
CREATE POLICY "Admins can upload shop product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shop-products' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete shop product images" ON storage.objects;
CREATE POLICY "Admins can delete shop product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shop-products' AND public.is_admin());
