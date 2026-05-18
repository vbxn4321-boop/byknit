'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Calculator } from 'lucide-react';

interface ResultCardProps {
    title: string;
    results: { label: string; value: string | number; unit?: string }[];
    warning?: string | null;
    description?: string | null;
    className?: string;
    hideIcon?: boolean;
}

export function ResultCard({ title, results, warning, description, className = '', hideIcon = false }: ResultCardProps) {
    const t = useTranslations('calculator');
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = results.map(r => `${r.label}: ${r.value}${r.unit || ''}`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`rounded-2xl bg-gradient-to-br from-cream-50 to-white border border-tan-200 shadow-soft overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-cream-100/50 border-b border-tan-100">
                <div className="flex items-center gap-2">
                    {!hideIcon && <Calculator className="w-4 h-4 text-rose-400" />}
                    <h3 className="font-bold text-brown-700">{title}</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-tan-200 text-stone-600 hover:bg-cream-50 hover:border-rose-200 transition-all"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            {t('resultCard.copied')}
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            {t('resultCard.copy')}
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            <div className="p-5 space-y-3">
                {results.map((result, i) => (
                    <div key={i} className="flex items-baseline justify-between">
                        <span className="text-stone-500 text-sm">{result.label}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-brown-700">{result.value}</span>
                            {result.unit && <span className="text-sm text-stone-400">{result.unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Description / Info */}
            {description && (
                <div className="px-5 py-3 bg-stone-50 border-t border-tan-100">
                    <p className="text-sm text-stone-500 flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">ℹ️</span>
                        {description}
                    </p>
                </div>
            )}

            {/* Warning */}
            {warning && (
                <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
                    <p className="text-sm text-amber-700">⚠️ {warning}</p>
                </div>
            )}
        </div>
    );
}
