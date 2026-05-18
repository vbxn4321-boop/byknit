'use client';

import { useTranslations } from 'next-intl';
import { Mail, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function HelpPage() {
    const t = useTranslations('help');

    // FAQ Data Keys
    const faqs = ['q1', 'q2', 'q3', 'q4'];

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-brown-800">{t('title')}</h1>
                    <p className="text-xl text-brown-600">{t('subtitle')}</p>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-3xl p-8 shadow-soft-lg space-y-8">
                    <div className="flex items-center gap-3 border-b border-tan-200 pb-4">
                        <HelpCircle className="w-6 h-6 text-rose-400" />
                        <h2 className="text-2xl font-bold text-brown-800">{t('faq.title')}</h2>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((key, index) => (
                            <FAQItem
                                key={index}
                                question={t(`faq.${key}`)}
                                answer={t(`faq.a${key.substring(1)}`)}
                            />
                        ))}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-br from-rose-100 to-peach-100 rounded-3xl p-8 text-center shadow-soft space-y-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Mail className="w-8 h-8 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-brown-800 mb-2">{t('contact.title')}</h2>
                        <p className="text-brown-600 mb-6">{t('contact.desc')}</p>
                        <a
                            href="mailto:support@byknit.com"
                            className="inline-flex items-center gap-2 bg-rose-400 hover:bg-rose-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Mail className="w-5 h-5" />
                            {t('contact.emailButton')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-tan-100 last:border-0 pb-6 last:pb-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-start justify-between text-left group"
            >
                <h3 className={`text-lg font-semibold transition-colors ${isOpen ? 'text-rose-500' : 'text-brown-700 group-hover:text-rose-400'}`}>
                    {question}
                </h3>
                <div className={`ml-4 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-brown-400" />
                </div>
            </button>
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <p className="text-brown-600 leading-relaxed bg-cream-50/50 p-4 rounded-xl">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}
