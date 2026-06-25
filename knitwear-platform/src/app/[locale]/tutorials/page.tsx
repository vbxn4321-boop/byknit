'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Grid, Image as ImageIcon, Calculator, Languages, Play, Store, 
    MousePointer, Sparkles, Check, ArrowRight, Save, Info, AlertTriangle, Upload, Sliders, RefreshCw,
    Copy, FileText, Globe
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { VectorEditorDemo, VectorConverterDemo, VectorTranslatorDemo, VectorCalculatorDemo } from '@/components/tutorials/Demos';

// ==========================================
// 메인 튜토리얼 통합 페이지
// ==========================================
export default function TutorialsPage() {
    const t = useTranslations('tutorials');
    const [activeTab, setActiveTab] = useState('editor');

    const tabs = [
        { id: 'editor', label: t('tabs.editor'), icon: Grid },
        { id: 'converter', label: t('tabs.converter'), icon: ImageIcon },
        { id: 'calculator', label: t('tabs.calculator'), icon: Calculator },
    ];

    const content = {
        editor: {
            title: t('editor.title'),
            desc: t('editor.desc'),
            steps: [
                { title: t('editor.step1Title'), desc: t('editor.step1Desc') },
                { title: t('editor.step2Title'), desc: t('editor.step2Desc') },
                { title: t('editor.step3Title'), desc: t('editor.step3Desc') }
            ]
        },
        converter: {
            title: t('converter.title'),
            desc: t('converter.desc'),
            steps: [
                { title: t('converter.step1Title'), desc: t('converter.step1Desc') },
                { title: t('converter.step2Title'), desc: t('converter.step2Desc') },
                { title: t('converter.step3Title'), desc: t('converter.step3Desc') }
            ]
        },
        calculator: {
            title: t('calculator.title'),
            desc: t('calculator.desc'),
            steps: [
                { title: t('calculator.step1Title'), desc: t('calculator.step1Desc') },
                { title: t('calculator.step2Title'), desc: t('calculator.step2Desc') },
                { title: t('calculator.step3Title'), desc: t('calculator.step3Desc') }
            ]
        },
        translator: {
            title: t('translator.title'),
            desc: t('translator.desc'),
            steps: [
                { title: t('translator.step1Title'), desc: t('translator.step1Desc') },
                { title: t('translator.step2Title'), desc: t('translator.step2Desc') },
                { title: t('translator.step3Title'), desc: t('translator.step3Desc') }
            ]
        }
    };

    const activeContent = content[activeTab as keyof typeof content] || content.editor;

    return (
        <div className="min-h-screen bg-[#FAF6F0] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12 select-none">
                    <h1 className="text-4xl font-extrabold text-[#3A3530] mb-4 tracking-tight">{t('title')}</h1>
                    <p className="text-lg text-stone-500 font-bold max-w-2xl mx-auto leading-relaxed">{t('subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-[#EFE7DC] pb-5 select-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-extrabold transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-[#F28E9B] text-white shadow-md shadow-rose-200/50 scale-105' 
                                    : 'bg-white text-stone-500 hover:bg-rose-50/50 hover:text-[#F28E9B] border border-[#EFE7DC]'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Panel */}
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-[#EFE7DC] transition-all duration-300">
                    <div className="mb-8 text-center sm:text-left select-none">
                        <span className="text-[10px] font-black text-[#F28E9B] bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">byKnit Tutorials</span>
                        <h2 className="text-3xl font-extrabold text-[#3A3530] mb-2">{activeContent.title}</h2>
                        <p className="text-stone-500 font-bold text-sm leading-relaxed">{activeContent.desc}</p>
                    </div>

                    {/* 시연 영역 */}
                    <div className="mb-10">
                        {activeTab === 'editor' ? (
                            <VectorEditorDemo locale="ko" />
                        ) : activeTab === 'converter' ? (
                            <VectorConverterDemo locale="ko" />
                        ) : (
                            <VectorCalculatorDemo locale="ko" />
                        )}
                    </div>

                    {/* Step-by-step 설명 카드 */}
                    <div className="space-y-4">
                        {activeContent.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-[#FAF6F0]/50 border border-[#EFE7DC] hover:border-rose-200/50 hover:bg-white transition-all duration-300 shadow-sm">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-black text-[#F28E9B] text-xs">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-[#3A3530] mb-1">{step.title}</h3>
                                    <p className="text-xs text-stone-500 font-bold leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
                
                {/* Footer */}
                <div className="mt-12 text-center select-none border-t border-[#EFE7DC] pt-6">
                    <p className="text-stone-400 text-xs font-bold leading-normal max-w-md mx-auto">
                        {t('footer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
