'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const t = useTranslations('auth');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setStatus('error');
            setErrorMessage(error.message);
        } else {
            setStatus('success');
        }
    };

    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-stone-800 mb-2">
                        {t('forgotPassword.title')}
                    </h1>
                    <p className="text-stone-600 text-sm">
                        {t('forgotPassword.description')}
                    </p>
                </div>

                {status === 'success' ? (
                    <div className="text-center space-y-6">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm leading-relaxed">
                            {t('forgotPassword.successMessage')}
                            <br />
                            <span className="font-bold">{email}</span>
                        </div>
                        <Link
                            href="/login"
                            className="block w-full py-3 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl transition-all"
                        >
                            {t('backToLogin')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">
                                {t('email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                placeholder="hello@example.com"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? t('sending') : t('forgotPassword.submit')}
                        </button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-stone-500 hover:text-rose-500 transition-colors">
                                {t('backToLogin')}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
