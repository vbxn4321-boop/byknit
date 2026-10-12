// 도안 가격 판정의 단일 기준.
// 서버(결제 검증/다운로드 권한)와 동일하게 price_krw를 우선 사용하고,
// 없거나 0이면 price_usd(구형 데이터)를 환산해 사용한다. is_free 플래그는 신뢰하지 않는다.
const USD_TO_KRW = 1450;

export interface PricedPattern {
    price_krw?: number | string | null;
    price_usd?: number | string | null;
}

export function getPriceKrw(p: PricedPattern | null | undefined): number {
    if (!p) return 0;
    const krw = Number(p.price_krw) || 0;
    if (krw > 0) return krw;
    return Math.round((Number(p.price_usd) || 0) * USD_TO_KRW);
}

export function isFreePattern(p: PricedPattern | null | undefined): boolean {
    return getPriceKrw(p) <= 0;
}
