'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function FindIdPage() {
    const t = useTranslations('auth.findId');
    const tAuth = useTranslations('auth'); // For "Back to Login"
    const [nickname, setNickname] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setResult('');
        setErrorMsg('');

        try {
            const supabase = createClient();

            // Call the security definer function via rpc
            // Input parameter name must match function definition: username_input
            const { data, error } = await supabase.rpc('get_masked_email_by_username', {
                username_input: nickname
            });

            if (error) {
                console.error('RPC Error:', error);
                throw error;
            }

            if (data) {
                setResult(data);
                setStatus('success');
            } else {
                setStatus('error');
                // Use a generic message or specific? 
                // "User not found" might be good.
                setErrorMsg("No account found with this profile nickname.");
            }

        } catch (error) {
            console.error('Error finding ID:', error);
            setStatus('error');
            setErrorMsg(tAuth('errorMessage') || "An error occurred. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-100 p-8">
                <Link href="/login" className="inline-flex items-center text-stone-500 hover:text-rose-500 mb-6 transition-colors group">
                    <svg className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {tAuth('backToLogin')}
                </Link>

                <h1 className="text-2xl font-bold text-stone-800 mb-2">{t('title')}</h1>
                <p className="text-stone-600 mb-8">{t('description')}</p>

                {status === 'success' ? (
                    <div className="bg-green-50 rounded-xl p-6 text-center animate-fade-in">
                        <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-stone-600 mb-2">{t('resultMessage')}</p>
                        <p className="text-lg font-bold text-stone-800 font-mono bg-white inline-block px-4 py-2 rounded-lg border border-green-200">
                            {result}
                        </p>
                        <div className="mt-6 space-y-3">
                            <Link
                                href="/login"
                                className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow hover:shadow-lg"
                            >
                                {tAuth('signIn')}
                            </Link>
                            <Link
                                href="/forgot-password"
                                className="block w-full py-3 bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold rounded-xl transition-all"
                            >
                                {tAuth('forgotPasswordLink')}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">
                                {t('inputLabel')}
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                placeholder=""
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2 animate-shake">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {status === 'loading' && (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {status === 'loading' ? 'Searching...' : t('submit')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
