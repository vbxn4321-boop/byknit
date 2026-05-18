'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calculator, ArrowRightLeft, Sparkles, Shirt, Footprints, Maximize2, Scale } from 'lucide-react';
import { StickyGaugeBar } from '@/components/calculator/StickyGaugeBar';
import { BasicConverterTab } from '@/components/calculator/tabs/BasicConverterTab';
import { YarnSubstituteTab } from '@/components/calculator/tabs/YarnSubstituteTab';
import { RaglanWizardTab } from '@/components/calculator/tabs/RaglanWizardTab';
import { SockPlannerTab } from '@/components/calculator/tabs/SockPlannerTab';
import { PatternGraderTab } from '@/components/calculator/tabs/PatternGraderTab';
import { GaugeConverterTab } from '@/components/calculator/tabs/GaugeConverterTab';

type TabId = 'basic' | 'converter' | 'yarn' | 'raglan' | 'sock' | 'grading';

const TABS: { id: TabId; icon: typeof Calculator; labelKey: string }[] = [
    { id: 'basic', icon: ArrowRightLeft, labelKey: 'tabs.basic' },
    { id: 'converter', icon: Scale, labelKey: 'tabs.converter' },
    { id: 'yarn', icon: Sparkles, labelKey: 'tabs.yarn' },
    { id: 'raglan', icon: Shirt, labelKey: 'tabs.raglan' },
    { id: 'sock', icon: Footprints, labelKey: 'tabs.sock' },
    { id: 'grading', icon: Maximize2, labelKey: 'tabs.grading' },
];

export default function CalculatorClient() {
    const t = useTranslations('calculator');
    const [activeTab, setActiveTab] = useState<TabId>('basic');

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Header */}
            <div className="bg-gradient-to-b from-cream-100 to-cream-50 py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-tan-200 shadow-soft mb-6">
                        <Calculator className="w-4 h-4 text-rose-400" />
                        <span className="text-sm text-brown-600 font-medium">{t('badge')}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-brown-700 mb-3">{t('title')}</h1>
                    <p className="text-stone-500 max-w-lg mx-auto">{t('subtitle')}</p>
                </div>
            </div>



            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${isActive
                                    ? 'bg-gradient-to-r from-rose-300 to-peach-200 text-white shadow-soft'
                                    : 'bg-white border border-tan-200 text-stone-600 hover:border-rose-200 hover:bg-cream-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {t(tab.labelKey)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto px-4 pb-20">
                <div className="bg-white rounded-3xl border border-tan-200 shadow-soft p-6 sm:p-8">
                    {activeTab === 'basic' && <BasicConverterTab />}
                    {activeTab === 'converter' && <GaugeConverterTab />}
                    {activeTab === 'yarn' && <YarnSubstituteTab />}
                    {activeTab === 'raglan' && <RaglanWizardTab />}
                    {activeTab === 'sock' && <SockPlannerTab />}
                    {activeTab === 'grading' && <PatternGraderTab />}
                </div>
            </div>
        </div>
    );
}
