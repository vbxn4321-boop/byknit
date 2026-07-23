'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { verifySignupOtp } from '@/app/actions/auth';

const SAVED_EMAIL_KEY = 'byknit_saved_email';
const REMEMBER_EMAIL_KEY = 'byknit_remember_email';

interface AuthFormProps {
    type: 'login' | 'signup';
    action: (formData: FormData) => Promise<any>;
    message?: string;
    error?: string;
}

export function AuthForm({ type, action, message, error }: AuthFormProps) {
    const t = useTranslations('auth');
    const locale = useLocale();

    // Remember email feature
    const [rememberEmail, setRememberEmail] = useState(false);
    const [savedEmail, setSavedEmail] = useState('');
    const emailInputRef = useRef<HTMLInputElement>(null);

    // OTP and Form State
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [formDataObj, setFormDataObj] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (type === 'login') {
            const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY) === 'true';
            const email = localStorage.getItem(SAVED_EMAIL_KEY) || '';
            setRememberEmail(remembered);
            if (remembered && email) {
                setSavedEmail(email);
            }
        }
    }, [type]);

    const handleFormAction = async (formData: FormData) => {
        setIsLoading(true);
        setFormError(null);

        if (type === 'login') {
            const email = formData.get('email') as string;
            if (rememberEmail && email) {
                localStorage.setItem(SAVED_EMAIL_KEY, email);
                localStorage.setItem(REMEMBER_EMAIL_KEY, 'true');
            } else {
                localStorage.removeItem(SAVED_EMAIL_KEY);
                localStorage.removeItem(REMEMBER_EMAIL_KEY);
            }
            await action(formData);
            setIsLoading(false);
            return;
        }

        if (type === 'signup' && step === 'form') {
            const result = await action(formData);
            setIsLoading(false);
            
            if (result?.error) {
                setFormError(result.error);
                return;
            }
            
            if (result?.success) {
                const entries = Object.fromEntries(formData);
                const stringEntries: Record<string, string> = {};
                for (const [k, v] of Object.entries(entries)) {
                    if (typeof v === 'string') stringEntries[k] = v;
                }
                setFormDataObj(stringEntries);
                setStep('otp');
            }
        }
    };

    const handleOtpAction = async (formData: FormData) => {
        setIsLoading(true);
        setFormError(null);
        
        const result = await verifySignupOtp(formData);
        
        if (result?.error) {
            setFormError(result.error);
            setIsLoading(false);
            return;
        }
        
        if (result?.success) {
            window.location.href = `/${locale}`;
        }
    };

    // Fallback translations if not loaded yet (for speed)
    const title = type === 'login' ? '로그인 (Log In)' : '회원가입 (Sign Up)';
    const btnText = type === 'login' ? '로그인' : '가입하기';
    const altLinkText = type === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인';
    const altLinkHref = type === 'login' ? `/${locale}/signup` : `/${locale}/login`;

    const handleGoogleLogin = async () => {
        const supabase = createClient();
        const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${redirectBase}/${locale}/auth/callback`,
            },
        });
    };

    return (
        <div className="max-w-md w-full mx-auto p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-3xl font-bold mb-8 text-center text-stone-800">
                {title}
            </h2>

            {message && (
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                    {message}
                </div>
            )}

            {(error || formError) && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm break-words text-center">
                    {(() => {
                        const currentError = formError || error;
                        if (!currentError) return null;
                        
                        if (locale === 'ko') {
                            if (currentError.includes('Email not confirmed')) return '이메일 인증이 완료되지 않았습니다. 메일을 확인해주세요.';
                            if (currentError.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
                            if (currentError.includes('User already registered')) return '이미 가입된 사용자입니다.';
                        }
                        return currentError;
                    })()}
                </div>
            )}

            {step === 'otp' ? (
                <form action={handleOtpAction} className="space-y-6">
                    {Object.entries(formDataObj).map(([key, value]) => (
                        <input type="hidden" key={key} name={key} value={value} />
                    ))}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mb-4">
                            <span className="text-2xl">✉️</span>
                        </div>
                        <h3 className="text-lg font-bold text-stone-800 mb-2">인증번호를 입력해주세요</h3>
                        <p className="text-sm text-stone-500">
                            <span className="font-medium text-rose-500">{formDataObj.email}</span>(으)로<br />
                            6자리 인증번호를 발송했습니다.
                        </p>
                    </div>
                    <div>
                        <input
                            name="otp_code"
                            type="text"
                            required
                            maxLength={6}
                            className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                            placeholder="000000"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center"
                    >
                        {isLoading ? '확인 중...' : '인증 완료'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="w-full py-3 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                    >
                        이메일 주소 다시 입력하기
                    </button>
                </form>
            ) : (
                <>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 mb-6 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-3"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                Sign in with Google
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-stone-500">or with email</span>
                </div>
            </div>

            <form action={handleFormAction} className="space-y-8">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
                    <input
                        ref={emailInputRef}
                        name="email"
                        type="email"
                        required
                        defaultValue={savedEmail}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                        placeholder="hello@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                        placeholder="••••••••"
                        minLength={6}
                    />
                </div>

                {type === 'login' && (
                    <div className="flex justify-between items-center px-1 -mt-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={rememberEmail}
                                onChange={(e) => setRememberEmail(e.target.checked)}
                                className="w-4 h-4 rounded border-stone-300 text-rose-500 focus:ring-rose-200 cursor-pointer"
                            />
                            <span className="text-sm text-stone-500 group-hover:text-stone-700 transition-colors">
                                {locale === 'ko' ? '아이디 저장' : 'Remember Email'}
                            </span>
                        </label>
                        <a href={`/${locale}/forgot-password`} className="text-sm text-stone-500 hover:text-rose-500 transition-colors">
                            {t('forgotPasswordLink')}
                        </a>
                    </div>
                )}

                {type === 'signup' && (
                    <div className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">프로필 이름 (Profile Name)</label>
                            <input
                                name="username"
                                type="text"
                                required
                                 pattern="[A-Za-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\._\-]+"
                                title={locale === 'ko' ? "한글, 영문, 숫자, 특수문자(._-)만 사용 가능합니다." : "Only Korean, English letters, numbers, dots, dashes, and underscores are allowed."}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                placeholder=""
                                minLength={2}
                                maxLength={20}
                                onInput={(e) => {
                                    // Allow Korean, English, numbers, and symbols - remove any other characters immediately
                                    const input = e.currentTarget;
                                    const regex = /[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]/g;
                                    if (regex.test(input.value)) {
                                        input.value = input.value.replace(regex, '');
                                    }
                                    e.currentTarget.setCustomValidity('');
                                }}
                            />
                            <p className="mt-1 text-xs text-stone-500 whitespace-nowrap tracking-tight">
                                {locale === 'ko'
                                    ? "* 한글, 영문, 숫자, 특수문자(._-)만 사용 가능합니다."
                                    : "* Korean, English, numbers, and special characters (._-) are allowed."}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">비밀번호 확인 (Confirm Password)</label>
                            <input
                                name="passwordConfirm"
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                placeholder="••••••••"
                                minLength={6}
                                onChange={(e) => {
                                    const password = (document.querySelector('input[name="password"]') as HTMLInputElement)?.value;
                                    if (password && e.target.value !== password) {
                                        e.target.setCustomValidity('비밀번호가 일치하지 않습니다.');
                                    } else {
                                        e.target.setCustomValidity('');
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {type === 'signup' && (
                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2">추천인 닉네임 (Referral Name) <span className="text-stone-400 font-normal ml-1">[선택]</span></label>
                            <input
                                name="referrer_name"
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                placeholder="추천인의 닉네임을 입력하세요 (+100 크레딧)"
                            />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                name="privacy_policy_agreed"
                                type="checkbox"
                                required
                                className="mt-1 w-5 h-5 rounded border-stone-300 text-rose-500 focus:ring-rose-200 cursor-pointer"
                            />
                            <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                                <span className="text-rose-500 font-bold">[필수]</span> 개인정보 처리방침 및 이용약관에 동의합니다.
                                <br />
                                <span className="text-xs text-stone-400">서비스 이용을 위해 필수적인 정보 수집에 동의합니다.</span>
                            </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                name="ad_agreement"
                                type="checkbox"
                                required
                                className="mt-1 w-5 h-5 rounded border-stone-300 text-rose-500 focus:ring-rose-200 cursor-pointer"
                            />
                            <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                                <span className="text-rose-500 font-bold">[필수]</span> 광고 시청 동의
                                <br />
                                <span className="text-xs text-stone-400">무료 서비스 운영을 위한 광고 노출에 동의합니다.</span>
                            </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                name="marketing_consent"
                                type="checkbox"
                                className="mt-1 w-5 h-5 rounded border-stone-300 text-rose-500 focus:ring-rose-200 cursor-pointer"
                            />
                            <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                                <span className="text-stone-400 font-bold">[선택]</span> 마케팅 정보 수신 동의
                                <br />
                                <span className="text-xs text-stone-400">다양한 할인 혜택과 이벤트 소식을 받아보세요.</span>
                            </span>
                        </label>

                        {/* Age Verification */}
                        <label className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-stone-100">
                            <input
                                name="age_verification"
                                type="checkbox"
                                required
                                className="mt-1 w-5 h-5 rounded border-stone-300 text-rose-500 focus:ring-rose-200 cursor-pointer"
                            />
                            <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors">
                                <span className="text-rose-500 font-bold">[{locale === 'ko' ? '필수' : 'Required'}]</span> {t('ageVerification')}
                            </span>
                        </label>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center"
                >
                    {isLoading ? (type === 'login' ? '로그인 중...' : '처리 중...') : btnText}
                </button>
            </form>
            </>
            )}

            <div className="mt-6 text-center">
                <a href={altLinkHref} className="text-stone-500 hover:text-rose-500 text-sm font-medium transition-colors">
                    {altLinkText}
                </a>
            </div>
        </div>
    );
}
