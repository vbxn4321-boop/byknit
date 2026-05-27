'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight, Sparkles, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';

export function GaugeConverterTab() {
    const t = useTranslations('calculator.patternConverter');
    const locale = useLocale();

    // Pattern Gauge State
    const [patternStitchGauge, setPatternStitchGauge] = useState<number>(0);
    const [patternRowGauge, setPatternRowGauge] = useState<number>(0);
    const [patternGaugeSize, setPatternGaugeSize] = useState<number>(10); // Default 10cm

    // My Gauge State (Manual Input)
    const [myStitchGauge, setMyStitchGauge] = useState<number>(0);
    const [myRowGauge, setMyRowGauge] = useState<number>(0);
    const [myGaugeSize, setMyGaugeSize] = useState<number>(10); // Default 10cm (Can be modified, e.g., 5cm)

    // Conversion Input State (Pattern specs)
    const [targetStitches, setTargetStitches] = useState<number>(0);
    const [targetRows, setTargetRows] = useState<number>(0);

    // Target Garment Dimension Input (cm)
    const [targetWidth, setTargetWidth] = useState<number>(0);
    const [targetHeight, setTargetHeight] = useState<number>(0);

    // Result States
    const [resultStitches, setResultStitches] = useState<number>(0);
    const [resultRows, setResultRows] = useState<number>(0);
    const [predictedWidth, setPredictedWidth] = useState<number>(0);
    const [predictedHeight, setPredictedHeight] = useState<number>(0);

    const [hasCalculated, setHasCalculated] = useState(false);

    // Unified Calculation Logic with Swap Unit Support
    const handleConvert = () => {
        // 1. Calculate Stitches (with gauge size compensation)
        if (patternStitchGauge && myStitchGauge && targetStitches && patternGaugeSize && myGaugeSize) {
            const stResult = (targetStitches / (patternStitchGauge / patternGaugeSize)) * (myStitchGauge / myGaugeSize);
            setResultStitches(stResult);
        } else {
            setResultStitches(0);
        }

        // 2. Calculate Rows (with gauge size compensation)
        if (patternRowGauge && myRowGauge && targetRows && patternGaugeSize && myGaugeSize) {
            const rowResult = (targetRows / (patternRowGauge / patternGaugeSize)) * (myRowGauge / myGaugeSize);
            setResultRows(rowResult);
        } else {
            setResultRows(0);
        }

        // 3. Predict Finished Garment Size
        if (patternStitchGauge && myStitchGauge && targetWidth && patternGaugeSize && myGaugeSize) {
            const predW = (targetWidth * (patternStitchGauge / patternGaugeSize)) / (myStitchGauge / myGaugeSize);
            setPredictedWidth(predW);
        } else {
            setPredictedWidth(0);
        }

        if (patternRowGauge && myRowGauge && targetHeight && patternGaugeSize && myGaugeSize) {
            const predH = (targetHeight * (patternRowGauge / patternGaugeSize)) / (myRowGauge / myGaugeSize);
            setPredictedHeight(predH);
        } else {
            setPredictedHeight(0);
        }

        setHasCalculated(true);
    };

    // Standardized comparison at 10cm level to calculate stitch/row differences
    const patternStitch10cm = patternGaugeSize > 0 ? (patternStitchGauge / patternGaugeSize) * 10 : 0;
    const myStitch10cm = myGaugeSize > 0 ? (myStitchGauge / myGaugeSize) * 10 : 0;
    const patternRow10cm = patternGaugeSize > 0 ? (patternRowGauge / patternGaugeSize) * 10 : 0;
    const myRow10cm = myGaugeSize > 0 ? (myRowGauge / myGaugeSize) * 10 : 0;

    const stitchDiff = myStitch10cm - patternStitch10cm;
    const rowDiff = myRow10cm - patternRow10cm;

    const formatDiff = (diff: number) => {
        if (!patternStitchGauge || !myStitchGauge) return '-';
        return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
    };

    // Calculate width deviation for recommendations
    const widthDiff = predictedWidth > 0 ? predictedWidth - targetWidth : 0;

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-brown-700">{t('title')}</h3>
                <p className="text-stone-500 max-w-lg mx-auto">{t('description')}</p>
            </div>

            {/* Gauge Input Area (Pattern vs My Swatch) */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Pattern Gauge Box */}
                <div className="bg-white p-6 rounded-2xl border border-tan-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-tan-100 pb-2">
                            <h4 className="font-bold text-stone-700">{t('patternGauge')}</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">{t('gaugeSize')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <input
                                        type="number"
                                        value={patternGaugeSize || ''}
                                        onChange={(e) => setPatternGaugeSize(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-stone-700 focus:outline-none"
                                        placeholder="10"
                                    />
                                    <span className="text-[10px] text-stone-400 font-bold whitespace-nowrap">cm</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">{t('stitches')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <input
                                        type="number"
                                        value={patternStitchGauge || ''}
                                        onChange={(e) => setPatternStitchGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-stone-700 focus:outline-none"
                                        placeholder={t('example22')}
                                    />
                                    <span className="text-xs text-stone-400 whitespace-nowrap">코</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 mb-1">{t('rows')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                                    <input
                                        type="number"
                                        value={patternRowGauge || ''}
                                        onChange={(e) => setPatternRowGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-stone-700 focus:outline-none"
                                        placeholder={t('example30')}
                                    />
                                    <span className="text-xs text-stone-400 whitespace-nowrap">단</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Swatch Gauge Box (Fully compensatory mini-swatch length) */}
                <div className="bg-white p-6 rounded-2xl border border-tan-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-rose-100 pb-2">
                            <h4 className="font-bold text-brown-700">{t('myGauge')}</h4>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-rose-400 mb-1">{t('gaugeSize')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                    <input
                                        type="number"
                                        value={myGaugeSize || ''}
                                        onChange={(e) => setMyGaugeSize(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-brown-700 focus:outline-none"
                                        placeholder="10"
                                    />
                                    <span className="text-[10px] text-rose-400 font-bold whitespace-nowrap">cm</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-rose-400 mb-1">{t('stitches')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                    <input
                                        type="number"
                                        value={myStitchGauge || ''}
                                        onChange={(e) => setMyStitchGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-brown-700 focus:outline-none"
                                        placeholder={t('example20')}
                                    />
                                    <span className="text-xs text-rose-400 whitespace-nowrap">코</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-rose-400 mb-1">{t('rows')}</label>
                                <div className="flex items-center gap-1.5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                    <input
                                        type="number"
                                        value={myRowGauge || ''}
                                        onChange={(e) => setMyRowGauge(Number(e.target.value) || 0)}
                                        className="w-full bg-transparent text-center font-bold text-brown-700 focus:outline-none"
                                        placeholder={t('example28')}
                                    />
                                    <span className="text-xs text-rose-400 whitespace-nowrap">단</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Standardized Swatch Gauge Deviation Indicators */}
                    {(patternStitchGauge > 0 && myStitchGauge > 0) && (
                        <div className="mt-4 pt-3 border-t border-rose-100 flex justify-center gap-4 animate-in fade-in duration-300">
                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-black ${stitchDiff === 0
                                ? 'bg-stone-100 text-stone-500'
                                : stitchDiff > 0
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                {t('stitchDiff')}: {formatDiff(stitchDiff)}/10cm
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-[11px] font-black ${rowDiff === 0
                                ? 'bg-stone-100 text-stone-500'
                                : rowDiff > 0
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                }`}>
                                {t('rowDiff')}: {formatDiff(rowDiff)}/10cm
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px bg-tan-200" />

            {/* Combined Dimensions & Stitches Conversion Box */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-tan-200 shadow-soft space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Part A: Row & Stitch Count Conversion */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-extrabold text-brown-800 border-l-4 border-rose-300 pl-2">
                            {locale === 'ko' ? '도안 콧수/단수 변환' : 'Convert Stitches/Rows'}
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">{t('patternStitches')}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetStitches || ''}
                                        onChange={(e) => setTargetStitches(Number(e.target.value) || 0)}
                                        placeholder={t('example100')}
                                        className="w-full p-3 rounded-xl border border-tan-200 text-center font-bold text-brown-700 placeholder:text-stone-300 focus:outline-none focus:border-rose-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{t('st')}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">{t('patternRows')}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetRows || ''}
                                        onChange={(e) => setTargetRows(Number(e.target.value) || 0)}
                                        placeholder={t('example100')}
                                        className="w-full p-3 rounded-xl border border-tan-200 text-center font-bold text-brown-700 placeholder:text-stone-300 focus:outline-none focus:border-rose-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{t('row')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stitches Conversion Output */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className={`p-3 rounded-xl border text-center font-bold ${resultStitches > 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-stone-50 text-stone-400'}`}>
                                <div className="text-[10px] text-stone-400 font-medium">{t('myStitches')}</div>
                                <div className="text-lg mt-0.5">{resultStitches > 0 ? `${resultStitches.toFixed(1)} ${t('st')}` : '-'}</div>
                            </div>
                            <div className={`p-3 rounded-xl border text-center font-bold ${resultRows > 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-stone-50 text-stone-400'}`}>
                                <div className="text-[10px] text-stone-400 font-medium">{t('myRows')}</div>
                                <div className="text-lg mt-0.5">{resultRows > 0 ? `${resultRows.toFixed(1)} ${t('row')}` : '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Part B: Target Garment Size Prediction */}
                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-tan-200 pt-6 md:pt-0 md:pl-6">
                        <h4 className="text-sm font-extrabold text-brown-800 border-l-4 border-rose-300 pl-2">
                            {t('targetSize')}
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">{t('targetWidth')}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetWidth || ''}
                                        onChange={(e) => setTargetWidth(Number(e.target.value) || 0)}
                                        placeholder="100"
                                        className="w-full p-3 rounded-xl border border-tan-200 text-center font-bold text-brown-700 placeholder:text-stone-300 focus:outline-none focus:border-rose-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">cm</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">{t('targetHeight')}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={targetHeight || ''}
                                        onChange={(e) => setTargetHeight(Number(e.target.value) || 0)}
                                        placeholder="60"
                                        className="w-full p-3 rounded-xl border border-tan-200 text-center font-bold text-brown-700 placeholder:text-stone-300 focus:outline-none focus:border-rose-300"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">cm</span>
                                </div>
                            </div>
                        </div>

                        {/* Garment Size Prediction Output */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className={`p-3 rounded-xl border text-center font-bold ${predictedWidth > 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-stone-50 text-stone-400'}`}>
                                <div className="text-[10px] text-stone-400 font-medium">{t('actualWidth')}</div>
                                <div className="text-lg mt-0.5">{predictedWidth > 0 ? `${predictedWidth.toFixed(1)} cm` : '-'}</div>
                            </div>
                            <div className={`p-3 rounded-xl border text-center font-bold ${predictedHeight > 0 ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700' : 'bg-stone-50 text-stone-400'}`}>
                                <div className="text-[10px] text-stone-400 font-medium">{t('actualHeight')}</div>
                                <div className="text-lg mt-0.5">{predictedHeight > 0 ? `${predictedHeight.toFixed(1)} cm` : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Calculation/Conversion Button */}
                <button
                    onClick={handleConvert}
                    className="w-full py-4 bg-gradient-to-r from-rose-400 to-peach-300 text-white font-bold text-lg rounded-2xl transition-all shadow-soft hover:shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-5 h-5 animate-hover" />
                    {t('convert')}
                </button>
            </div>

            {/* Predictive Analysis Prescription Advice Card */}
            {(hasCalculated && (predictedWidth > 0 || predictedHeight > 0)) && (
                <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-100 shadow-soft space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
                        <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <span>{t('predictionResult')}</span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {predictedWidth > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs text-emerald-600 font-bold">{t('difference')} (가슴둘레 너비):</span>
                                <div className={`text-xl font-black ${widthDiff === 0
                                    ? 'text-stone-500'
                                    : widthDiff > 0
                                        ? 'text-blue-600'
                                        : 'text-rose-600'
                                    }`}>
                                    {widthDiff === 0
                                        ? '원작과 일치'
                                        : widthDiff > 0
                                            ? `+${widthDiff.toFixed(1)} cm 늘어남`
                                            : `${widthDiff.toFixed(1)} cm 줄어듬`
                                    }
                                </div>
                            </div>
                        )}
                        {predictedHeight > 0 && (
                            <div className="space-y-1">
                                <span className="text-xs text-emerald-600 font-bold">총장 높이 예측:</span>
                                <div className="text-xl font-black text-emerald-800">
                                    {predictedHeight.toFixed(1)} cm (목표: {targetHeight} cm)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Coaching Solutions */}
                    <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/50 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="font-extrabold text-emerald-800 text-sm">{t('solutionApplied')}</h5>
                            <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                                {predictedWidth > 0 ? (
                                    Math.abs(widthDiff) < 3.0 ? (
                                        t('solutionComfortable')
                                    ) : widthDiff < 0 ? (
                                        t('solutionTight', { diff: Math.abs(widthDiff).toFixed(1) })
                                    ) : (
                                        t('solutionLoose', { diff: Math.abs(widthDiff).toFixed(1) })
                                    )
                                ) : (
                                    locale === 'ko'
                                        ? "단수 게이지 편차에 의해 총장이 변동될 수 있습니다. 대바늘 편물의 높이는 뜨면서 수시로 직접 자로 재어 목표 치수에 맞춰 조절해 주시면 좋습니다!"
                                        : "The length may vary due to row gauge deviation. We recommend measuring the height of your fabric frequently while knitting and adjusting the number of rows to match the target dimensions!"
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
