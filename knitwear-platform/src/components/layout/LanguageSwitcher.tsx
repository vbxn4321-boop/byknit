'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { Globe, Check } from 'lucide-react';
import { useState } from 'react';
import { locales, type Locale } from '@/i18n/request';

interface LanguageSwitcherProps {
    locale: Locale;
}

const languageLabels: Record<Locale, string> = {
    en: 'English',
    ko: '한국어',
};

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (newLocale: Locale) => {
        router.replace(pathname, { locale: newLocale });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {isOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-brown-600 hover:text-brown-700 hover:bg-cream-100 transition-all relative z-20"
            >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{languageLabels[locale]}</span>
            </button>
            <div className={`absolute right-0 top-full mt-2 py-2 bg-white border border-tan-200 rounded-2xl shadow-soft-lg transition-all min-w-36 z-20 origin-top-right ${isOpen
                ? 'opacity-100 visible scale-100 translate-y-0'
                : 'opacity-0 invisible scale-95 -translate-y-2'
                }`}>
                {locales.map((loc) => (
                    <button
                        key={loc}
                        onClick={() => handleChange(loc)}
                        className={`w-full px-4 py-2 text-left hover:bg-cream-100 transition-colors flex items-center justify-between ${loc === locale ? 'text-rose-400 font-medium' : 'text-brown-600'
                            }`}
                    >
                        {languageLabels[loc]}
                        {loc === locale && <Check className="w-4 h-4" />}
                    </button>
                ))}
            </div>
        </div>
    );
}
