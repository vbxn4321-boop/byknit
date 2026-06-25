'use client';

import { Pattern } from '@/types';
import { Ruler, Scissors, Box, Layers, FileText, Calendar } from 'lucide-react';

interface ProductInfoTableProps {
    pattern: Pattern;
    locale: string;
}

export function ProductInfoTable({ pattern, locale }: ProductInfoTableProps) {
    const tLabel = (key: string) => {
        // Simple mapping for labels if not using full next-intl inside this sub-component for simplicity
        // or pass t function as prop. For now, hardcoded mapping or basic switch.
        const labels: Record<string, { en: string, ko: string }> = {
            category: { en: 'Category', ko: '카테고리' },
            type: { en: 'Type', ko: '구분' }, // Craft type (Knitting/Crochet)
            size: { en: 'Size', ko: '사이즈' },
            gauge: { en: 'Gauge', ko: '게이지' },
            needles: { en: 'Needles', ko: '사용 바늘' },
            yarn: { en: 'Yarn', ko: '실 소요량' }, // Simplification for yarn info
            pages: { en: 'Pages', ko: '도안 페이지 수' },
            date: { en: 'Date', ko: '등록일' },
            technique: { en: 'Technique', ko: '기법' },
        };
        return labels[key]?.[locale as 'en' | 'ko'] || key;
    };

    const getValue = (key: string) => {
        const meta = pattern.content?.metadata || {};
        switch (key) {
            case 'category':
                return pattern.category || '-';
            case 'type':
                return (meta.craft_type as string) || 'Knitting';
            case 'size':
                const sizeParts = (meta.sizeParts as any[]);
                if (sizeParts && Array.isArray(sizeParts) && sizeParts.length > 0) {
                    return (
                        <div className="flex flex-col gap-2">
                            {sizeParts.map((part, idx) => (
                                <div key={idx} className="flex flex-col text-xs bg-white/50 p-2 rounded-lg border border-tan-100">
                                    <div className="font-bold text-brown-700">{part.name || `Size ${idx + 1}`}</div>
                                    <div className="text-brown-600">
                                        {part.detail}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }

                // Legacy fallback
                if (meta.size) return meta.size;
                if (meta.sizes) return typeof meta.sizes === 'string' ? meta.sizes : (meta.sizes[locale as 'en' | 'ko'] || meta.sizes.en || '-');
                if (!pattern.sizes) return '-';
                return typeof pattern.sizes === 'string' ? pattern.sizes : (pattern.sizes[locale as 'en' | 'ko'] || pattern.sizes.en || '-');
            case 'gauge':
                if (meta.gauge) return meta.gauge;
                if (typeof pattern.gauge === 'string') return pattern.gauge;
                if (pattern.gauge_stitches && pattern.gauge_rows) return `${pattern.gauge_stitches} sts x ${pattern.gauge_rows} rows`;
                return '-';
            case 'needles':
                if (meta.needles) return meta.needles;
                if (pattern.needles) return pattern.needles;
                if (pattern.needle_size_mm && pattern.needle_size_mm.length > 0) return `${pattern.needle_size_mm.join(', ')} mm`;
                return '-';
            case 'yarn':
                const yarnParts = (meta.yarnParts as any[]);
                if (yarnParts && Array.isArray(yarnParts) && yarnParts.length > 0) {
                    return (
                        <div className="flex flex-col gap-2">
                            {yarnParts.map((part, idx) => (
                                <div key={idx} className="flex flex-col text-xs bg-white/50 p-2 rounded-lg border border-tan-100">
                                    <div className="font-bold text-brown-700">{part.partName || `Part ${idx + 1}`}</div>
                                    <div className="text-brown-600">
                                        {part.yarnName && <span className="mr-2">🧶 {part.yarnName}</span>}
                                        {part.amount && <span className="mr-2">⚖️ {part.amount}</span>}
                                    </div>
                                    <div className="text-brown-500 text-[10px]">
                                        {part.needle && <span className="mr-2">🪡 {part.needle}</span>}
                                        {part.gauge && <span>📏 {part.gauge}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }

                // Legacy fallback
                if (meta.yarn) return meta.yarn;
                const yardage = (meta.yardage as string) || '';
                const weight = Array.isArray(pattern.yarn_weight)
                    ? pattern.yarn_weight.join(', ')
                    : (typeof pattern.yarn_weight === 'string' ? pattern.yarn_weight : '');

                const legacyInfo = [weight, yardage].filter(Boolean).join(' / ');
                return legacyInfo || '-';
            case 'pages':
                return 'PDF';
            case 'date':
                return new Date(pattern.created_at).toLocaleDateString();
            case 'technique':
                if (meta.technique) return meta.technique;
                return pattern.techniques?.join(', ') || ((meta.subcategory as string) || 'Basic');
            default: return '-';
        }
    };

    const rows = [
        { key: 'category', icon: Box },
        { key: 'type', icon: Scissors },
        { key: 'size', icon: Ruler },
        { key: 'gauge', icon: Layers },
        { key: 'technique', icon: FileText },
        { key: 'needles', icon: Box },
        { key: 'yarn', icon: Layers },
        { key: 'pages', icon: FileText },
        { key: 'date', icon: Calendar },
    ];

    return (
        <div className="bg-cream-50/50 rounded-xl overflow-hidden border border-tan-100">
            {rows.map((row) => (
                <div key={row.key} className="flex border-b border-tan-100 last:border-0 text-sm">
                    <div className="w-32 bg-cream-100/50 p-3 font-bold text-brown-700 flex items-center gap-2">
                        {/* <row.icon size={14} className="text-brown-400" /> */}
                        {tLabel(row.key)}
                    </div>
                    <div className="flex-1 p-3 text-brown-600 font-medium">
                        {getValue(row.key)}
                    </div>
                </div>
            ))}
        </div>
    );
}
