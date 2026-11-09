'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COUPANG_DISCLOSURE } from '@/components/ads/CoupangBanner';
import type { CoupangCatalog, CoupangProduct } from '@/lib/coupang';

const ALL = '전체';
const HEADER_HEIGHT = 64;
const AUTO_SLIDE_MS = 3500;

function ProductCard({ product, className = '' }: { product: CoupangProduct; className?: string }) {
    return (
        <a
            href={product.productUrl}
            target="_blank"
            rel="sponsored noopener"
            referrerPolicy="unsafe-url"
            className={`group block ${className}`}
        >
            <div className="aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-tan-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- 쿠팡 이미지는 최적화 서버를 거치지 않고 원본 그대로 사용 */}
                <img
                    src={product.productImage}
                    alt={product.productName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <p className="text-sm font-medium text-brown-700 mt-3 line-clamp-2">{product.productName}</p>
            <p className="text-base font-bold text-brown-700 mt-1">₩{product.productPrice.toLocaleString()}</p>
            {(product.isRocket || product.isFreeShipping) && (
                <p className="flex gap-2 text-xs font-bold mt-1">
                    {product.isRocket && <span className="text-blue-600">로켓배송</span>}
                    {product.isFreeShipping && <span className="text-emerald-600">무료배송</span>}
                </p>
            )}
        </a>
    );
}

// 한 칸씩 이동하고, 양 끝에 닿으면 반대쪽 끝으로 돌아간다.
function slide(scroller: HTMLElement, direction: 1 | -1) {
    const card = scroller.firstElementChild as HTMLElement | null;
    if (!card) return;

    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    const atStart = scroller.scrollLeft <= 2;
    if (direction === 1 && atEnd) {
        scroller.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === -1 && atStart) {
        scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' });
    } else {
        const step = card.offsetWidth + parseFloat(getComputedStyle(scroller).columnGap);
        scroller.scrollBy({ left: direction * step, behavior: 'smooth' });
    }
}

function PopularCarousel({ products }: { products: CoupangProduct[] }) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const timer = setInterval(() => {
            if (!pausedRef.current && scrollerRef.current) slide(scrollerRef.current, 1);
        }, AUTO_SLIDE_MS);
        return () => clearInterval(timer);
    }, []);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };
    const arrowClass = 'w-9 h-9 rounded-full bg-white border border-tan-200 text-brown-700 flex items-center justify-center hover:bg-cream-100 transition-colors';

    return (
        <section className="mb-12" onMouseEnter={pause} onMouseLeave={resume} onTouchStart={pause} onTouchEnd={resume} onFocus={pause} onBlur={resume}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brown-700">인기상품</h2>
                <div className="flex gap-2">
                    <button type="button" aria-label="이전 상품" className={arrowClass} onClick={() => scrollerRef.current && slide(scrollerRef.current, -1)}>
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" aria-label="다음 상품" className={arrowClass} onClick={() => scrollerRef.current && slide(scrollerRef.current, 1)}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
            {/* 폰 2칸, 그 이상 4칸이 보이도록 칸 너비를 간격만큼 뺀 값으로 계산 */}
            <div
                ref={scrollerRef}
                className="grid grid-flow-col gap-4 md:gap-6 auto-cols-[calc(50%-8px)] md:auto-cols-[calc(25%-18px)] overflow-x-auto snap-x snap-proximity [scrollbar-width:none]"
            >
                {products.map(product => (
                    <ProductCard key={product.productId} product={product} className="snap-start" />
                ))}
            </div>
        </section>
    );
}

export function CoupangProductList({ popular, categories }: CoupangCatalog) {
    const [selected, setSelected] = useState(ALL);
    const listRef = useRef<HTMLDivElement>(null);

    // 인기상품은 바로 위에 이미 보이므로 전체 탭에서는 반복하지 않는다.
    const popularIds = new Set(popular.map(p => p.productId));
    const products = selected === ALL
        ? categories.flatMap(c => c.products).filter(p => !popularIds.has(p.productId))
        : categories.find(c => c.name === selected)?.products ?? [];

    const selectCategory = (name: string) => {
        setSelected(name);
        // 목록을 내려본 상태에서 탭을 바꾸면 새 카테고리의 처음부터 보이게 한다.
        const list = listRef.current;
        if (list && list.getBoundingClientRect().top < HEADER_HEIGHT) list.scrollIntoView();
    };

    const tabClass = (active: boolean) =>
        `shrink-0 -mb-px py-3 border-b-2 text-[15px] whitespace-nowrap transition-colors ${active ? 'border-rose-500 font-bold text-brown-700' : 'border-transparent font-medium text-brown-600 hover:text-brown-700'}`;

    return (
        <>
            <p className="text-[11px] text-brown-600 mb-6">{COUPANG_DISCLOSURE}</p>

            {popular.length > 0 && <PopularCarousel products={popular} />}

            <div ref={listRef} className="scroll-mt-16">
                <div className="sticky top-16 z-40 bg-cream-50/95 backdrop-blur-sm border-b border-tan-200 mb-6 flex gap-6 overflow-x-auto [scrollbar-width:none]">
                    {[ALL, ...categories.map(c => c.name)].map(name => (
                        <button key={name} type="button" onClick={() => selectCategory(name)} className={tabClass(selected === name)}>
                            {name}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map(product => (
                        <ProductCard key={product.productId} product={product} />
                    ))}
                </div>
            </div>
        </>
    );
}
