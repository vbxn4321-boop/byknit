'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export function GaugeConverterTab() {
    const t = useTranslations('calculator.patternConverter');

    // Pattern Gauge State
    const [patternStitchGauge, setPatternStitchGauge] = useState<number>(0);
    const [patternRowGauge, setPatternRowGauge] = useState<number>(0);

    // My Gauge State (Manual Input)
    const [myStitchGauge, setMyStitchGauge] = useState<number>(0);
    const [myRowGauge, setMyRowGauge] = useState<number>(0);

    // Conversion Input State
    const [targetStitches, setTargetStitches] = useState<number>(0);
    const [targetRows, setTargetRows] = useState<number>(0);

    // Result State
    const [resultStitches, setResultStitches] = useState<number>(0);
    const [resultRows, setResultRows] = useState<number>(0);

    // Unified Calculation
    const handleConvert = () => {
        // Calculate Stitches
        if (patternStitchGauge && myStitchGauge && targetStitches) {
            const stResult = (targetStitches / patternStitchGauge) * myStitchGauge;
            setResultStitches(stResult);
        } else {
            setResultStitches(0);
        }

        // Calculate Rows
        if (patternRowGauge && myRowGauge && targetRows) {
            const rowResult = (targetRows / patternRowGauge) * myRowGauge;
            setResultRows(rowResult);
        } else {
            setResultRows(0);
        }
    };

    // Calculate Gauge Difference
    const stitchDiff = myStitchGauge - patternStitchGauge;
    const rowDiff = myRowGauge - patternRowGauge;

    const formatDiff = (diff: number) => {
        if (!patternStitchGauge || !myStitchGauge) return '-';
        return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-brown-700">{t('title')}</h3>
                <p className="text-stone-500 max-w-lg mx-auto">{t('description')}</p>
            </div>

            {/* Gauge Comparison Section */}
            <div>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Pattern Gauge Input */}
                    <div className="bg-white p-6 rounded-2xl border border-tan-200 shadow-sm h-full">
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="font-bold text-stone-700">{t('patternGauge')}</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">{t('stitches')}</label>
                                <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <input
                                        type="number"
                                        value={patternStitchGauge || ''}
                                        onChange={(e) => setPatternStitchGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-stone-700 focus:outline-none"
                                        placeholder={t('example22')}
                                    />
                                    <span className="text-xs text-stone-400 whitespace-nowrap">/10cm</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">{t('rows')}</label>
                                <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <input
                                        type="number"
                                        value={patternRowGauge || ''}
                                        onChange={(e) => setPatternRowGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-stone-700 focus:outline-none"
                                        placeholder={t('example30')}
                                    />
                                    <span className="text-xs text-stone-400 whitespace-nowrap">/10cm</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Gauge Input (Manual) */}
                    <div className="bg-white p-6 rounded-2xl border border-tan-200 shadow-sm h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h4 className="font-bold text-brown-700">{t('myGauge')}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-rose-400 mb-1">{t('stitches')}</label>
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                        <input
                                            type="number"
                                            value={myStitchGauge || ''}
                                            onChange={(e) => setMyStitchGauge(Number(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center font-bold text-brown-700 focus:outline-none"
                                            placeholder={t('example20')}
                                        />
                                        <span className="text-xs text-rose-400 whitespace-nowrap">/10cm</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-rose-400 mb-1">{t('rows')}</label>
                                    <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                        <input
                                            type="number"
                                            value={myRowGauge || ''}
                                            onChange={(e) => setMyRowGauge(Number(e.target.value) || 0)}
                                            className="w-full bg-transparent text-center font-bold text-brown-700 focus:outline-none"
                                            placeholder={t('example28')}
                                        />
                                        <span className="text-xs text-rose-400 whitespace-nowrap">/10cm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gauge Difference Display (Inside My Gauge Box) */}
                        {(patternStitchGauge > 0 && myStitchGauge > 0) && (
                            <div className="mt-4 pt-4 border-t border-rose-100 flex justify-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${stitchDiff === 0
                                    ? 'bg-stone-100 text-stone-500'
                                    : stitchDiff > 0
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-rose-50 text-rose-600'
                                    }`}>
                                    {t('stitchDiff')}: {formatDiff(stitchDiff)}
                                </div>
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${rowDiff === 0
                                    ? 'bg-stone-100 text-stone-500'
                                    : rowDiff > 0
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-rose-50 text-rose-600'
                                    }`}>
                                    {t('rowDiff')}: {formatDiff(rowDiff)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px bg-tan-200" />

            {/* Unified Converter Box */}
            <div className="space-y-4">
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-tan-200 shadow-soft">
                    {/* Stitch Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-stone-600 mb-2">{t('patternStitches')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={targetStitches || ''}
                                    onChange={(e) => setTargetStitches(Number(e.target.value) || 0)}
                                    placeholder={t('example100')}
                                    className="w-full p-4 rounded-xl border border-tan-200 text-center text-xl font-bold text-brown-700 placeholder:text-base placeholder:text-stone-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">{t('st')}</span>
                            </div>
                        </div>

                        <div className="text-rose-300 pt-6 transform rotate-90 md:rotate-0">
                            <ArrowRight className="w-8 h-8" />
                        </div>

                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-emerald-600 mb-2">{t('myStitches')}</label>
                            <div className="relative">
                                <div className={`w-full p-4 rounded-xl border text-center text-xl font-bold transition-all ${resultStitches > 0
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner'
                                    : 'bg-stone-50 border-stone-200 text-stone-400'
                                    }`}>
                                    {resultStitches > 0 ? resultStitches.toFixed(1) : '-'}
                                </div>
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${resultStitches > 0 ? 'text-emerald-500' : 'text-stone-400'
                                    }`}>{t('st')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-stone-100 mb-8" />

                    {/* Row Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-stone-600 mb-2">{t('patternRows')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={targetRows || ''}
                                    onChange={(e) => setTargetRows(Number(e.target.value) || 0)}
                                    placeholder={t('example100')}
                                    className="w-full p-4 rounded-xl border border-tan-200 text-center text-xl font-bold text-brown-700 placeholder:text-base placeholder:text-stone-300 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">{t('row')}</span>
                            </div>
                        </div>

                        <div className="text-rose-300 pt-6 transform rotate-90 md:rotate-0">
                            <ArrowRight className="w-8 h-8" />
                        </div>

                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-emerald-600 mb-2">{t('myRows')}</label>
                            <div className="relative">
                                <div className={`w-full p-4 rounded-xl border text-center text-xl font-bold transition-all ${resultRows > 0
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner'
                                    : 'bg-stone-50 border-stone-200 text-stone-400'
                                    }`}>
                                    {resultRows > 0 ? resultRows.toFixed(1) : '-'}
                                </div>
                                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm ${resultRows > 0 ? 'text-emerald-500' : 'text-stone-400'
                                    }`}>{t('row')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Convert Button */}
                <button
                    onClick={handleConvert}
                    className="w-full py-4 bg-gradient-to-r from-rose-400 to-peach-300 text-white font-bold text-lg rounded-2xl transition-all shadow-soft hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {t('convert')}
                </button>
            </div>
        </div>
    );
}
