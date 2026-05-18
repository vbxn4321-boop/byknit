'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { calcSockDetails, SOCK_STANDARD_SIZES } from '@/utils/knittingMath';
import { ResultCard } from '../ResultCard';
import { Footprints, Info } from 'lucide-react';


export function SockPlannerTab() {
    const t = useTranslations('calculator.sock');

    // UI States
    const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
    const [footCirc, setFootCirc] = useState<number>(23); // stored in CM
    const [footLength, setFootLength] = useState<number>(24); // stored in CM

    const [stitchGauge, setStitchGauge] = useState<number>(0);

    // Helper for display/input conversion
    const toDisplay = (cmVal: number) => unit === 'cm' ? cmVal : parseFloat((cmVal / 2.54).toFixed(2));
    const fromInput = (val: number) => unit === 'cm' ? val : val * 2.54;

    // Handle Preset Selection
    const handlePreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value as keyof typeof SOCK_STANDARD_SIZES;
        if (SOCK_STANDARD_SIZES[key]) {
            setFootCirc(SOCK_STANDARD_SIZES[key].footCirc);
            setFootLength(SOCK_STANDARD_SIZES[key].footLength);
        }
    };

    const hasGauge = stitchGauge > 0;
    // Note: rowGauge is not strictly needed for the structural plan as we output lengths in CM.
    // Passing 0 as rowGauge to calc logic since it's currently unused for these specific outputs.
    const result = hasGauge ? calcSockDetails(footCirc, footLength, stitchGauge, 0) : null;
    const displayUnit = unit === 'cm' ? 'cm' : 'in';

    return (
        <div className="space-y-8">
            <p className="text-stone-500 text-center">{t('description')}</p>

            {/* Input Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-tan-200 space-y-6">

                {/* Gauge Input (Local) */}
                {/* Gauge Input (Local) */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                        {t('appliedGauge')} (10cm/4inch)
                    </label>
                    <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                        <input
                            type="number"
                            value={stitchGauge || ''}
                            onChange={(e) => setStitchGauge(Number(e.target.value))}
                            placeholder="0"
                            className="w-full p-3 bg-transparent text-center text-xl font-bold text-brown-700 focus:outline-none"
                        />
                        <div className="bg-stone-50 text-stone-500 font-medium px-4 py-3 border-l border-tan-200 flex items-center justify-center text-sm min-w-[3.5rem]">
                            {t('stitches')}
                        </div>
                    </div>
                </div>

                {/* 1. Standard Size Preset */}
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                        {t('selectSize')} <span className="text-stone-400 font-normal text-xs ml-1">(CYC Standard)</span>
                    </label>
                    <select
                        onChange={handlePreset}
                        className="w-full p-3 rounded-xl border border-tan-200 text-stone-700 bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all font-medium"
                        defaultValue=""
                    >
                        <option value="" disabled>{t('selectSizePlaceholder')}</option>
                        {(Object.keys(SOCK_STANDARD_SIZES) as Array<keyof typeof SOCK_STANDARD_SIZES>).map((size) => (
                            <option key={size} value={size}>{t(`sizes.${size}`)}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Measurements & Unit */}
                <div className="grid grid-cols-2 gap-4">


                    {/* Foot Length */}
                    <div>
                        <label className="block text-xs text-stone-500 font-medium mb-1.5">{t('footLength')}</label>
                        <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                            <input
                                type="number"
                                value={toDisplay(footLength)}
                                onChange={(e) => setFootLength(fromInput(Number(e.target.value) || 0))}
                                className="w-full p-3 bg-transparent text-center text-xl font-bold text-brown-700 focus:outline-none"
                            />
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as 'cm' | 'inch')}
                                className="bg-stone-50 text-stone-500 font-medium px-2 py-3 border-l border-tan-200 focus:outline-none cursor-pointer text-sm"
                            >
                                <option value="cm">cm</option>
                                <option value="inch">inch</option>
                            </select>
                        </div>
                    </div>

                    {/* Foot Circumference */}
                    <div>
                        <label className="block text-xs text-stone-500 font-medium mb-1.5">{t('footCircumference')}</label>
                        <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                            <input
                                type="number"
                                value={toDisplay(footCirc)}
                                onChange={(e) => setFootCirc(fromInput(Number(e.target.value) || 0))}
                                className="w-full p-3 bg-transparent text-center text-xl font-bold text-brown-700 focus:outline-none"
                            />
                            <select
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as 'cm' | 'inch')}
                                className="bg-stone-50 text-stone-500 font-medium px-2 py-3 border-l border-tan-200 focus:outline-none cursor-pointer text-sm"
                            >
                                <option value="cm">cm</option>
                                <option value="inch">inch</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {hasGauge && result ? (
                <>
                    {/* Results Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <ResultCard
                            title={t('castOnInfo')}
                            results={[
                                { label: t('castOn'), value: result.castOn, unit: t('stitches') },
                                { label: t('perNeedle'), value: result.castOn / 4, unit: t('stitches') },
                                { label: t('ribbing'), value: '1x1 / 2x2' },
                            ]}
                        />

                        <ResultCard
                            title={t('heelToe')}
                            results={[
                                { label: t('heelFlap'), value: result.heelFlapStitches, unit: t('stitches') },
                                { label: t('gussetPickup'), value: result.gussetPickUp, unit: t('stitches') },
                                { label: t('toeDecrease'), value: `${toDisplay(result.lengthBeforeToe)}${displayUnit} ${t('fromStart')}` },
                            ]}
                            description={`${t('toeLengthNote')} (${toDisplay(result.toeLength)}${displayUnit})`}
                        />
                    </div>

                    {/* Detailed Steps / Tips */}
                    <div className="p-5 rounded-2xl bg-stone-50 border border-tan-200 space-y-3">
                        <h4 className="font-bold text-brown-700 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {t('constructionTips')}
                        </h4>
                        <div className="space-y-2 text-sm text-stone-600">
                            <p>• <strong>{t('sockCircumference')}:</strong> {toDisplay(footCirc * 0.9).toFixed(1)}{displayUnit} (90% of foot)</p>
                            <p>• <strong>{t('totalFootLength')}:</strong> {toDisplay(result.totalFootLength).toFixed(1)}{displayUnit}</p>
                            <p>• <strong>{t('startToeAt')}:</strong> {toDisplay(result.lengthBeforeToe).toFixed(1)}{displayUnit} {t('measuredFromHeel')}</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center p-12 bg-stone-50 rounded-3xl border border-stone-100">
                    <p className="text-stone-500 font-medium">{t('enterGaugeWarning')}</p>
                </div>
            )}
        </div>
    );
}
