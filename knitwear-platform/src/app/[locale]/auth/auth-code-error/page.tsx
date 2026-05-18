'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-stone-100 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-stone-800 mb-4 font-serif">
                    인증 링크가 만료되었습니다
                </h1>

                <p className="text-stone-600 mb-8 whitespace-pre-wrap">
                    보안을 위해 인증 링크는 한 번만 사용할 수 있으며 일정 시간이 지나면 만료됩니다.
                    <br /><br />
                    다시 로그인을 시도하시면 새로운 인증 메일이 발송됩니다.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/login"
                        className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                        로그인 페이지로 돌아가기
                    </Link>

                    <Link
                        href="/"
                        className="block w-full py-3 text-stone-500 hover:text-stone-700 font-medium transition-colors"
                    >
                        홈으로 가기
                    </Link>
                </div>
            </div>
        </div>
    );
}
