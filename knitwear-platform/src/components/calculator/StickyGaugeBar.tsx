'use client';

import { useState, useEffect } from 'react';
import { useGaugeStore, useIsGaugeSet } from '@/stores/useGaugeStore';
import { useTranslations } from 'next-intl';
import { Ruler, Hash, Gauge, Check } from 'lucide-react';

export function StickyGaugeBar() {
    const t = useTranslations('calculator');
    const { stitchGauge, rowGauge, needleSize, unit, setGauge, setNeedleSize, setUnit } = useGaugeStore();
    const isGaugeApplied = useIsGaugeSet();

    // Local state for inputs (before applying)
    const [localStitch, setLocalStitch] = useState<number>(0);
    const [localRow, setLocalRow] = useState<number>(0);
    const [localNeedle, setLocalNeedle] = useState<number>(4.0);
    const [showApplied, setShowApplied] = useState(false);

    // Sync local state from store on mount/hydration
    useEffect(() => {
        if (stitchGauge > 0) setLocalStitch(stitchGauge);
        if (rowGauge > 0) setLocalRow(rowGauge);
        if (needleSize > 0) setLocalNeedle(needleSize);
    }, [stitchGauge, rowGauge, needleSize]);

    // Check if there are unapplied changes
    const hasChanges = localStitch !== stitchGauge || localRow !== rowGauge || localNeedle !== needleSize;
    const canApply = localStitch > 0 && localRow > 0;

    const handleApply = () => {
        if (canApply) {
            setGauge(localStitch, localRow);
            setNeedleSize(localNeedle);
            setShowApplied(true);
            setTimeout(() => setShowApplied(false), 2000);
        }
    };

    return (
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-tan-200 shadow-soft py-4">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-rose-400" />
                        <h2 className="font-bold text-brown-700">{t('gaugeBar.title')}</h2>
                        <span className="text-xs text-stone-400 ml-2">{t('gaugeBar.subtitle')}</span>
                    </div>
                    {isGaugeApplied && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3" />
                            <span>{t('gaugeBar.applied', { fallback: '적용됨' })}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Stitch Gauge */}
                    <div className="relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                            {t('gaugeBar.stitches')}
                        </label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                            <Hash className="w-4 h-4 text-stone-400" />
                            <input
                                type="number"
                                value={localStitch || ''}
                                onChange={(e) => setLocalStitch(Number(e.target.value) || 0)}
                                placeholder="22"
                                className="w-full bg-transparent text-brown-700 font-bold text-lg focus:outline-none"
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">/10{unit}</span>
                        </div>
                    </div>

                    {/* Row Gauge */}
                    <div className="relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                            {t('gaugeBar.rows')}
                        </label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                            <Ruler className="w-4 h-4 text-stone-400" />
                            <input
                                type="number"
                                value={localRow || ''}
                                onChange={(e) => setLocalRow(Number(e.target.value) || 0)}
                                placeholder="30"
                                className="w-full bg-transparent text-brown-700 font-bold text-lg focus:outline-none"
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">/10{unit}</span>
                        </div>
                    </div>

                    {/* Needle Size */}
                    <div className="relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                            {t('gaugeBar.needle')}
                        </label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                            <input
                                type="number"
                                step="0.5"
                                value={localNeedle || ''}
                                onChange={(e) => setLocalNeedle(Number(e.target.value) || 0)}
                                placeholder="4.0"
                                className="w-full bg-transparent text-brown-700 font-medium focus:outline-none"
                            />
                            <span className="text-xs text-stone-400">mm</span>
                        </div>
                    </div>

                    {/* Unit Switcher */}
                    <div className="relative">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                            {t('gaugeBar.unit')}
                        </label>
                        <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as 'cm' | 'inch')}
                            className="w-full p-3 rounded-xl border border-tan-200 bg-white text-brown-700 font-medium focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer"
                        >
                            <option value="cm">cm</option>
                            <option value="inch">inch</option>
                        </select>
                    </div>

                    {/* Apply Button */}
                    <div className="relative col-span-2 sm:col-span-1">
                        <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-transparent uppercase tracking-wide">
                            &nbsp;
                        </label>
                        <button
                            onClick={handleApply}
                            disabled={!canApply}
                            className={`w-full p-3 rounded-xl font-bold transition-all ${showApplied
                                    ? 'bg-emerald-500 text-white'
                                    : canApply
                                        ? hasChanges
                                            ? 'bg-gradient-to-r from-rose-400 to-peach-300 text-white shadow-soft hover:shadow-md animate-pulse'
                                            : 'bg-gradient-to-r from-rose-400 to-peach-300 text-white shadow-soft hover:shadow-md'
                                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                }`}
                        >
                            {showApplied ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Check className="w-4 h-4" />
                                    {t('gaugeBar.applied', { fallback: '적용됨' })}
                                </span>
                            ) : (
                                t('gaugeBar.apply', { fallback: '적용하기' })
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
