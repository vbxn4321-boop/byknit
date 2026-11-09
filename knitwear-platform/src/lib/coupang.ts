import catalog from '@/data/coupangCatalog.json';

// 쿠팡 API는 시간당 호출 한도를 넘기면 파트너스 제재 경고가 오므로, 방문자 요청에서는 호출하지 않고 저장된 목록만 사용한다.
const categories: CoupangCategory[] = catalog;

// 카테고리별로 쿠팡 검색 상위 몇 개를 인기상품에 올릴지. 목록 순서대로 키트가 가장 앞에 온다.
const POPULAR_COUNT: Record<string, number> = {
    'DIY 키트': 16,
    대바늘: 8,
    코바늘: 8,
    뜨개실: 8,
    '부자재·도구': 6,
};

export interface CoupangProduct {
    productId: number;
    productName: string;
    productPrice: number;
    productImage: string;
    productUrl: string;
    isRocket: boolean;
    isFreeShipping: boolean;
}

export interface CoupangCategory {
    name: string;
    products: CoupangProduct[];
}

export interface CoupangCatalog {
    popular: CoupangProduct[];
    categories: CoupangCategory[];
}

export function getCoupangCatalog(): CoupangCatalog {
    return {
        popular: categories.flatMap(category => category.products.slice(0, POPULAR_COUNT[category.name] ?? 0)),
        categories,
    };
}
