'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGaugeStore } from '@/stores/useGaugeStore';
import { calcStitches, calcRows, stitchesToCm, rowsToCm } from '@/utils/knittingMath';
import { ResultCard } from '../ResultCard';


export function BasicConverterTab() {
    const t = useTranslations('calculator'); // Using 'calculator' namespace for common gauge terms
    const tBasic = useTranslations('calculator.basic');

    const { stitchGauge, rowGauge, unit, setGauge, setUnit } = useGaugeStore();

    // Local State for Gauge Input
    const [localStitch, setLocalStitch] = useState<number>(0);
    const [localRow, setLocalRow] = useState<number>(0);
    const [showApplied, setShowApplied] = useState(false);

    // Sync local state from store on mount
    useEffect(() => {
        if (stitchGauge > 0) setLocalStitch(stitchGauge);
        if (rowGauge > 0) setLocalRow(rowGauge);
    }, [stitchGauge, rowGauge]);

    const hasChanges = localStitch !== stitchGauge || localRow !== rowGauge;
    const canApply = localStitch > 0 && localRow > 0;

    const handleApplyGauge = () => {
        if (canApply) {
            setGauge(localStitch, localRow);
            setShowApplied(true);
            setTimeout(() => setShowApplied(false), 2000);
        }
    };

    // Converter State
    const [mode, setMode] = useState<'cmToSt' | 'stToCm'>('cmToSt');
    const [widthValue, setWidthValue] = useState<number>(0);
    const [heightValue, setHeightValue] = useState<number>(0);

    const results = mode === 'cmToSt'
        ? [
            { label: tBasic('stitches'), value: widthValue > 0 ? calcStitches(widthValue, stitchGauge) : 0, unit: tBasic('st') },
            { label: tBasic('rows'), value: heightValue > 0 ? calcRows(heightValue, rowGauge) : 0, unit: tBasic('row') },
        ]
        : [
            { label: tBasic('widthCm'), value: widthValue > 0 ? stitchesToCm(widthValue, stitchGauge).toFixed(1) : '0', unit: unit },
            { label: tBasic('heightCm'), value: heightValue > 0 ? rowsToCm(heightValue, rowGauge).toFixed(1) : '0', unit: unit },
        ];

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <p className="text-stone-500">{tBasic('description')}</p>
            </div>

            {/* Integrated Gauge Settings */}
            <div className="bg-white p-6 rounded-2xl border border-tan-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-tan-100 pb-4">
                    <h2 className="font-bold text-brown-700">{t('gaugeBar.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Stitch Gauge */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase tracking-wide">
                            {t('gaugeBar.stitches')}
                        </label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-stone-50 focus-within:bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                            <input
                                type="number"
                                value={localStitch || ''}
                                onChange={(e) => setLocalStitch(Number(e.target.value) || 0)}
                                placeholder="22"
                                className="w-full bg-transparent text-brown-700 font-bold text-lg focus:outline-none placeholder:text-stone-300"
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">/{unit === 'cm' ? '10cm' : '4inch'}</span>
                        </div>
                    </div>

                    {/* Row Gauge */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase tracking-wide">
                            {t('gaugeBar.rows')}
                        </label>
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-stone-50 focus-within:bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                            <input
                                type="number"
                                value={localRow || ''}
                                onChange={(e) => setLocalRow(Number(e.target.value) || 0)}
                                placeholder="30"
                                className="w-full bg-transparent text-brown-700 font-bold text-lg focus:outline-none placeholder:text-stone-300"
                            />
                            <span className="text-xs text-stone-400 whitespace-nowrap">/{unit === 'cm' ? '10cm' : '4inch'}</span>
                        </div>
                    </div>

                    {/* Unit Switcher */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase tracking-wide">
                            {t('gaugeBar.unit')}
                        </label>
                        <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200 w-full">
                            <button
                                onClick={() => setUnit('cm')}
                                className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${unit === 'cm'
                                    ? 'bg-white text-brown-700 shadow-soft'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                cm
                            </button>
                            <button
                                onClick={() => setUnit('inch')}
                                className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${unit === 'inch'
                                    ? 'bg-white text-brown-700 shadow-soft'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                inch
                            </button>
                        </div>
                    </div>

                    {/* Apply Button */}
                    <div className="relative">
                        <button
                            onClick={handleApplyGauge}
                            disabled={!canApply}
                            className={`w-full p-3.5 rounded-xl font-bold transition-all shadow-sm ${showApplied
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
                                    {t('gaugeBar.applied', { fallback: '적용됨' })}
                                </span>
                            ) : (
                                t('gaugeBar.apply', { fallback: '적용하기' })
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex justify-center pt-8 border-t border-tan-200">
                <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                    <button
                        onClick={() => setMode('cmToSt')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${mode === 'cmToSt'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {unit} → {tBasic('stitches')}
                    </button>
                    <button
                        onClick={() => setMode('stToCm')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${mode === 'stToCm'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {tBasic('stitches')} → {unit}
                    </button>
                </div>
            </div>

            {/* Two Input Fields: Width and Height */}
            <div className="max-w-xl mx-auto">
                <div className="grid grid-cols-2 gap-8">
                    {/* Width Input */}
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-2">
                            {mode === 'cmToSt' ? tBasic('inputWidth') : tBasic('inputWidthSt')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={widthValue || ''}
                                onChange={(e) => setWidthValue(Number(e.target.value) || 0)}
                                placeholder={mode === 'cmToSt' ? '25' : '55'}
                                className="w-full p-4 rounded-xl border border-tan-200 text-center text-2xl font-bold text-brown-700 bg-white placeholder:text-stone-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 min-w-0"
                            />
                            <span className="text-sm text-stone-400 font-medium whitespace-nowrap">
                                {mode === 'cmToSt' ? unit : tBasic('st')}
                            </span>
                        </div>
                    </div>

                    {/* Height Input */}
                    <div>
                        <label className="block text-sm font-medium text-stone-600 mb-2">
                            {mode === 'cmToSt' ? tBasic('inputHeight') : tBasic('inputHeightRow')}
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={heightValue || ''}
                                onChange={(e) => setHeightValue(Number(e.target.value) || 0)}
                                placeholder={mode === 'cmToSt' ? '30' : '80'}
                                className="w-full p-4 rounded-xl border border-tan-200 text-center text-2xl font-bold text-brown-700 bg-white placeholder:text-stone-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 min-w-0"
                            />
                            <span className="text-sm text-stone-400 font-medium whitespace-nowrap">
                                {mode === 'cmToSt' ? unit : tBasic('row')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result or Warning Guide */}
            {stitchGauge > 0 && rowGauge > 0 ? (
                <ResultCard title={tBasic('result')} results={results} hideIcon={true} />
            ) : (
                <div className="max-w-xl mx-auto p-5 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-soft flex items-start gap-3 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-lg shrink-0">
                        ⚠️
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-extrabold text-amber-800 text-sm">
                            {t('emptyState.title')}
                        </h4>
                        <p className="text-xs text-amber-600 leading-relaxed">
                            {t('emptyState.description')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
