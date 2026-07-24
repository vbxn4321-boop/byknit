'use client';

import React, { useState } from 'react';
import { 
    Receipt, 
    Check, 
    ArrowUpRight, 
    CreditCard, 
    Building, 
    User,
    Calendar,
    Save
} from 'lucide-react';

interface Payout {
    id: string;
    period: string;
    grossSales: number;
    commission: number;
    netAmount: number;
    status: 'paid' | 'pending';
    paidDate?: string;
}

export function SettlementManagement({ locale }: { locale: string }) {
    // Mock payout history
    const [payouts] = useState<Payout[]>([
        { id: 'PAY-202607-02', period: '2026.07.11 ~ 2026.07.20', grossSales: 890000, commission: 89000, netAmount: 801000, status: 'pending' },
        { id: 'PAY-202607-01', period: '2026.07.01 ~ 2026.07.10', grossSales: 2450000, commission: 245000, netAmount: 2205000, status: 'paid', paidDate: '2026.07.15' },
        { id: 'PAY-202606-03', period: '2026.06.21 ~ 2026.06.30', grossSales: 4120000, commission: 412000, netAmount: 3708000, status: 'paid', paidDate: '2026.07.05' },
        { id: 'PAY-202606-02', period: '2026.06.11 ~ 2026.06.20', grossSales: 3100000, commission: 310000, netAmount: 2790000, status: 'paid', paidDate: '2026.06.25' }
    ]);

    // Settlement Bank Account states
    const [bankName, setBankName] = useState('신한은행');
    const [accountHolder, setAccountHolder] = useState('차도운');
    const [accountNumber, setAccountNumber] = useState('110-348-902348');
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveAccount = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const banks = [
        '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', '기업은행', '카카오뱅크', '토스뱅크'
    ];

    const pendingPayoutTotal = payouts
        .filter(p => p.status === 'pending')
        .reduce((acc, p) => acc + p.netAmount, 0);

    const completedPayoutTotal = payouts
        .filter(p => p.status === 'paid')
        .reduce((acc, p) => acc + p.netAmount, 0);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-stone-800 font-sans">
                    {locale === 'ko' ? '정산 관리' : 'Settlement Management'}
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                    {locale === 'ko' ? '구매 확정이 끝난 실물 상품 대금의 정산 예정 내역과 완료 영수증을 확인하고 계좌를 수정합니다.' : 'Check completed settlement history and manage bank account details.'}
                </p>
            </div>

            {/* Payout Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pending Payout */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft flex flex-col justify-between h-40">
                    <div>
                        <span className="text-stone-400 text-xs font-bold block">{locale === 'ko' ? '정산 예정 금액 (대기)' : 'Pending Payout Amount'}</span>
                        <span className="text-3xl font-black text-stone-800 mt-2 block">
                            ₩{pendingPayoutTotal.toLocaleString()}
                        </span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-semibold block">
                        {locale === 'ko' ? '매월 5일, 15일, 25일에 등록 계좌로 자동 지급됩니다.' : 'Automatically disbursed on the 5th, 15th, and 25th.'}
                    </span>
                </div>

                {/* Completed Payout */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft flex flex-col justify-between h-40">
                    <div>
                        <span className="text-stone-400 text-xs font-bold block">{locale === 'ko' ? '정산 완료 총액' : 'Total Settled Amount'}</span>
                        <span className="text-3xl font-black text-stone-800 mt-2 block">
                            ₩{completedPayoutTotal.toLocaleString()}
                        </span>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold block flex items-center gap-1">
                        <Check size={12} />
                        <span>{locale === 'ko' ? '수수료 10% 제외 완료' : '10% Platform fee deducted'}</span>
                    </span>
                </div>
            </div>

            {/* Layout Split: Left payout history, Right account settings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settlement Account Config Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft space-y-6 h-fit">
                    <div className="flex items-center gap-2 border-b border-stone-50 pb-3">
                        <CreditCard size={18} className="text-[#8FBC8F]" />
                        <h2 className="text-base font-bold text-stone-800">{locale === 'ko' ? '정산 계좌 정보' : 'Payout Account'}</h2>
                    </div>

                    <form onSubmit={handleSaveAccount} className="space-y-4">
                        {/* Bank */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                <Building size={12} />
                                <span>{locale === 'ko' ? '정산 은행' : 'Bank'}</span>
                            </label>
                            <select
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            >
                                {banks.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                <Receipt size={12} />
                                <span>{locale === 'ko' ? '계좌 번호' : 'Account Number'}</span>
                            </label>
                            <input 
                                type="text"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Account Holder */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                <User size={12} />
                                <span>{locale === 'ko' ? '예금주명' : 'Holder Name'}</span>
                            </label>
                            <input 
                                type="text"
                                value={accountHolder}
                                onChange={(e) => setAccountHolder(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className={`
                                w-full py-3.5 rounded-2xl text-xs font-bold transition-all shadow-soft flex items-center justify-center gap-1.5
                                ${isSaved 
                                    ? 'bg-[#556B2F] text-white' 
                                    : 'bg-stone-850 hover:bg-stone-900 text-white'}
                            `}
                        >
                            {isSaved ? (
                                <>
                                    <Check size={14} />
                                    <span>{locale === 'ko' ? '저장 완료!' : 'Saved!'}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    <span>{locale === 'ko' ? '정산 계좌 정보 저장' : 'Save Account'}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Payout History Table Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 border-b border-stone-50 pb-3">
                        <Receipt size={18} className="text-[#8FBC8F]" />
                        <h2 className="text-base font-bold text-stone-800">{locale === 'ko' ? '최근 정산 지급 내역' : 'Payout History'}</h2>
                    </div>

                    <div className="overflow-x-auto -mx-6 md:-mx-8">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="bg-stone-50/70 border-b border-stone-100 text-stone-400 text-[10px] font-black uppercase tracking-wider">
                                    <th className="p-4 pl-6 md:pl-8">{locale === 'ko' ? '정산 번호 / 주기' : 'Payout ID / Period'}</th>
                                    <th className="p-4">{locale === 'ko' ? '총 매출액' : 'Gross Sales'}</th>
                                    <th className="p-4">{locale === 'ko' ? '수수료 (10%)' : 'Fee (10%)'}</th>
                                    <th className="p-4">{locale === 'ko' ? '최종 지급액' : 'Net Payout'}</th>
                                    <th className="p-4 pr-6 md:pr-8">{locale === 'ko' ? '상태 / 지급일자' : 'Status / Date'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-600 text-xs">
                                {payouts.map((p) => (
                                    <tr key={p.id} className="hover:bg-stone-50/30 transition-colors">
                                        {/* ID & Period */}
                                        <td className="p-4 pl-6 md:pl-8">
                                            <span className="font-bold text-stone-850 block">{p.id}</span>
                                            <span className="text-[10px] text-stone-400 block font-medium mt-0.5">{p.period}</span>
                                        </td>
                                        {/* Gross Sales */}
                                        <td className="p-4 font-semibold text-stone-500">
                                            ₩{p.grossSales.toLocaleString()}
                                        </td>
                                        {/* Commission */}
                                        <td className="p-4 text-rose-500 font-medium">
                                            -₩{p.commission.toLocaleString()}
                                        </td>
                                        {/* Net Amount */}
                                        <td className="p-4 font-bold text-stone-800">
                                            ₩{p.netAmount.toLocaleString()}
                                        </td>
                                        {/* Status */}
                                        <td className="p-4 pr-6 md:pr-8">
                                            {p.status === 'paid' ? (
                                                <div className="space-y-0.5">
                                                    <span className="inline-block bg-[#E8F0E8] text-[#556B2F] text-[10px] font-black px-2 py-0.5 rounded-md">
                                                        {locale === 'ko' ? '지급 완료' : 'Paid'}
                                                    </span>
                                                    <span className="text-[9px] text-stone-400 block font-semibold">{p.paidDate}</span>
                                                </div>
                                            ) : (
                                                <span className="inline-block bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                                                    {locale === 'ko' ? '지급 대기' : 'Pending'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
