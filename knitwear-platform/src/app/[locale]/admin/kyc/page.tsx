'use client';

import React, { useState, useEffect } from 'react';
import { 
    Shield, 
    Check, 
    XCircle, 
    User, 
    Building, 
    FileText, 
    CreditCard, 
    Building2, 
    ArrowLeft,
    AlertTriangle,
    Eye,
    Lock,
    Store,
    Clock,
    CheckCircle2,
    X,
    FileCheck,
    Search,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { StoreProposal } from '@/app/[locale]/seller/proposal/page';

export default function AdminKycPage() {
    // Admin Tab State (Removed legacy KYC tab)
    

    // Store Proposals states
    const [proposals, setProposals] = useState<StoreProposal[]>([]);
    const [selectedProposal, setSelectedProposal] = useState<StoreProposal | null>(null);
    const [viewingDocType, setViewingDocType] = useState<'bizCert' | 'bankBook' | 'mailOrder' | null>(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReasonInput, setRejectReasonInput] = useState('');
    const [proposalFilter, setProposalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Admin authorization states
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authUser, setAuthUser] = useState<any>(null);
    const [authProfile, setAuthProfile] = useState<any>(null);
    const [authChecking, setAuthChecking] = useState(true);
    
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication and admin role from DB
    useEffect(() => {
        const checkAdminAuth = async () => {
            if (typeof window === 'undefined') return;

            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            // 1. Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setAuthChecking(false);
                return;
            }
            setAuthUser(user);

            // 2. Check if user has admin role in DB
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, display_name')
                .eq('id', user.id)
                .single();

            setAuthProfile(profile);

            if (profile?.role === 'admin') {
                setIsAuthorized(true);
            }

            setAuthChecking(false);
        };
        checkAdminAuth();
    }, []);

    const loadProposals = async () => {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase
            .from('seller_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            alert('입점 신청 목록을 불러오지 못했습니다: ' + error.message);
        } else {
            setProposals((data || []).map((row: any): StoreProposal => ({
                id: row.id,
                brandName: row.brand_name,
                repName: row.rep_name,
                email: row.email,
                phone: row.phone,
                sellerType: row.seller_type,
                businessNum: row.seller_type === 'individual' ? '비사업자(개인)' : (row.business_num || ''),
                bankName: row.bank_name,
                accountNumber: row.account_number,
                accountHolder: row.account_holder,
                category: row.category || '',
                intro: row.intro || '',
                portfolioUrl: row.portfolio_url || '',
                bizCertFileName: row.biz_cert_file_name || undefined,
                bankBookFileName: row.bank_book_file_name || undefined,
                mailOrderFileName: row.mail_order_file_name || undefined,
                status: row.status,
                rejectReason: row.reject_reason || undefined,
                createdAt: String(row.created_at).split('T')[0]
            })));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (!isAuthorized) return;
        loadProposals();
    }, [isAuthorized]);

    // Proposal status changes (RPC가 신청서 상태와 profiles.seller_status를 함께 갱신)
    const handleApproveProposal = async (id: string) => {
        const { createClient } = await import('@/utils/supabase/client');
        const { error } = await createClient().rpc('approve_seller_application', { app_id: id });
        if (error) {
            alert('승인 처리에 실패했습니다: ' + error.message);
            return;
        }
        alert('해당 파트너의 입점 신청이 승인되었습니다. 이제 유료 도안을 판매할 수 있고 통합 판매자 관리에 표시됩니다.');
        setSelectedProposal(null);
        await loadProposals();
    };

    const handleRejectProposal = async (id: string) => {
        if (!rejectReasonInput.trim()) {
            alert('반려 사유를 반드시 기입해 주세요.');
            return;
        }

        const { createClient } = await import('@/utils/supabase/client');
        const { error } = await createClient().rpc('reject_seller_application', {
            app_id: id,
            reason: rejectReasonInput.trim()
        });
        if (error) {
            alert('반려 처리에 실패했습니다: ' + error.message);
            return;
        }
        alert('입점 제안이 반려 처리되었습니다. 반려 사유가 기록되었습니다.');
        setRejectMode(false);
        setRejectReasonInput('');
        setSelectedProposal(null);
        await loadProposals();
    };


    // Loading state for auth check
    if (authChecking) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
                <span className="text-stone-400 text-sm font-bold">관리자 인증 확인 중...</span>
            </div>
        );
    }

    // Not logged in at all
    if (!authUser) {
        return (
            <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-soft text-stone-700 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-stone-900">로그인이 필요합니다</h2>
                        <p className="text-sm text-stone-400 font-medium leading-relaxed">
                            이 페이지에 접근하려면 먼저 바이니트 계정으로 로그인해야 합니다.
                        </p>
                    </div>
                    <Link
                        href={`/${(typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'ko')}/login`}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl text-sm font-bold transition-all shadow-soft block text-center"
                    >
                        로그인 하러 가기
                    </Link>
                </div>
            </div>
        );
    }

    // Logged in but NOT admin role
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-soft text-stone-700 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-stone-900">접근 권한이 없습니다</h2>
                        <p className="text-sm text-stone-400 font-medium leading-relaxed">
                            본 페이지는 바이니트 본사 관리자 전용 보안 구역입니다.<br />
                            일반 계정으로는 열람이 불가합니다.
                        </p>
                        <p className="text-xs text-stone-300 font-mono">
                            현재 계정: {authUser.email} (Role: {authProfile?.role || 'user'})
                        </p>
                    </div>
                    <Link
                        href={`/${(typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'ko')}`}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl text-sm font-bold transition-all shadow-soft block text-center"
                    >
                        메인 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
                <span className="text-stone-400 text-sm font-bold">어드민 데이터를 불러오는 중...</span>
            </div>
        );
    }

    const filteredProposals = proposals.filter(p => {
        if (proposalFilter === 'all') return true;
        return p.status === proposalFilter;
    });

    return (
        <div className="min-h-full p-6 sm:p-12 font-sans text-stone-700">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-soft">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-stone-900">byKnit 본사 관리자 콘솔</h1>
                            <p className="text-sm text-stone-400 font-bold mt-0.5">신규 입점 제안 심사 및 입점 제안 통합 관리 센터</p>
                        </div>
                    </div>
                    <Link 
                        href="/ko/seller" 
                        className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                    >
                        <ArrowLeft size={12} />
                        <span>판매자 센터로 돌아가기</span>
                    </Link>
                </div>

                {/* ---------------- STORE PROPOSALS REVIEW TAB ---------------- */}
                <div className="space-y-6 animate-fadeIn">
                        
                        {/* Filter Bar */}
                        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-stone-800">제안 처리 상태 필터:</span>
                                <div className="flex gap-1.5">
                                    {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setProposalFilter(st)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                                                proposalFilter === st 
                                                    ? 'bg-stone-900 text-white shadow-soft' 
                                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                            }`}
                                        >
                                            {st === 'all' && '전체'}
                                            {st === 'pending' && '대기 중'}
                                            {st === 'approved' && '승인 완료'}
                                            {st === 'rejected' && '반려 건'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <span className="text-sm text-stone-400 font-medium">총 {filteredProposals.length}건의 제안서</span>
                        </div>

                        {/* Proposal Table */}
                        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-soft overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                            <th className="p-4">접수일시</th>
                                            <th className="p-4">상호 / 브랜드명</th>
                                            <th className="p-4">대표자 / 연락처</th>
                                            <th className="p-4">과세유형 / 사업자번호</th>
                                            <th className="p-4">제출 서류 사본</th>
                                            <th className="p-4 text-center">심사 상태</th>
                                            <th className="p-4 text-center">심사 제어</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-150 text-sm">
                                        {filteredProposals.length > 0 ? (
                                            filteredProposals.map(prop => (
                                                <tr key={prop.id} className="hover:bg-stone-50/50 transition-colors">
                                                    <td className="p-4 text-stone-400 font-mono text-sm font-bold">
                                                        {prop.createdAt}
                                                    </td>
                                                    <td className="p-4 font-bold text-stone-900">
                                                        {prop.brandName}
                                                    </td>
                                                    <td className="p-4 space-y-0.5">
                                                        <div className="font-bold text-stone-800">{prop.repName}</div>
                                                        <div className="text-xs text-stone-400">{prop.email}</div>
                                                    </td>
                                                    <td className="p-4 space-y-0.5">
                                                        <div className="font-bold text-stone-700">
                                                            {prop.sellerType === 'corporate' && '법인 사업자'}
                                                            {prop.sellerType === 'biz_general' && '개인 사업자 (일반)'}
                                                            {prop.sellerType === 'biz_simplified' && '개인 사업자 (간이)'}
                                                            {prop.sellerType === 'individual' && '개인 크리에이터'}
                                                        </div>
                                                        <div className="text-xs text-stone-400 font-mono">{prop.businessNum}</div>
                                                    </td>
                                                    <td className="p-4 space-y-1">
                                                        <div className="flex items-center gap-1 text-xs text-stone-600 font-bold">
                                                            <FileCheck size={10} className="text-emerald-600" />
                                                            <span className="truncate max-w-[120px]">{prop.bizCertFileName || '사업자등록증.pdf'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-stone-600 font-bold">
                                                            <CreditCard size={10} className="text-blue-600" />
                                                            <span className="truncate max-w-[120px]">{prop.bankBookFileName || '통장사본.png'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                                            prop.status === 'pending'
                                                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                                : prop.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                        }`}>
                                                            {prop.status === 'pending' && '심사 대기중'}
                                                            {prop.status === 'approved' && '입점 승인완료'}
                                                            {prop.status === 'rejected' && '제안 반려됨'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedProposal(prop)}
                                                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-950 text-white rounded-xl text-sm font-bold transition-all shadow-soft flex items-center gap-1 mx-auto"
                                                        >
                                                            <Eye size={12} />
                                                            <span>서류 열람 / 심사</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center text-stone-400 font-bold">
                                                    선택한 조건의 입점 제안 내역이 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                </div>

                {/* ---------------- PROPOSAL DETAIL & DOCUMENT VIEWER MODAL ---------------- */}
                {selectedProposal && (
                    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
                            
                            {/* Modal Header */}
                            <div className="p-6 border-b border-stone-150 flex justify-between items-center bg-stone-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <Store className="text-emerald-600" size={18} />
                                        <span>입점 제안서 상세 검토</span>
                                    </h2>
                                    <span className="text-sm text-stone-400 font-mono">제안 ID: {selectedProposal.id}</span>
                                </div>
                                <button onClick={() => setSelectedProposal(null)} className="p-2 text-stone-400 hover:text-stone-600 rounded-xl">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 overflow-y-auto">
                                
                                {/* Info Cards */}
                                <div className="grid grid-cols-2 gap-4 text-sm bg-stone-50 p-4 rounded-2xl border border-stone-150">
                                    <div>
                                        <span className="text-stone-400 font-bold block text-xs">상호 / 브랜드명</span>
                                        <span className="text-stone-900 font-bold text-base">{selectedProposal.brandName}</span>
                                    </div>
                                    <div>
                                        <span className="text-stone-400 font-bold block text-xs">대표자명</span>
                                        <span className="text-stone-900 font-bold text-base">{selectedProposal.repName}</span>
                                    </div>
                                    <div>
                                        <span className="text-stone-400 font-bold block text-xs">이메일</span>
                                        <span className="text-blue-600 font-bold">{selectedProposal.email}</span>
                                    </div>
                                    <div>
                                        <span className="text-stone-400 font-bold block text-xs">연락처</span>
                                        <span className="text-stone-800 font-bold">{selectedProposal.phone}</span>
                                    </div>
                                </div>

                                {/* Bank Account Check Card */}
                                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-sm space-y-1">
                                    <span className="text-xs font-bold text-emerald-800 uppercase block">정산 계좌 정보</span>
                                    <div className="font-bold text-stone-800">
                                        {selectedProposal.bankName} : <span className="font-mono text-stone-900">{selectedProposal.accountNumber}</span> (예금주: {selectedProposal.accountHolder})
                                    </div>
                                </div>

                                {/* 제출 증빙 서류 사본 미리보기 버튼 열람 영역 */}
                                <div className="space-y-3">
                                    <span className="text-sm font-bold text-stone-800 block">제출된 증빙 서류 돋보기 미리보기</span>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Biz Cert Viewer Button */}
                                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center text-sm font-bold text-stone-700">
                                                <span>1. 사업자등록증 사본</span>
                                                <FileCheck size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="text-xs text-stone-400 truncate">{selectedProposal.bizCertFileName}</div>
                                            <button
                                                onClick={() => setViewingDocType('bizCert')}
                                                className="w-full py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs"
                                            >
                                                <Eye size={12} />
                                                <span>사업자 원본 열람</span>
                                            </button>
                                        </div>

                                        {/* Bankbook Viewer Button */}
                                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center text-sm font-bold text-stone-700">
                                                <span>2. 정산 통장 사본</span>
                                                <CreditCard size={14} className="text-blue-600" />
                                            </div>
                                            <div className="text-xs text-stone-400 truncate">{selectedProposal.bankBookFileName}</div>
                                            <button
                                                onClick={() => setViewingDocType('bankBook')}
                                                className="w-full py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs"
                                            >
                                                <Eye size={12} />
                                                <span>통장 사본 열람</span>
                                            </button>
                                        </div>

                                        {/* Mail Order Viewer Button */}
                                        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center text-sm font-bold text-stone-700">
                                                <span>3. 통신판매업신고증</span>
                                                <FileText size={14} className="text-indigo-600" />
                                            </div>
                                            <div className="text-xs text-stone-400 truncate">{selectedProposal.mailOrderFileName || '미제출'}</div>
                                            <button
                                                onClick={() => setViewingDocType('mailOrder')}
                                                disabled={!selectedProposal.mailOrderFileName}
                                                className={`w-full py-1.5 border border-stone-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs ${!selectedProposal.mailOrderFileName ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-white hover:bg-stone-100 text-stone-700'}`}
                                            >
                                                <Eye size={12} />
                                                <span>통신판매업 열람</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Intro & Portfolio */}
                                <div className="space-y-2 text-sm">
                                    <span className="font-bold text-stone-800 block">브랜드 소개 & 제안서 내용</span>
                                    <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl text-stone-700 leading-relaxed font-medium">
                                        {selectedProposal.intro || '입점 제안 소개 내용이 작성되지 않았습니다.'}
                                    </div>
                                    {selectedProposal.portfolioUrl && (
                                        <a 
                                            href={selectedProposal.portfolioUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline text-sm pt-1"
                                        >
                                            <ExternalLink size={12} />
                                            <span>포트폴리오 / SNS 외부 링크 이동</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-4 border-t border-stone-150 bg-stone-50 space-y-3">
                                {rejectMode ? (
                                    <div className="space-y-3 animate-fadeIn">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-rose-600 block">반려 사유를 상세히 기입해 주세요 *</label>
                                            <textarea
                                                value={rejectReasonInput}
                                                onChange={(e) => setRejectReasonInput(e.target.value)}
                                                placeholder="예: 제출 서류 미비 (사업자등록증 예금주와 정산 통장 예금주가 불일치합니다. 동일 명의의 통장 사본을 재제출해 주세요.)"
                                                rows={3}
                                                className="w-full bg-white border border-rose-200 rounded-xl p-3 text-sm font-bold text-stone-700 outline-none focus:ring-1 focus:ring-rose-400 resize-none placeholder:text-stone-400"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => { setRejectMode(false); setRejectReasonInput(''); }}
                                                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-bold rounded-xl"
                                            >
                                                취소 (돌아가기)
                                            </button>
                                            <button
                                                onClick={() => handleRejectProposal(selectedProposal.id)}
                                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-soft flex items-center gap-1"
                                            >
                                                <XCircle size={14} />
                                                <span>반려 사유 확정 및 반려 처리</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => { setSelectedProposal(null); setRejectMode(false); setRejectReasonInput(''); }}
                                            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-bold rounded-xl"
                                        >
                                            닫기
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRejectMode(true)}
                                                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl"
                                            >
                                                제안 반려
                                            </button>
                                            <button
                                                onClick={() => handleApproveProposal(selectedProposal.id)}
                                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-soft flex items-center gap-1"
                                            >
                                                <Check size={14} />
                                                <span>입점 최종 승인</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- DOCUMENT VIEWER MODAL (MAGNIFIER) ---------------- */}
                {viewingDocType && selectedProposal && (
                    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white max-w-xl w-full rounded-3xl p-6 space-y-4 animate-zoomIn border border-stone-200 shadow-2xl">
                            <div className="flex justify-between items-center border-b border-stone-150 pb-3">
                                <span className="font-bold text-stone-900 text-base flex items-center gap-1.5">
                                    <FileCheck size={16} className="text-emerald-600" />
                                    <span>
                                        {viewingDocType === 'bizCert' ? '사업자등록증 원본 서류' : 
                                         viewingDocType === 'mailOrder' ? '통신판매업신고증 원본 서류' : '정산 통장 사본 원본 서류'}
                                    </span>
                                </span>
                                <button onClick={() => setViewingDocType(null)} className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Mock Document Certificate Graphics */}
                            <div className="bg-stone-100 p-8 rounded-2xl border border-stone-200 text-center space-y-4">
                                <div className="border-4 border-double border-stone-400 p-6 bg-amber-50/20 text-stone-800 space-y-3 font-serif">
                                    <h3 className="text-lg font-bold tracking-widest text-stone-900 border-b border-stone-300 pb-2">
                                        {viewingDocType === 'bizCert' ? '사 업 자 등 록 증' : 
                                         viewingDocType === 'mailOrder' ? '통 신 판 매 업 신 고 증' : '정 산 통 장 사 본'}
                                    </h3>
                                    <div className="text-sm space-y-1 font-sans text-left pt-2">
                                        <p><span className="font-bold">상호/법인명:</span> {selectedProposal.brandName}</p>
                                        <p><span className="font-bold">성명/대표자:</span> {selectedProposal.repName}</p>
                                        <p><span className="font-bold">사업자등록번호:</span> {selectedProposal.businessNum}</p>
                                        {viewingDocType === 'bankBook' && (
                                            <p><span className="font-bold">정산계좌:</span> {selectedProposal.bankName} {selectedProposal.accountNumber} (예금주: {selectedProposal.accountHolder})</p>
                                        )}
                                    </div>
                                    <div className="pt-4 text-xs text-stone-400 font-mono">
                                        [인증필] {viewingDocType === 'bizCert' ? selectedProposal.bizCertFileName : 
                                                viewingDocType === 'mailOrder' ? selectedProposal.mailOrderFileName : selectedProposal.bankBookFileName}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setViewingDocType(null)}
                                className="w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-bold"
                            >
                                서류 확인 완료 (닫기)
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
