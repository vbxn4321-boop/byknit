'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface OnboardingFormProps {
    action: (formData: FormData) => Promise<void>;
    error?: string;
    defaultName?: string;
}

export function OnboardingForm({ action, error, defaultName }: OnboardingFormProps) {
    const t = useTranslations('auth');
    const locale = useLocale();

    return (
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-3xl font-bold mb-4 text-center text-stone-800">
                {locale === 'ko' ? '추가 정보 입력' : 'Complete Profile'}
            </h2>
            <p className="text-stone-500 text-center mb-8 text-sm">
                {locale === 'ko' 
                    ? '서비스 이용을 위해 추가 정보 입력과 약관 동의가 필요합니다.' 
                    : 'Please complete your profile and agree to the terms to continue.'}
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm whitespace-pre-wrap text-center">
                    {error}
                </div>
            )}

            <form action={action} className="space-y-8">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">프로필 이름 (Profile Name)</label>
                    <input
                        name="username"
                        type="text"
                        required
                        defaultValue={defaultName || ''}
                        pattern="[A-Za-z0-9ㄱ-ㅎㅏ-ㅣ가-힣\._\-]+"
                        title={locale === 'ko' ? "한글, 영문, 숫자, 특수문자(._-)만 사용 가능합니다." : "Only Korean, English letters, numbers, dots, dashes, and underscores are allowed."}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                        placeholder=""
                        minLength={2}
                        maxLength={20}
                        onInput={(e) => {
                            const input = e.currentTarget;
                            const regex = /[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]/g;
                            if (regex.test(input.value)) {
                                input.value = input.value.replace(regex, '');
                            }
                            e.currentTarget.setCustomValidity('');
                        }}
                    />
                    <p className="mt-1 text-xs text-stone-500 tracking-tight">
                        {locale === 'ko'
                            ? "* 한글, 영문, 숫자, 특수문자(._-)만 사용 가능합니다."
                            : "* Korean, English, numbers, and special characters (._-) are allowed."}
                    </p>
                </div>

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
                    
                    <label className="flex items-start gap-3 cursor-pointer group mt-6">
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

                <button
                    type="submit"
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 mt-4"
                >
                    {locale === 'ko' ? '완료하고 시작하기' : 'Complete and Start'}
                </button>
            </form>
        </div>
    );
}
