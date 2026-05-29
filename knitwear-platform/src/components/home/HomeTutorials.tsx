'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Grid, Image as ImageIcon, Calculator, Languages, ArrowRight } from 'lucide-react';
import { 
    VectorEditorDemo, 
    VectorConverterDemo, 
    VectorCalculatorDemo 
} from '@/components/tutorials/Demos';

interface HomeTutorialsProps {
    locale: string;
}

export default function HomeTutorials({ locale }: HomeTutorialsProps) {
    const tHome = useTranslations('home');
    const tTut = useTranslations('tutorials');
    const [activeTab, setActiveTab] = useState('editor');

    const tabs = [
        { id: 'editor', label: tTut('tabs.editor'), icon: Grid },
        { id: 'converter', label: tTut('tabs.converter'), icon: ImageIcon },
        { id: 'calculator', label: tTut('tabs.calculator'), icon: Calculator },
    ];

    const content = {
        editor: {
            title: tTut('editor.title'),
            desc: tTut('editor.desc'),
            steps: [
                { title: tTut('editor.step1Title'), desc: tTut('editor.step1Desc') },
                { title: tTut('editor.step2Title'), desc: tTut('editor.step2Desc') },
                { title: tTut('editor.step3Title'), desc: tTut('editor.step3Desc') }
            ]
        },
        converter: {
            title: tTut('converter.title'),
            desc: tTut('converter.desc'),
            steps: [
                { title: tTut('converter.step1Title'), desc: tTut('converter.step1Desc') },
                { title: tTut('converter.step2Title'), desc: tTut('converter.step2Desc') },
                { title: tTut('converter.step3Title'), desc: tTut('converter.step3Desc') }
            ]
        },
        calculator: {
            title: tTut('calculator.title'),
            desc: tTut('calculator.desc'),
            steps: [
                { title: tTut('calculator.step1Title'), desc: tTut('calculator.step1Desc') },
                { title: tTut('calculator.step2Title'), desc: tTut('calculator.step2Desc') },
                { title: tTut('calculator.step3Title'), desc: tTut('calculator.step3Desc') }
            ]
        }
    };

    const activeContent = content[activeTab as keyof typeof content] || content.editor;

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-brown-700 mb-4">
                        {tHome('tutorialsTitle')}
                    </h2>
                    <p className="text-brown-600 max-w-2xl mx-auto text-lg">
                        {tHome('tutorialsSubtitle')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-12 items-stretch">
                    {/* Left Column: Navigation & Content */}
                    <div className="space-y-8 lg:col-span-2 flex flex-col h-full">
                        {/* Active Content Information */}
                        <div className="bg-cream-50 rounded-3xl p-8 border border-tan-100 shadow-soft-sm transition-all duration-300 flex-grow flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-brown-800 mb-3">{activeContent.title}</h3>
                            <p className="text-brown-600 font-medium mb-8 leading-relaxed">{activeContent.desc}</p>
                            
                            {/* Step-by-step description */}
                            <div className="space-y-4">
                                {activeContent.steps.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white border border-tan-100 shadow-sm transition-all duration-300 hover:border-rose-200 hover:shadow-soft">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-rose-500 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-brown-800 mb-1">{step.title}</h4>
                                            <p className="text-xs text-brown-600 leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8">
                                <Link 
                                    href={`/${locale}/tutorials`} 
                                    className="inline-flex items-center gap-2 text-rose-500 font-bold hover:text-rose-600 transition-colors group"
                                >
                                    {tHome('viewAllTutorials')}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Demo Visualization */}
                    <div className="bg-gradient-to-br from-cream-100 to-rose-50 rounded-3xl p-6 md:p-10 shadow-inner flex flex-col items-center justify-between min-h-[500px] border border-tan-100 lg:col-span-3 h-full">
                        <div className="w-full max-w-xl transition-opacity duration-500 flex-grow flex items-center justify-center">
                            {activeTab === 'editor' && <VectorEditorDemo locale={locale} />}
                            {activeTab === 'converter' && <VectorConverterDemo locale={locale} />}
                            {activeTab === 'calculator' && <VectorCalculatorDemo locale={locale} />}
                        </div>
                        
                        {/* Tabs Navigation */}
                        <div className="flex flex-wrap justify-center gap-2 select-none mt-8 w-full">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                                            isActive 
                                            ? 'bg-rose-400 text-white shadow-soft scale-105' 
                                            : 'bg-white/80 text-brown-500 hover:bg-white hover:text-rose-400 border border-tan-100 backdrop-blur-sm'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
