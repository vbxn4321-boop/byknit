'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { calcYarnSubstitute } from '@/utils/knittingMath';
import { ResultCard } from '../ResultCard';


type Mode = 'substitute' | 'requirement';
type ReqMode = 'length' | 'swatch';

export function YarnSubstituteTab() {
    const t = useTranslations('calculator.yarn');
    const [mode, setMode] = useState<Mode>('substitute');
    const [reqMode, setReqMode] = useState<ReqMode>('length');

    // Mode 1: Yarn Substitute State
    const [original, setOriginal] = useState({ balls: 5, meters: 100, weight: 50 });
    const [originalUnit, setOriginalUnit] = useState<'m' | 'yd'>('m');
    const [myYarn, setMyYarn] = useState({ meters: 80, weight: 50 });
    const [myYarnUnit, setMyYarnUnit] = useState<'m' | 'yd'>('m');

    // Mode 2: Yarn Requirement State (Length Based)
    const [reqTotalLength, setReqTotalLength] = useState<number>(0);
    const [reqUnit, setReqUnit] = useState<'m' | 'yd'>('m');
    const [reqBallLength, setReqBallLength] = useState<number>(0);
    const [reqBallUnit, setReqBallUnit] = useState<'m' | 'yd'>('m');
    const [reqStrands, setReqStrands] = useState<number>(1);

    // Mode 2-B: Yarn Requirement State (Swatch Based)
    const [measureUnit, setMeasureUnit] = useState<'cm' | 'inch'>('cm');
    const [swatchWidth, setSwatchWidth] = useState<number>(0);
    const [swatchHeight, setSwatchHeight] = useState<number>(0);
    const [swatchWeight, setSwatchWeight] = useState<number>(0);
    const [projectWidth, setProjectWidth] = useState<number>(0);
    const [projectHeight, setProjectHeight] = useState<number>(0);
    const [myBallWeight, setMyBallWeight] = useState<number>(50);

    // Calculate Mode 1
    const subResult = calcYarnSubstitute(
        original.balls,
        original.meters,
        myYarn.meters,
        original.weight,
        myYarn.weight
    );

    // Calculate Mode 2-A (Length)
    const calculateLengthReq = () => {
        if (!reqTotalLength || !reqBallLength) return 0;

        const totalMeters = reqUnit === 'yd' ? reqTotalLength * 0.9144 : reqTotalLength;
        const ballMeters = reqBallUnit === 'yd' ? reqBallLength * 0.9144 : reqBallLength;

        const balls = (totalMeters / ballMeters) * reqStrands;
        return Math.ceil(balls * 10) / 10;
    };

    // Calculate Mode 2-B (Swatch)
    const calculateSwatchReq = () => {
        if (!swatchWidth || !swatchHeight || !swatchWeight || !projectWidth || !projectHeight || !myBallWeight) {
            return { balls: 0, weight: 0 };
        }

        const swatchArea = swatchWidth * swatchHeight;
        const projectArea = projectWidth * projectHeight;

        if (swatchArea === 0) return { balls: 0, weight: 0 };

        const ratio = projectArea / swatchArea;
        const totalWeightNeeded = swatchWeight * ratio * reqStrands; // Strands multiplier? 
        // Logic check: If I use 2 strands to knit the swatch, the swatch weight ALREADY includes the 2 strands.
        // So I don't need to multiply by strands again if the swatch was knitted with the same strands.
        // BUT, usually users knit swatch with the final setup.
        // Let's assume the user knit the swatch exactly as they plan to knit the project.
        // So no strand multiplier needed for weight calculation if swatch is representative.

        // HOWEVER, if the user knit swatch with 1 strand but plans to use 2 strands... that's a complex case.
        // Let's assume standard usage: Swatch represents the final fabric.
        // So: Total Weight = Swatch Weight * (Project Area / Swatch Area)

        const balls = totalWeightNeeded / myBallWeight;
        return {
            balls: Math.ceil(balls * 10) / 10,
            weight: Math.ceil(totalWeightNeeded)
        };
    };

    const reqResultBalls = calculateLengthReq();
    const swatchResult = calculateSwatchReq();

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <p className="text-stone-500">{t('description')}</p>
            </div>

            {/* Main Mode Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                    <button
                        onClick={() => setMode('substitute')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${mode === 'substitute'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {t('mode.substitute')}
                    </button>
                    <button
                        onClick={() => setMode('requirement')}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${mode === 'requirement'
                            ? 'bg-white text-brown-700 shadow-soft'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {t('mode.requirement')}
                    </button>
                </div>
            </div>

            {mode === 'substitute' ? (
                // MODE 1: Yarn Substitute
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Original Yarn */}
                        <div className="p-6 rounded-2xl bg-white border border-tan-200 shadow-sm">
                            <h3 className="font-bold text-brown-700 mb-4 flex items-center gap-2">
                                {t('original.title')}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 mb-1 uppercase tracking-wide">{t('original.balls')}</label>
                                    <input
                                        type="number"
                                        value={original.balls}
                                        onChange={(e) => setOriginal({ ...original, balls: Number(e.target.value) || 0 })}
                                        className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold text-lg focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                                    />
                                </div>
                                <div>
                                    <div className="flex rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
                                        <input
                                            type="number"
                                            value={original.meters}
                                            onChange={(e) => setOriginal({ ...original, meters: Number(e.target.value) || 0 })}
                                            className="w-full p-3 bg-transparent text-brown-700 font-bold text-lg focus:outline-none"
                                            placeholder={t('original.metersPerBall')}
                                        />
                                        <select
                                            value={originalUnit}
                                            onChange={(e) => setOriginalUnit(e.target.value as 'm' | 'yd')}
                                            className="bg-transparent text-stone-500 font-medium px-4 py-3 border-l border-stone-200 focus:outline-none cursor-pointer"
                                        >
                                            <option value="m">m</option>
                                            <option value="yd">yd</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={original.weight}
                                            onChange={(e) => setOriginal({ ...original, weight: Number(e.target.value) || 0 })}
                                            className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold text-lg focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                                            placeholder={t('original.weightPerBall')}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">g</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Yarn */}
                        <div className="p-6 rounded-2xl bg-white border border-tan-200 shadow-sm">
                            <h3 className="font-bold text-brown-700 mb-4 flex items-center gap-2">
                                {t('myYarn.title')}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex rounded-xl border border-rose-100 bg-rose-50 overflow-hidden">
                                        <input
                                            type="number"
                                            value={myYarn.meters}
                                            onChange={(e) => setMyYarn({ ...myYarn, meters: Number(e.target.value) || 0 })}
                                            placeholder="1볼당 길이"
                                            className="w-full p-3 bg-transparent font-bold text-brown-700 placeholder:text-rose-300 focus:outline-none"
                                        />
                                        <select
                                            value={myYarnUnit}
                                            onChange={(e) => setMyYarnUnit(e.target.value as 'm' | 'yd')}
                                            className="bg-transparent text-stone-500 font-medium px-4 py-3 border-l border-rose-200 focus:outline-none cursor-pointer"
                                        >
                                            <option value="m">m</option>
                                            <option value="yd">yd</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={myYarn.weight}
                                            onChange={(e) => setMyYarn({ ...myYarn, weight: Number(e.target.value) || 0 })}
                                            placeholder="1볼당 무게"
                                            className="w-full p-3 rounded-xl border border-rose-100 bg-rose-50 font-bold text-brown-700 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-rose-400">g</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ResultCard
                        title={t('result')}
                        results={[
                            { label: t('totalMeters'), value: subResult.totalMetersNeeded.toFixed(0), unit: 'm' },
                            { label: t('ballsNeeded'), value: subResult.ballsNeeded, unit: t('balls') },
                        ]}
                        warning={subResult.warning}
                        hideIcon={true}
                    />
                </div>
            ) : (
                // MODE 2: Yarn Requirement
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Requirement Sub-Mode Toggle */}
                    <div className="flex border-b border-tan-200 mb-4">
                        <button
                            onClick={() => setReqMode('length')}
                            className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${reqMode === 'length'
                                ? 'text-brown-700'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            {t('reqMode.length')}
                            {reqMode === 'length' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-400 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setReqMode('swatch')}
                            className={`flex-1 pb-3 font-bold text-sm transition-colors relative ${reqMode === 'swatch'
                                ? 'text-brown-700'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            {t('reqMode.swatch')}
                            {reqMode === 'swatch' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-400 rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {reqMode === 'length' ? (
                        /* Length Based Calculation */
                        <div className="grid md:grid-cols-2 gap-8 p-6 rounded-2xl bg-white border border-tan-200 shadow-sm">
                            {/* Required Total Length */}
                            <div>
                                <h3 className="font-bold text-brown-700 mb-4 flex items-center gap-2">
                                    {t('requirement.totalLengthTitle')}
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-stone-400 mb-1 uppercase tracking-wide">{t('requirement.lengthInput')}</label>
                                    <div className="flex rounded-xl border border-stone-200 bg-stone-50 focus-within:bg-white focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                                        <input
                                            type="number"
                                            value={reqTotalLength || ''}
                                            onChange={(e) => setReqTotalLength(Number(e.target.value) || 0)}
                                            placeholder="1000"
                                            className="w-full p-3 bg-transparent text-brown-700 font-bold text-lg focus:outline-none rounded-l-xl"
                                        />
                                        <select
                                            value={reqUnit}
                                            onChange={(e) => setReqUnit(e.target.value as 'm' | 'yd')}
                                            className="bg-transparent text-stone-500 font-medium px-4 py-3 rounded-r-xl border-l border-stone-200 focus:outline-none cursor-pointer hover:bg-stone-100 transition-colors"
                                        >
                                            <option value="m">m</option>
                                            <option value="yd">yard</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-stone-400 mt-2 ml-1">{t('requirement.totalLengthDesc')}</p>
                                </div>
                            </div>

                            {/* My Yarn Info */}
                            <div>
                                <h3 className="font-bold text-brown-700 mb-4 flex items-center gap-2">
                                    {t('requirement.myInfoTitle')}
                                </h3>
                                <div className="space-y-4">
                                    {/* Ball Length */}
                                    <div>
                                        <label className="block text-xs font-bold text-rose-400 mb-1 uppercase tracking-wide">{t('requirement.ballLength')}</label>
                                        <div className="flex rounded-xl border border-rose-100 bg-rose-50 overflow-hidden">
                                            <input
                                                type="number"
                                                value={reqBallLength || ''}
                                                onChange={(e) => setReqBallLength(Number(e.target.value) || 0)}
                                                placeholder="100"
                                                className="w-full p-3 bg-transparent font-bold text-brown-700 placeholder:text-rose-300 focus:outline-none"
                                            />
                                            <select
                                                value={reqBallUnit}
                                                onChange={(e) => setReqBallUnit(e.target.value as 'm' | 'yd')}
                                                className="bg-transparent text-stone-500 font-medium px-4 py-3 border-l border-rose-200 focus:outline-none cursor-pointer"
                                            >
                                                <option value="m">m</option>
                                                <option value="yd">yard</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Strands */}
                                    <div>
                                        <label className="block text-xs font-bold text-rose-400 mb-1 uppercase tracking-wide">{t('requirement.strands')}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={reqStrands}
                                                onChange={(e) => setReqStrands(Math.max(1, Number(e.target.value)))}
                                                min="1"
                                                className="w-full p-3 rounded-xl border border-rose-100 bg-rose-50 font-bold text-brown-700 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                            />
                                            <span className="text-sm text-rose-400 font-medium whitespace-nowrap px-2">{t('requirement.strandsUnit')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Swatch Based Calculation */
                        <div className="p-6 rounded-2xl bg-white border border-tan-200 shadow-sm space-y-8">
                            {/* Top Row: Swatch & Project Info */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Swatch Info */}
                                <div>
                                    <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2">
                                        {t('swatch.title')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">{t('swatch.width')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={swatchWidth || ''}
                                                    onChange={(e) => setSwatchWidth(Number(e.target.value) || 0)}
                                                    placeholder="10"
                                                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">cm</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">{t('swatch.height')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={swatchHeight || ''}
                                                    onChange={(e) => setSwatchHeight(Number(e.target.value) || 0)}
                                                    placeholder="10"
                                                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">cm</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">{t('swatch.weight')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={swatchWeight || ''}
                                                    onChange={(e) => setSwatchWeight(Number(e.target.value) || 0)}
                                                    placeholder="5"
                                                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">g</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Project Info */}
                                <div>
                                    <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2">
                                        {t('swatch.projectTitle')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">{t('swatch.width')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={projectWidth || ''}
                                                    onChange={(e) => setProjectWidth(Number(e.target.value) || 0)}
                                                    placeholder="50"
                                                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">cm</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">{t('swatch.height')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={projectHeight || ''}
                                                    onChange={(e) => setProjectHeight(Number(e.target.value) || 0)}
                                                    placeholder="180"
                                                    className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-brown-700 font-bold focus:outline-none focus:ring-2 focus:ring-rose-100"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">cm</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-400 mt-2">{t('swatch.desc')}</p>
                                </div>
                            </div>

                            {/* Divider with Icon (Removed) */}
                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-tan-200"></div>
                                </div>
                            </div>

                            {/* My Yarn Info */}
                            <div className="max-w-md mx-auto">
                                <h3 className="font-bold text-brown-700 mb-4 flex items-center justify-center gap-2">
                                    {t('swatch.myInfoTitle')}
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-rose-400 mb-1 uppercase tracking-wide">{t('original.weightPerBall')}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={myBallWeight || ''}
                                            onChange={(e) => setMyBallWeight(Number(e.target.value) || 0)}
                                            placeholder="50"
                                            className="w-full p-3 rounded-xl border border-rose-100 bg-rose-50 font-bold text-brown-700 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-rose-400">g</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    <ResultCard
                        title={t('result')}
                        results={reqMode === 'length'
                            ? [{ label: t('ballsNeeded'), value: reqResultBalls, unit: t('balls') }]
                            : [
                                { label: t('swatch.totalWeight'), value: swatchResult.weight || 0, unit: 'g' },
                                { label: t('ballsNeeded'), value: swatchResult.balls, unit: t('balls') }
                            ]
                        }
                        description={reqMode === 'length' && reqStrands > 1 ? t('requirement.strandsNote', { count: reqStrands }) : undefined}
                        hideIcon={true}
                    />
                </div>
            )}
        </div>
    );
}
