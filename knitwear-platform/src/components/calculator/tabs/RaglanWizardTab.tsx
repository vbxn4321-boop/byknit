'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { calcRaglan } from '@/utils/knittingMath';
import { ResultCard } from '../ResultCard';
import { SizePresetModal } from '../SizePresetModal';
import { HelpCircle, Shirt } from 'lucide-react';

export function RaglanWizardTab() {
    const t = useTranslations('calculator.raglan');
    const ct = useTranslations('calculator.sock'); // Re-using basic terms like stitches/rows/appliedGauge

    // Local Gauge State
    const [stitchGauge, setStitchGauge] = useState<number>(0);
    const [unit, setUnit] = useState<'cm' | 'inch'>('cm');

    const [showSizeModal, setShowSizeModal] = useState(false);
    const [measurements, setMeasurements] = useState({
        neck: 38,
        chest: 96,
        ease: 5,
    });

    const hasGauge = stitchGauge > 0;
    const gaugeBase = unit === 'cm' ? 10 : 4;

    const result = hasGauge ? calcRaglan(
        measurements.neck,
        measurements.chest,
        measurements.ease,
        stitchGauge,
        0
    ) : null;

    const handlePresetSelect = (preset: { chest: number; neck: number }) => {
        setMeasurements((prev) => ({
            ...prev,
            neck: preset.neck,
            chest: preset.chest,
        }));
    };

    return (
        <div className="space-y-6">
            <p className="text-stone-500 text-center">{t('description')}</p>

            {/* Gauge Input Section */}
            <div className="max-w-xl mx-auto bg-[#F9F7F5] p-6 rounded-2xl border border-tan-100">
                <label className="block text-sm font-bold text-stone-700 mb-4 text-center">
                    {ct('appliedGauge')} (10cm/4inch)
                </label>
                <div className="max-w-xs mx-auto flex items-center justify-center gap-3">
                    <input
                        type="number"
                        value={stitchGauge || ''}
                        onChange={(e) => setStitchGauge(Number(e.target.value))}
                        placeholder="0"
                        className="w-24 p-3 rounded-xl border border-tan-200 text-center text-lg font-bold text-brown-700 focus:outline-none focus:border-rose-300 bg-white"
                    />
                    <span className="text-stone-500 font-medium">{ct('stitches')}</span>
                </div>
            </div>

            {/* Size Helper Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowSizeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream-100 border border-tan-200 text-stone-600 text-sm font-medium hover:bg-cream-200 hover:border-tan-300 transition-all cursor-pointer"
                >
                    <HelpCircle className="w-4 h-4" />
                    {t('sizeHelper')}
                </button>
            </div>

            {/* Inputs */}
            <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div>
                    <label className="block text-xs text-stone-500 font-medium mb-2">{t('neckCirc')}</label>
                    <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                        <input
                            type="number"
                            value={measurements.neck}
                            onChange={(e) => setMeasurements({ ...measurements, neck: Number(e.target.value) || 0 })}
                            className="w-full p-3 bg-transparent text-center text-lg font-bold text-brown-700 focus:outline-none"
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
                <div>
                    <label className="block text-xs text-stone-500 font-medium mb-2">{t('chestCirc')}</label>
                    <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                        <input
                            type="number"
                            value={measurements.chest}
                            onChange={(e) => setMeasurements({ ...measurements, chest: Number(e.target.value) || 0 })}
                            className="w-full p-3 bg-transparent text-center text-lg font-bold text-brown-700 focus:outline-none"
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
                <div>
                    <label className="block text-xs text-stone-500 font-medium mb-2">{t('ease')}</label>
                    <div className="flex rounded-xl border border-tan-200 overflow-hidden">
                        <input
                            type="number"
                            value={measurements.ease}
                            onChange={(e) => setMeasurements({ ...measurements, ease: Number(e.target.value) || 0 })}
                            className="w-full p-3 bg-transparent text-center text-lg font-bold text-brown-700 focus:outline-none"
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

            {hasGauge && result ? (
                <>
                    {/* Visual Diagram */}
                    <div className="flex justify-center py-6">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <Shirt strokeWidth={1} className="w-56 h-56 text-rose-200" />
                            <div className="absolute inset-0 flex items-center justify-center pb-2">
                                <div className="text-center">
                                    <div className="text-sm text-stone-500 mb-1">{t('castOn')}</div>
                                    <div className="text-4xl font-extrabold text-brown-800 leading-none">{result.castOn}</div>
                                    <div className="text-sm text-stone-500 mt-1">{t('stitches')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <ResultCard
                            title={t('construction')}
                            results={[
                                { label: t('castOn'), value: result.castOn, unit: t('st') },
                                { label: t('targetChest'), value: result.targetChestStitches, unit: t('st') },
                                { label: t('totalIncreases'), value: result.totalIncreases, unit: t('st') },
                            ]}
                        />
                        <ResultCard
                            title={t('raglanDetails')}
                            results={[
                                { label: t('increaseRounds'), value: result.increaseCount },
                                { label: t('totalRounds'), value: result.totalRounds },
                                { label: t('frontBack'), value: result.perSection.front, unit: t('st') },
                                { label: t('eachSleeve'), value: result.perSection.sleeve, unit: t('st') },
                            ]}
                        />
                    </div>
                </>
            ) : (
                <div className="text-center p-8 bg-stone-100 rounded-3xl text-stone-500 mt-8">
                    <p>{ct('enterGaugeWarning')}</p>
                </div>
            )}

            {/* Size Preset Modal */}
            <SizePresetModal
                isOpen={showSizeModal}
                onClose={() => setShowSizeModal(false)}
                onSelect={handlePresetSelect}
            />
        </div>
    );
}
