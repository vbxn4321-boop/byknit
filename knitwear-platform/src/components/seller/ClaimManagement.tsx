'use client';

import React, { useState } from 'react';
import { 
    AlertCircle, 
    MessageSquare, 
    Check, 
    X, 
    HelpCircle, 
    User,
    ChevronRight,
    CornerDownRight,
    Send
} from 'lucide-react';

interface Claim {
    id: string;
    customerName: string;
    productName: string;
    type: 'cancel' | 'return' | 'exchange';
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    date: string;
}

interface Inquiry {
    id: number;
    author: string;
    productName: string;
    content: string;
    date: string;
    status: 'pending' | 'answered';
    answer?: string;
}

export function ClaimManagement({ locale }: { locale: string }) {
    const [activeSubTab, setActiveSubTab] = useState<'claims' | 'inquiries'>('claims');

    // Claims State
    const [claims, setClaims] = useState<Claim[]>([
        { 
            id: 'CLM-001', 
            customerName: '김미선', 
            productName: '파스텔 소프트 코튼 털실 (50g)', 
            type: 'return', 
            reason: '색상이 생각했던 것보다 어두워요. 반품하고 환불받고 싶습니다.', 
            status: 'pending',
            date: '2026.07.23 18:22'
        },
        { 
            id: 'CLM-002', 
            customerName: '오수현', 
            productName: '카본 대바늘 35cm 5종 풀패키지', 
            type: 'cancel', 
            reason: '사이즈 오선택으로 인한 즉시 취소 요청', 
            status: 'pending',
            date: '2026.07.24 10:15'
        },
        { 
            id: 'CLM-003', 
            customerName: '최진우', 
            productName: '비건 레더 가죽 라벨 (10개입)', 
            type: 'exchange', 
            reason: '블랙 색상으로 주문했는데 브라운이 배송되었어요. 교환 요청합니다.', 
            status: 'approved',
            date: '2026.07.22 14:05'
        }
    ]);

    // Inquiries State
    const [inquiries, setInquiries] = useState<Inquiry[]>([
        { 
            id: 1, 
            author: '김은지', 
            productName: '파스텔 소프트 코튼 털실 (50g)', 
            content: '클래식 울 털실 아이보리색 재입고 일정이 언제쯤 되나요? 가을 가디건 뜨려고 하는데 기다리는 중입니다.', 
            date: '10분 전', 
            status: 'pending' 
        },
        { 
            id: 2, 
            author: '이태영', 
            productName: '카본 대바늘 35cm 5종 풀패키지', 
            content: '5호 대바늘 패키지 배송 발송되었나요? 목요일까지는 꼭 받아야 해서 급합니다.', 
            date: '1시간 전', 
            status: 'pending' 
        },
        { 
            id: 3, 
            author: 'Sarah K.', 
            productName: '유기농 내추럴 메리노 울', 
            content: 'Is the Sage Green yarn lot consistent? I want to make sure colors match.', 
            date: '4시간 전', 
            status: 'pending' 
        },
        { 
            id: 4, 
            author: '한나경', 
            productName: '파스텔 소프트 코튼 털실 (50g)', 
            content: '보통 니트 하나 뜨는데 몇 볼정도 드나요?', 
            date: '1일 전', 
            status: 'answered',
            answer: '여성 M 사이즈 기본 니트 기준으로 보통 6~8볼 정도 소요됩니다. 뜨시는 게이지에 따라 오차가 있을 수 있으니 여유있게 구매하시는 것을 추천해 드립니다!'
        }
    ]);

    // Temp inquiry answer field storage
    const [answerText, setAnswerText] = useState<Record<number, string>>({});

    const handleAnswerChange = (id: number, text: string) => {
        setAnswerText({ ...answerText, [id]: text });
    };

    // Submit Q&A answer
    const handleRegisterAnswer = (inquiryId: number) => {
        const text = answerText[inquiryId];
        if (!text || !text.trim()) return;

        setInquiries(inquiries.map(inq => {
            if (inq.id === inquiryId) {
                return {
                    ...inq,
                    status: 'answered',
                    answer: text.trim()
                };
            }
            return inq;
        }));

        // Clear input field
        const updated = { ...answerText };
        delete updated[inquiryId];
        setAnswerText(updated);
    };

    const handleApproveClaim = (claimId: string) => {
        setClaims(claims.map(c => {
            if (c.id === claimId) {
                return { ...c, status: 'approved' };
            }
            return c;
        }));
    };

    const handleRejectClaim = (claimId: string) => {
        const reason = prompt(locale === 'ko' ? '반려(거부) 사유를 적어주세요:' : 'Please enter rejection reason:');
        if (reason === null) return; // user cancelled prompt

        setClaims(claims.map(c => {
            if (c.id === claimId) {
                return { ...c, status: 'rejected' };
            }
            return c;
        }));
    };

    const claimLabels = {
        cancel: locale === 'ko' ? '주문 취소' : 'Order Cancel',
        return: locale === 'ko' ? '반품 요청' : 'Return Request',
        exchange: locale === 'ko' ? '교환 요청' : 'Exchange Request'
    };

    const claimTypeColors = {
        cancel: 'text-amber-500 bg-amber-50 border border-amber-100',
        return: 'text-rose-500 bg-rose-50 border border-rose-100',
        exchange: 'text-indigo-500 bg-indigo-50 border border-indigo-100'
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-stone-800 font-sans">
                    {locale === 'ko' ? '클레임 및 CS 관리' : 'Claims & Customer Service'}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                    {locale === 'ko' ? '구매자의 취소/교환/반품 청구를 검토 처리하고, 문의 게시판(Q&A)에 답변을 등록합니다.' : 'Review customer return/cancel/exchange claims and write answers to product Q&A.'}
                </p>
            </div>

            {/* Inner Subtabs */}
            <div className="flex border-b border-stone-100 gap-6">
                <button
                    onClick={() => setActiveSubTab('claims')}
                    className={`
                        py-3 font-bold text-sm relative transition-all
                        ${activeSubTab === 'claims' ? 'text-stone-800 border-b-2 border-[#556B2F]' : 'text-stone-400 hover:text-stone-600'}
                    `}
                >
                    <span className="flex items-center gap-1.5">
                        <AlertCircle size={16} />
                        <span>{locale === 'ko' ? '취소 • 교환 • 반품' : 'Claims (Cancel/Return)'}</span>
                        <span className="text-[10px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-md">
                            {claims.filter(c => c.status === 'pending').length}
                        </span>
                    </span>
                </button>
                <button
                    onClick={() => setActiveSubTab('inquiries')}
                    className={`
                        py-3 font-bold text-sm relative transition-all
                        ${activeSubTab === 'inquiries' ? 'text-stone-800 border-b-2 border-[#556B2F]' : 'text-stone-400 hover:text-stone-600'}
                    `}
                >
                    <span className="flex items-center gap-1.5">
                        <MessageSquare size={16} />
                        <span>{locale === 'ko' ? '상품 Q&A 문의' : 'Product Q&A'}</span>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-md">
                            {inquiries.filter(i => i.status === 'pending').length}
                        </span>
                    </span>
                </button>
            </div>

            {/* Content Switch */}
            <div className="space-y-4">
                {activeSubTab === 'claims' ? (
                    claims.length > 0 ? (
                        claims.map((c) => (
                            <div 
                                key={c.id}
                                className="bg-white rounded-3xl border border-stone-100 shadow-soft p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all"
                            >
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${claimTypeColors[c.type]}`}>
                                            {claimLabels[c.type]}
                                        </span>
                                        <span className="text-stone-400 text-xs font-semibold">{c.id}</span>
                                        <span className="text-stone-500 text-xs font-bold">{c.customerName}</span>
                                        <span className="text-stone-400 text-xs">{c.date}</span>
                                    </div>
                                    <h4 className="font-bold text-stone-700 text-sm">
                                        {locale === 'ko' ? '대상 상품' : 'Product'}: <span className="text-stone-800">{c.productName}</span>
                                    </h4>
                                    <p className="text-xs text-stone-500 bg-stone-50 p-3 rounded-2xl border border-stone-100/50 leading-relaxed font-semibold">
                                        {c.reason}
                                    </p>
                                </div>

                                <div className="shrink-0 flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                                    {c.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => handleRejectClaim(c.id)}
                                                className="px-4 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-100 text-stone-600 font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                                            >
                                                <X size={14} />
                                                <span>{locale === 'ko' ? '요청 반려' : 'Reject'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleApproveClaim(c.id)}
                                                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shadow-soft"
                                            >
                                                <Check size={14} />
                                                <span>{locale === 'ko' ? '요청 승인' : 'Approve'}</span>
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`
                                            px-3 py-1.5 rounded-full text-xs font-bold border
                                            ${c.status === 'approved' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-stone-50 text-stone-400 border-stone-100'}
                                        `}>
                                            {c.status === 'approved' 
                                                ? (locale === 'ko' ? '처리 완료 (승인)' : 'Approved')
                                                : (locale === 'ko' ? '처리 완료 (반려)' : 'Rejected')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl border border-stone-100 p-16 text-center text-stone-400 shadow-soft">
                            <AlertCircle className="w-10 h-10 mx-auto text-stone-200 mb-3" />
                            {locale === 'ko' ? '처리 대기 중인 취소/교환/반품 건이 없습니다.' : 'No pending claim requests.'}
                        </div>
                    )
                ) : (
                    inquiries.length > 0 ? (
                        inquiries.map((inq) => (
                            <div 
                                key={inq.id}
                                className="bg-white rounded-3xl border border-stone-100 shadow-soft p-5 md:p-6 space-y-4 hover:shadow-md transition-all"
                            >
                                {/* Inquiry Header */}
                                <div className="flex items-center justify-between border-b border-stone-50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-stone-50 text-stone-500 flex items-center justify-center">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-stone-700 block">{inq.author}</span>
                                            <span className="text-[10px] text-stone-400 block font-semibold">{inq.productName} • {inq.date}</span>
                                        </div>
                                    </div>
                                    <span className={`
                                        px-2.5 py-1 rounded-full text-[10px] font-black border
                                        ${inq.status === 'answered' 
                                            ? 'bg-[#E8F0E8] text-[#556B2F] border-[#8FBC8F]/30' 
                                            : 'bg-indigo-50 text-indigo-500 border-indigo-100'}
                                    `}>
                                        {inq.status === 'answered' ? (locale === 'ko' ? '답변완료' : 'Answered') : (locale === 'ko' ? '답변대기' : 'Pending')}
                                    </span>
                                </div>

                                {/* Question Content */}
                                <div className="text-stone-700 text-sm font-semibold pl-1">
                                    {inq.content}
                                </div>

                                {/* Answer Area */}
                                {inq.status === 'answered' ? (
                                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100/50 flex gap-2 animate-fadeIn">
                                        <CornerDownRight size={16} className="text-stone-400 shrink-0 mt-0.5" />
                                        <div className="text-xs leading-relaxed text-stone-500">
                                            <span className="font-bold text-stone-700 block mb-1">상점 답변</span>
                                            {inq.answer}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2 pl-1">
                                        <textarea
                                            placeholder={locale === 'ko' ? '고객에게 전할 답변을 입력하세요...' : 'Write answer to user query...'}
                                            value={answerText[inq.id] || ''}
                                            onChange={(e) => handleAnswerChange(inq.id, e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs focus:bg-white outline-none text-stone-700 font-semibold"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRegisterAnswer(inq.id)}
                                                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-soft"
                                            >
                                                <Send size={12} />
                                                <span>{locale === 'ko' ? '답변 등록하기' : 'Submit Answer'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-3xl border border-stone-100 p-16 text-center text-stone-400 shadow-soft">
                            <HelpCircle className="w-10 h-10 mx-auto text-stone-200 mb-3" />
                            {locale === 'ko' ? '등록된 고객 문의가 없습니다.' : 'No customer inquiries.'}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
