'use client';

import { useState } from 'react';
import { Grid, Image as ImageIcon, Calculator, Languages, Play, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TutorialsPage() {
    const t = useTranslations('tutorials');
    const [activeTab, setActiveTab] = useState('editor');

    const tabs = [
        { id: 'editor', label: t('tabs.editor'), icon: Grid },
        { id: 'converter', label: t('tabs.converter'), icon: ImageIcon },
        { id: 'calculator', label: t('tabs.calculator'), icon: Calculator },
        { id: 'translator', label: t('tabs.translator'), icon: Languages },
        { id: 'community', label: t('tabs.community'), icon: Store },
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
        },
        community: {
            title: t('community.title'),
            desc: t('community.desc'),
            steps: [
                { title: t('community.step1Title'), desc: t('community.step1Desc') },
                { title: t('community.step2Title'), desc: t('community.step2Desc') },
                { title: t('community.step3Title'), desc: t('community.step3Desc') }
            ]
        }
    };

    const activeContent = content[activeTab as keyof typeof content];

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brown-800 mb-4">{t('title')}</h1>
                    <p className="text-lg text-brown-600">{t('subtitle')}</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-tan-200 pb-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-rose-400 text-white shadow-md' 
                                    : 'bg-white text-brown-600 hover:bg-rose-50 hover:text-rose-500 border border-tan-200'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="bg-white rounded-3xl p-8 shadow-soft-xl border border-tan-100">
                    <div className="mb-8 text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-brown-800 mb-2">{activeContent.title}</h2>
                        <p className="text-brown-600">{activeContent.desc}</p>
                    </div>

                    {/* Placeholder for Video/GIF */}
                    <div className="w-full h-64 bg-tan-100 rounded-2xl mb-10 flex items-center justify-center flex-col gap-3 border-2 border-dashed border-tan-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors cursor-pointer">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <Play className="w-6 h-6 text-rose-400 ml-1" />
                            </div>
                        </div>
                        <p className="text-brown-500 font-medium z-10 mt-20">
                            {t('placeholder', { title: activeContent.title })}
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="space-y-6">
                        {activeContent.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-5 rounded-2xl bg-cream-50 border border-tan-100 hover:border-rose-200 transition-colors">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-500">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-brown-800 mb-1">{step.title}</h3>
                                    <p className="text-brown-600 leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="mt-12 text-center">
                    <p className="text-brown-500 text-sm">{t('footer')}</p>
                </div>
            </div>
        </div>
    );
}
