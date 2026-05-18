'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Menu, X, ShoppingBag, PenTool, Calculator, Heart, Image as ImageIcon, Users } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Locale } from '@/i18n/request';

import { User } from '@supabase/supabase-js';
import { UserNav } from './UserNav';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
    locale: Locale;
    user: User | null;
}

export function Header({ locale, user }: HeaderProps) {
    const t = useTranslations('nav');
    const tCommon = useTranslations('common');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { href: '/marketplace', label: t('marketplace'), icon: ShoppingBag },
        { href: '/editor', label: t('editor'), icon: PenTool },
        { href: '/community', label: t('community'), icon: Users },
        { href: '/ai', label: t('chartConverter'), icon: ImageIcon },
        { href: '/calculator', label: t('smartCalculator'), icon: Calculator },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-tan-200 shadow-soft">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-300 to-peach-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft">
                            <Heart className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-bold text-brown-700 tracking-tight">
                            {tCommon('appName')}
                        </span>
                    </Link>

                    {/* Navigation - Natural Flow (Equal Gap) */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-brown-600 font-medium hover:text-rose-500 hover:bg-rose-50/50 transition-all whitespace-nowrap"
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <NotificationBell user={user} />
                        <LanguageSwitcher locale={locale} />
                        <UserNav user={user} />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-xl text-brown-600 hover:text-brown-700 hover:bg-cream-100"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-tan-200 bg-white">
                    <nav className="px-4 py-4 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-brown-600 hover:text-brown-700 hover:bg-cream-100 transition-all"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-tan-200 space-y-2">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-sm font-medium text-brown-600">Notifications</span>
                                <NotificationBell user={user} />
                            </div>
                            <LanguageSwitcher locale={locale} />
                            <div className="flex justify-center py-2">
                                <UserNav user={user} />
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
