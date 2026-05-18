'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Shield, Clock, Phone, UserCheck, FileText, Lock, ChevronDown, ChevronUp, Eye, Heart, Database, Share2, Info, Mail } from 'lucide-react';

export default function PrivacyPage() {
    const t = useTranslations('privacy');
    const today = new Date().toLocaleDateString();
    const [openSections, setOpenSections] = useState<number[]>([]);

    const toggleSection = (id: number) => {
        setOpenSections(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (openSections.length === 12) {
            setOpenSections([]);
        } else {
            setOpenSections([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50/50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16 space-y-4 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-200/50 text-stone-600 rounded-full text-sm font-bold mb-2">
                        <Shield className="w-4 h-4" />
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

                {/* Layer 1: Privacy Labeling (Easy View) */}
                <div className="mb-16 space-y-8 animate-fade-in delay-100">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <PrivacyLabel
                            icon={<FileText className="w-6 h-6" />}
                            title={t('labels.collection')}
                            desc={t('labels.collectionDesc')}
                        />
                        <PrivacyLabel
                            icon={<Clock className="w-6 h-6" />}
                            title={t('labels.retention')}
                            desc={t('labels.retentionDesc')}
                        />
                        <PrivacyLabel
                            icon={<Database className="w-6 h-6" />}
                            title={t('sections.outsourcing')}
                            desc={t('labels.outsourcingDesc')}
                        />
                        <PrivacyLabel
                            icon={<UserCheck className="w-6 h-6" />}
                            title={t('labels.contact')}
                            desc={t('content.cpoInfo.name')}
                        />
                        <PrivacyLabel
                            icon={<Share2 className="w-6 h-6" />}
                            title={t('ui.thirdParty')}
                            desc={t('ui.noThirdParty')}
                        />
                    </div>
                </div>

                {/* Layer 2: Main Content (Accordion) */}
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
                            {openSections.length === 12 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {openSections.length === 12 ? t('ui.hideAll') : t('ui.showAll')}
                        </button>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-soft-lg border border-stone-100 divide-y divide-stone-100 overflow-hidden">
                        <AccordionSection
                            id={1} title={`01. ${t('sections.overview')}`}
                            isOpen={openSections.includes(1)} onToggle={() => toggleSection(1)}
                        >
                            <p className="font-medium text-brown-700 leading-relaxed">{t('content.overview')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={2} title={`02. ${t('sections.collectedItems')}`}
                            isOpen={openSections.includes(2)} onToggle={() => toggleSection(2)}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <ContentBox title={t('ui.required')} content={t('content.collectedItems.required')} />
                                <ContentBox title={t('ui.optional')} content={t('content.collectedItems.optional')} />
                                <ContentBox title={t('ui.auto')} content={t('content.collectedItems.auto')} className="sm:col-span-2" />
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={3} title={`03. ${t('sections.purpose')}`}
                            isOpen={openSections.includes(3)} onToggle={() => toggleSection(3)}
                        >
                            <p className="leading-relaxed">{t('content.purpose')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={4} title={`04. ${t('sections.retentionPeriod')}`}
                            isOpen={openSections.includes(4)} onToggle={() => toggleSection(4)}
                        >
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <p className="text-brown-800 font-medium leading-relaxed">{t('content.retentionPeriod')}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={5} title={`05. ${t('sections.destruction')}`}
                            isOpen={openSections.includes(5)} onToggle={() => toggleSection(5)}
                        >
                            <p className="leading-relaxed">{t('content.destruction')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={6} title={`06. ${t('sections.outsourcing')}`}
                            isOpen={openSections.includes(6)} onToggle={() => toggleSection(6)}
                        >
                            <p className="mb-4 font-bold text-brown-800">{t('content.outsourcing.title')}</p>
                            <ul className="space-y-3">
                                <ListItem text={t('content.outsourcing.vercel')} />
                                <ListItem text={t('content.outsourcing.supabase')} />
                                <ListItem text={t('content.outsourcing.google')} />
                            </ul>
                        </AccordionSection>

                        <AccordionSection
                            id={7} title={`07. ${t('sections.overseas')}`}
                            isOpen={openSections.includes(7)} onToggle={() => toggleSection(7)}
                        >
                            <p className="leading-relaxed">{t('content.overseas')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={8} title={`08. ${t('sections.rights')}`}
                            isOpen={openSections.includes(8)} onToggle={() => toggleSection(8)}
                        >
                            <p className="leading-relaxed whitespace-pre-line">{t('content.rights')}</p>
                        </AccordionSection>

                        <AccordionSection
                            id={9} title={`09. ${t('sections.cookies')}`}
                            isOpen={openSections.includes(9)} onToggle={() => toggleSection(9)}
                        >
                            <p className="mb-4 font-bold text-brown-800">{t('content.cookies.title')}</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <CookieLink label="Chrome" color="bg-blue-50 text-blue-600" />
                                <CookieLink label="Safari" color="bg-stone-50 text-stone-600" />
                                <CookieLink label="Edge" color="bg-sky-50 text-sky-600" />
                            </div>
                            <div className="mt-4 space-y-2 opacity-70">
                                <p className="text-sm italic">{t('content.cookies.chrome')}</p>
                                <p className="text-sm italic">{t('content.cookies.safari')}</p>
                                <p className="text-sm italic">{t('content.cookies.edge')}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={10} title={`10. ${t('sections.safety')}`}
                            isOpen={openSections.includes(10)} onToggle={() => toggleSection(10)}
                        >
                            <div className="flex items-start gap-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <Lock className="w-6 h-6 text-stone-600 mt-1 shrink-0" />
                                <p className="text-brown-800 leading-relaxed font-medium">{t('content.safety')}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={11} title={`11. ${t('sections.automatedDecision')}`}
                            isOpen={openSections.includes(11)} onToggle={() => toggleSection(11)}
                        >
                            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                                <p className="leading-relaxed font-medium text-brown-800">{t('content.automatedDecision')}</p>
                            </div>
                        </AccordionSection>

                        <AccordionSection
                            id={12} title={`12. ${t('sections.cpo')} & ${t('sections.remedies')}`}
                            isOpen={openSections.includes(12)} onToggle={() => toggleSection(12)}
                        >
                            <div className="space-y-8">
                                <div className="card-cozy p-8 !transform-none !shadow-none !border-stone-100 bg-stone-50/50">
                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                                        <div className="p-4 bg-white rounded-3xl shadow-soft ring-8 ring-stone-100">
                                            <UserCheck className="w-8 h-8 text-brown-700" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-extrabold text-2xl text-brown-800">{t('content.cpoInfo.name')}</h3>
                                            <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">{t('content.cpoInfo.role')}</p>
                                            <div className="flex items-center gap-2 text-stone-600 bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-sm inline-flex">
                                                <Mail className="w-4 h-4 text-stone-400" />
                                                <span className="font-bold text-base">{t('content.cpoInfo.email')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-brown-800 px-2">{t('content.remedies.title')}</h4>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <RemedyItem label={t('content.remedies.kopico')} />
                                        <RemedyItem label={t('content.remedies.kisa')} />
                                        <RemedyItem label={t('content.remedies.spo')} />
                                        <RemedyItem label={t('content.remedies.police')} />
                                    </div>
                                </div>
                            </div>
                        </AccordionSection>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrivacyLabel({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
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
                    <div className="text-stone-600 leading-relaxed max-w-none prose prose-stone prose-sm sm:prose-base">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContentBox({ title, content, className = '' }: { title: string, content: string, className?: string }) {
    return (
        <div className={`bg-stone-50 p-5 rounded-2xl border border-stone-100 group hover:border-stone-300 transition-colors ${className}`}>
            <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2 group-hover:text-stone-500 transition-colors">{title}</h5>
            <p className="text-brown-800 font-medium">{content}</p>
        </div>
    );
}

function ListItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-stone-700 bg-white p-4 rounded-xl shadow-sm border border-stone-100">
            <div className="w-2 h-2 rounded-full bg-stone-300" />
            <span className="font-medium">{text}</span>
        </li>
    );
}

function CookieLink({ label, color }: { label: string, color: string }) {
    return (
        <div className={`px-4 py-3 rounded-xl font-bold flex items-center justify-center ${color}`}>
            {label}
        </div>
    );
}

function RemedyItem({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm hover:border-stone-300 transition-all group">
            <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-100 transition-colors">
                <Heart className="w-4 h-4 text-stone-300" />
            </div>
            <span className="text-stone-700 font-bold text-sm tracking-tight">{label}</span>
        </div>
    );
}
