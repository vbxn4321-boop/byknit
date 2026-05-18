'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { Lock } from 'lucide-react';

export function PasswordChangeForm() {
    const t = useTranslations('profile.security');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const formData = new FormData(e.currentTarget);
        const newPassword = formData.get('newPassword') as string;
        const confirmNewPassword = formData.get('confirmNewPassword') as string;

        // Basic validation
        if (newPassword.length < 6) {
            setStatus('error');
            setMessage("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setStatus('error');
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                throw error;
            }

            setStatus('success');
            setMessage(t('success'));
            // Optional: reset form
            e.currentTarget.reset();
        } catch (error: any) {
            console.error('Password update error:', error);
            setStatus('error');
            setMessage(error.message || t('error'));
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-soft border border-tan-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-tan-100 bg-cream-50/50 flex items-center gap-2">
                <Lock className="w-5 h-5 text-stone-600" />
                <h2 className="font-bold text-brown-700">{t('title')}</h2>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                    {/* Status Message */}
                    {status !== 'idle' && message && (
                        <div className={`p-4 rounded-xl text-sm ${status === 'success' ? 'bg-green-50 text-green-700' :
                                status === 'error' ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-600'
                            }`}>
                            {message}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">{t('newPassword')}</label>
                        <input
                            name="newPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">{t('confirmNewPassword')}</label>
                        <input
                            name="confirmNewPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl transition-all shadow hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? 'Updating...' : t('update')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
