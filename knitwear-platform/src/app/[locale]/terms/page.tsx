'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Scale, Clock, AlertTriangle, UserCheck, FileText, Ban, ChevronDown, ChevronUp, Info, ShoppingBag, Lock, Copyright } from 'lucide-react';

export default function TermsPage() {
    const t = useTranslations('terms');
    const today = new Date().toLocaleDateString();
    const [openSections, setOpenSections] = useState<number[]>([]);

    const toggleSection = (id: number) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (openSections.length === 10) {
            setOpenSections([]);
        } else {
            setOpenSections([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50/50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16 space-y-4 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-200/50 text-stone-600 rounded-full text-sm font-bold mb-2">
                        <Scale className="w-4 h-4" />
                        <span>{t('ui.summaryTitle')}</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-brown-800 tracking-tight">
                        {t('title')}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-stone-400 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{t('lastUpdated', { date: today })}</span>
                    </div>
                </div>

                {/* Layer 1: Key Summary Labels */}
                <div className="mb-16 space-y-8 animate-fade-in delay-100">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <TermLabel
                            icon={<ShoppingBag className="w-6 h-6" />}
                            title={t('ui.labels.broker.title')}
                            desc={t('ui.labels.broker.desc')}
                        />
                        <TermLabel
                            icon={<AlertTriangle className="w-6 h-6" />}
                            title={t('ui.labels.refund.title')}
                            desc={t('ui.labels.refund.desc')}
                        />
                        <TermLabel
                            icon={<Copyright className="w-6 h-6" />}
                            title={t('ui.labels.ugc.title')}
                            desc={t('ui.labels.ugc.desc')}
                        />
                        <TermLabel
                            icon={<Lock className="w-6 h-6" />}
                            title={t('ui.labels.darkpattern.title')}
                            desc={t('ui.labels.darkpattern.desc')}
                        />
                        <TermLabel
                            icon={<Ban className="w-6 h-6" />}
                            title={t('ui.labels.restriction.title')}
                            desc={t('ui.labels.restriction.desc')}
                        />
                    </div>
                </div>

                {/* Layer 2: Full Terms (Accordion) */}
                <div className="space-y-6 animate-fade-in delay-200">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2">
                            <Info className="w-6 h-6 text-stone-400" />
                            {t('ui.detailsTitle')}
                        </h2>
                        <button
                            onClick={toggleAll}
                            className="btn-secondary !py-2 !px-4 !text-sm flex items-center gap-2 shadow-sm !border-stone-200 !text-stone-600 hover:!bg-stone-50"
                        >
                            {openSections.length === 10 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {openSections.length === 10 ? t('ui.hideAll') : t('ui.showAll')}
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-soft-lg border border-stone-100 divide-y divide-stone-100 overflow-hidden">
                        <AccordionSection
                            id={1} title={t('articles.art1')}
                            isOpen={openSections.includes(1)} onToggle={() => toggleSection(1)}
                        >
                            <p className="font-medium text-brown-700 leading-relaxed">{t('content.art1')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={2} title={t('articles.art2')}
                            isOpen={openSections.includes(2)} onToggle={() => toggleSection(2)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art2')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={3} title={t('articles.art3')}
                            isOpen={openSections.includes(3)} onToggle={() => toggleSection(3)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art3')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={4} title={t('articles.art6')}
                            isOpen={openSections.includes(4)} onToggle={() => toggleSection(4)}
                        >
                            <p className="leading-relaxed">{t('content.art6')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={5} title={t('articles.art10')}
                            isOpen={openSections.includes(5)} onToggle={() => toggleSection(5)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art10')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={6} title={t('articles.art16')}
                            isOpen={openSections.includes(6)} onToggle={() => toggleSection(6)}
                        >
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <p className="text-brown-800 font-medium leading-relaxed whitespace-pre-line">{t('content.art16')}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={7} title={t('articles.art20')}
                            isOpen={openSections.includes(7)} onToggle={() => toggleSection(7)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art20')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={8} title={t('articles.art22')}
                            isOpen={openSections.includes(8)} onToggle={() => toggleSection(8)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art22')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={9} title={t('articles.art28')}
                            isOpen={openSections.includes(9)} onToggle={() => toggleSection(9)}
                        >
                            <p className="whitespace-pre-line leading-relaxed">{t('content.art28')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={10} title={t('articles.provision')}
                            isOpen={openSections.includes(10)} onToggle={() => toggleSection(10)}
                        >
                            <p className="leading-relaxed">{t('content.provision')}</p>
                        </AccordionSection>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TermLabel({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="glass p-6 rounded-[2rem] shadow-soft flex flex-col items-center text-center gap-4 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 group !bg-white/90">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center transition-colors group-hover:bg-brown-700 group-hover:text-white ring-8 ring-stone-50/50">
                {icon}
            </div>
            <div className="space-y-1">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.1em]">{title}</h3>
                <p className="text-sm text-brown-800 font-extrabold line-clamp-1">{desc}</p>
            </div>
        </div>
    );
}

function AccordionSection({ id, title, children, isOpen, onToggle }: { id: number, title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) {
    return (
        <div className={`transition-colors duration-500 ${isOpen ? 'bg-stone-50/30' : 'bg-white'}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-8 text-left hover:bg-stone-50/20 transition-colors group"
            >
                <span className={`text-lg sm:text-xl font-extrabold tracking-tight transition-colors duration-300 ${isOpen ? 'text-brown-800' : 'text-stone-700'}`}>
                    {title}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-brown-700 text-white rotate-180 shadow-soft-md' : 'bg-stone-50 text-stone-400 group-hover:bg-stone-100'}`}>
                    <ChevronDown className="w-6 h-6" />
                </div>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 py-8' : 'grid-rows-[0fr] opacity-0 py-0'}`}>
                <div className="overflow-hidden px-8">
                    <div className="text-stone-600 leading-relaxed max-w-none prose prose-stone prose-sm sm:prose-base whitespace-pre-line">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
