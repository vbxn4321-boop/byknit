'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { calcStitches, calcRows, stitchesToCm } from '@/utils/knittingMath';
import { ResultCard } from '../ResultCard';

export function PatternGraderTab() {
    const t = useTranslations('calculator.grading');
    const ct = useTranslations('calculator.sock'); // Common terms
    const tGauge = useTranslations('calculator.gaugeBar');

    // Mode State: 'basic' | 'advanced'
    const [mode, setMode] = useState<'basic' | 'advanced'>('basic');

    // Unit State: 'cm' | 'inch'
    const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
    const gaugeBase = unit === 'cm' ? 10 : 4; // 10cm or 4 inches

    // Global "My Gauge" State (Only used in Advanced Mode)
    const [myStitchGauge, setMyStitchGauge] = useState<number>(0);
    const [myRowGauge, setMyRowGauge] = useState<number>(0);

    // Width (Stitches) State
    const [widthData, setWidthData] = useState({
        origSize: 50,
        origStitches: 100,
        targetSize: 55,
    });

    // Height (Rows) State
    const [heightData, setHeightData] = useState({
        origSize: 30,
        origRows: 80,
        targetSize: 32,
    });

    // --- Calculation Logic ---

    // 1. Width / Stitch Calculation
    // Derived Original Gauge (Stitches per 10cm) = (Stitches / Size) * 10
    const origStitchGauge = widthData.origSize > 0 ? (widthData.origStitches / widthData.origSize) * 10 : 0;

    // Effective Gauge Selection
    // Basic Mode: Always use proportional (origStitchGauge)
    // Advanced Mode: Use myStitchGauge if provided, else proportional
    const activeStitchGauge = (mode === 'advanced' && myStitchGauge > 0) ? myStitchGauge : origStitchGauge;

    const targetStitches = calcStitches(widthData.targetSize, activeStitchGauge);
    const widthDiff = targetStitches - widthData.origStitches;

    // 2. Height / Row Calculation
    const origRowGauge = heightData.origSize > 0 ? (heightData.origRows / heightData.origSize) * 10 : 0;
    const activeRowGauge = (mode === 'advanced' && myRowGauge > 0) ? myRowGauge : origRowGauge;

    const targetRows = calcRows(heightData.targetSize, activeRowGauge);
    const heightDiff = targetRows - heightData.origRows;

    return (
        <div className="space-y-6">

            {/* Mode Toggle (Matched to YarnSubstituteTab) */}
            <div className="flex justify-center gap-4 flex-wrap">
                <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                    <button
                        onClick={() => setMode('basic')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${mode === 'basic'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {t('modeBasic')}
                    </button>
                    <button
                        onClick={() => setMode('advanced')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${mode === 'advanced'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {t('modeAdvanced')}
                    </button>
                </div>

                {/* Unit Toggle */}
                <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                    <button
                        onClick={() => setUnit('cm')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${unit === 'cm'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        cm
                    </button>
                    <button
                        onClick={() => setUnit('inch')}
                        className={`px-4 py-2 rounded-full font-medium transition-all ${unit === 'inch'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        inch
                    </button>
                </div>
            </div>

            <p className="text-stone-500 text-center text-sm whitespace-pre-line">
                {mode === 'basic' ? t('descBasic') : t('descAdvanced')}
            </p>

            {/* Advanced Mode: Gauge Input Section */}
            {mode === 'advanced' && (
                <div className="bg-[#F9F7F5] p-6 rounded-3xl border border-tan-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-brown-700">{t('myGaugeTitle')}</h3>
                            <p className="text-xs text-stone-500">{t('myGaugeSubtitle')}</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs text-stone-500 font-medium mb-1.5">{tGauge('stitches')}</label>
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-white shadow-sm">
                                <input
                                    type="number"
                                    value={myStitchGauge || ''}
                                    onChange={(e) => setMyStitchGauge(Number(e.target.value))}
                                    className="w-full text-center font-bold text-stone-600 focus:outline-none placeholder:text-stone-300 bg-transparent"
                                    placeholder="20"
                                />
                                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">/{gaugeBase}{unit}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-stone-500 font-medium mb-1.5">{tGauge('rows')}</label>
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-tan-200 bg-white shadow-sm">
                                <input
                                    type="number"
                                    value={myRowGauge || ''}
                                    onChange={(e) => setMyRowGauge(Number(e.target.value))}
                                    className="w-full text-center font-bold text-stone-600 focus:outline-none placeholder:text-stone-300 bg-transparent"
                                    placeholder="28"
                                />
                                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">/{gaugeBase}{unit}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            <div className="grid md:grid-cols-2 gap-6">

                {/* --- Left Column: Width / Stitches --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-brown-700">{t('widthCalc')}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-tan-200 shadow-sm space-y-4">
                        {/* Original Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('origWidth')}</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        value={widthData.origSize}
                                        onChange={(e) => setWidthData({ ...widthData, origSize: Number(e.target.value) })}
                                        className="w-full p-2 bg-stone-50 rounded-lg border border-tan-100 text-center font-bold text-stone-600 focus:outline-none focus:border-tan-300 bg-stone-50"
                                    />
                                    <span className="ml-1 text-xs text-stone-400">{unit}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('origStitchCount')}</label>
                                <input
                                    type="number"
                                    value={widthData.origStitches}
                                    onChange={(e) => setWidthData({ ...widthData, origStitches: Number(e.target.value) })}
                                    className="w-full p-2 bg-stone-50 rounded-lg border border-tan-100 text-center font-bold text-stone-600 focus:outline-none focus:border-tan-300 bg-stone-50"
                                />
                            </div>
                        </div>

                        {/* Original Info Footnote */}
                        <div className="text-right text-xs text-stone-400">
                            {t('origGauge')}: <span className="font-medium text-stone-500">{origStitchGauge.toFixed(1)} {ct('stitches')}</span>
                        </div>

                        <hr className="border-tan-100" />

                        {/* Target Input */}
                        <div>
                            <label className="block text-xs text-rose-400 font-bold mb-1">{t('targetWidth')}</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={widthData.targetSize}
                                    onChange={(e) => setWidthData({ ...widthData, targetSize: Number(e.target.value) })}
                                    className="w-full p-3 bg-rose-50 rounded-xl border border-rose-100 text-center text-xl font-extrabold text-brown-700 focus:outline-none focus:border-rose-300"
                                />
                                <span className="ml-2 text-sm text-rose-400 font-bold">{unit}</span>
                            </div>
                        </div>

                        {/* Result (Replaced with ResultCard) */}
                        <ResultCard
                            title={t('newStitchCount')} // Using translation "New Stitch Count" as title
                            results={[
                                { label: t('newStitchCount'), value: targetStitches, unit: ct('stitches') },
                                { label: t('difference'), value: (widthDiff > 0 ? '+' : '') + widthDiff, unit: ct('stitches') }
                            ]}
                            className="shadow-sm" // Reduced shadow since it's nested
                            hideIcon={true}
                        />
                    </div>
                </div>

                {/* --- Right Column: Height / Rows --- */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-brown-700">{t('heightCalc')}</h3>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-tan-200 shadow-sm space-y-4">
                        {/* Original Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('origHeight')}</label>
                                <div className="flex items-center">
                                    <input
                                        type="number"
                                        value={heightData.origSize}
                                        onChange={(e) => setHeightData({ ...heightData, origSize: Number(e.target.value) })}
                                        className="w-full p-2 bg-stone-50 rounded-lg border border-tan-100 text-center font-bold text-stone-600 focus:outline-none focus:border-tan-300 bg-stone-50"
                                    />
                                    <span className="ml-1 text-xs text-stone-400">{unit}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('origRowCount')}</label>
                                <input
                                    type="number"
                                    value={heightData.origRows}
                                    onChange={(e) => setHeightData({ ...heightData, origRows: Number(e.target.value) })}
                                    className="w-full p-2 bg-stone-50 rounded-lg border border-tan-100 text-center font-bold text-stone-600 focus:outline-none focus:border-tan-300 bg-stone-50"
                                />
                            </div>
                        </div>

                        {/* Original Gauge Display */}
                        <div className="text-right text-xs text-stone-400">
                            {t('origGauge')}: <span className="font-medium text-stone-500">{origRowGauge.toFixed(1)} {ct('rows')}</span>
                        </div>

                        <hr className="border-tan-100" />

                        {/* Target Input */}
                        <div>
                            <label className="block text-xs text-rose-400 font-bold mb-1">{t('targetHeight')}</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    value={heightData.targetSize}
                                    onChange={(e) => setHeightData({ ...heightData, targetSize: Number(e.target.value) })}
                                    className="w-full p-3 bg-rose-50 rounded-xl border border-rose-100 text-center text-xl font-extrabold text-brown-700 focus:outline-none focus:border-rose-300"
                                />
                                <span className="ml-2 text-sm text-rose-400 font-bold">{unit}</span>
                            </div>
                        </div>

                        {/* Result (Replaced with ResultCard) */}
                        <ResultCard
                            title={t('newRowCount')}
                            results={[
                                { label: t('newRowCount'), value: targetRows, unit: ct('rows') },
                                { label: t('difference'), value: (heightDiff > 0 ? '+' : '') + heightDiff, unit: ct('rows') }
                            ]}
                            className="shadow-sm"
                            hideIcon={true}
                        />
                    </div>
                </div>

            </div>
        </div >
    );
}
