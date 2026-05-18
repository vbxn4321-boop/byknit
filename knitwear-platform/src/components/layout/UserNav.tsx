'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { signout } from '@/app/actions/auth';
import { LogOut, User as UserIcon, LayoutDashboard, CreditCard, Palette, PenTool, ShoppingBag, Coins } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';

export function UserNav({ user }: { user: User | null }) {
    const t = useTranslations('common');
    const tNav = useTranslations('nav');
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const locale = useLocale();
    const containerRef = useRef<HTMLDivElement>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [credits, setCredits] = useState<number>(0);

    // Initial load and Realtime subscription for profile updates
    useEffect(() => {
        if (!user) return;

        const supabase = createClient();

        // 1. Fetch initial profile
        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('display_name, credits')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    if (data.display_name) setDisplayName(data.display_name);
                    if (data.credits !== null) setCredits(data.credits);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                // Fallback defaults are already set
            }
        };
        fetchProfile();

        // 2. Subscribe to realtime changes
        const channel = supabase
            .channel('profile_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.new) {
                        if ('display_name' in payload.new) setDisplayName(payload.new.display_name as string);
                        if ('credits' in payload.new) setCredits(payload.new.credits as number);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) {
        return (
            <div className="flex items-center gap-4">
                <Link href={`/${locale}/login`} className="text-sm font-bold text-stone-600 hover:text-rose-500 transition-colors">
                    {t('signIn')}
                </Link>
                <Link href={`/${locale}/signup`} className="text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-full transition-all shadow-md active:scale-95">
                    {t('signUp')}
                </Link>
            </div>
        );
    }

    const handleLogout = async () => {
        await signout();
        setIsOpen(false);
        // Force hard refresh to clear server state
        window.location.href = `/${locale}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group p-1 pr-3 rounded-full hover:bg-stone-100 transition-all border border-transparent hover:border-stone-200"
            >
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-500 transition-all">
                    <UserIcon size={16} />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-sm font-bold text-stone-700">
                        {displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        {credits} Credits
                    </span>
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-tan-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-tan-100 bg-cream-50/50">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">My Account</p>
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <div className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] font-black text-white leading-none shadow-sm">C</div>
                                {credits}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-stone-700 truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                        <button
                            onClick={() => { setIsOpen(false); router.push(`/${locale}/profile`); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                        >
                            <UserIcon size={18} />
                            <span>{t('profile')}</span>
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); router.push(`/${locale}/studio`); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                        >
                            <PenTool size={18} />
                            <span>{tNav('myPatterns')}</span>
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); router.push(`/${locale}/marketplace/dashboard`); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all"
                        >
                            <ShoppingBag size={18} />
                            <span>{tNav('myMarketplace')}</span>
                        </button>
                    </div>

                    <div className="p-2 border-t border-tan-100 bg-stone-50/50">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-2xl transition-all group"
                        >
                            <LogOut size={18} className="group-hover:text-rose-500" />
                            <span>{t('signOut')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
