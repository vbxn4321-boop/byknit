'use client';

import React, { useState } from 'react';
import { 
    Store, 
    Upload, 
    Check, 
    FileText, 
    Building2, 
    CreditCard, 
    Mail, 
    Phone, 
    User, 
    Globe, 
    ShieldCheck, 
    Sparkles, 
    ArrowLeft,
    CheckCircle2,
    HelpCircle,
    FileCheck
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export interface StoreProposal {
    id: string;
    brandName: string;
    repName: string;
    email: string;
    phone: string;
    sellerType: 'individual' | 'biz_general' | 'biz_simplified' | 'corporate';
    businessNum: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    category: string;
    intro: string;
    portfolioUrl: string;
    bizCertFileName?: string;
    bankBookFileName?: string;
    mailOrderFileName?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectReason?: string;
    createdAt: string;
}

export default function SellerProposalPage() {
    const params = useParams();
    const router = useRouter();
    const locale = (params?.locale as string) || 'ko';

    // Form States
    const [brandName, setBrandName] = useState('');
    const [repName, setRepName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [sellerType, setSellerType] = useState<'individual' | 'biz_general' | 'biz_simplified' | 'corporate'>('biz_general');
    const [businessNum, setBusinessNum] = useState('');
    const [bankName, setBankName] = useState('신한은행');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [category, setCategory] = useState('yarn');
    const [intro, setIntro] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');

    // Document File Upload States
    const [bizCertFile, setBizCertFile] = useState<File | null>(null);
    const [bankBookFile, setBankBookFile] = useState<File | null>(null);
    const [mailOrderFile, setMailOrderFile] = useState<File | null>(null);

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!brandName.trim() || !repName.trim() || !email.trim() || !phone.trim()) {
            alert(locale === 'ko' ? '기본 브랜드 정보 및 담당자 연락처를 모두 기입해 주세요.' : 'Please fill in all basic contact info.');
            return;
        }

        if (sellerType !== 'individual' && !businessNum.trim()) {
            alert(locale === 'ko' ? '사업자등록번호를 기입해 주세요.' : 'Please enter Business Registration Number.');
            return;
        }

        if (!accountNumber.trim() || !accountHolder.trim()) {
            alert(locale === 'ko' ? '정산 은행 계좌 정보를 기입해 주세요.' : 'Please fill in payout bank account information.');
            return;
        }

        // Check required files
        if (sellerType !== 'individual' && !bizCertFile) {
            alert(locale === 'ko' ? '사업자등록증 사본 파일(이미지/PDF)을 반드시 첨부해 주세요.' : 'Please upload your Business Registration Certificate file.');
            return;
        }

        if (!bankBookFile) {
            alert(locale === 'ko' ? '정산 통장 사본 파일(이미지/PDF)을 반드시 첨부해 주세요.' : 'Please upload your Bankbook Copy file.');
            return;
        }

        if (!mailOrderFile) {
            alert(locale === 'ko' ? '통신판매업신고증 사본 파일(이미지/PDF)을 반드시 첨부해 주세요.' : 'Please upload your Mail-order Business Registration file.');
            return;
        }

        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert(locale === 'ko' ? '입점 신청은 로그인 후 가능합니다.' : 'Please log in to submit a seller application.');
                router.push(`/${locale}/login`);
                return;
            }

            const { error } = await supabase.from('seller_applications').insert({
                user_id: user.id,
                brand_name: brandName.trim(),
                rep_name: repName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                seller_type: sellerType,
                business_num: sellerType === 'individual' ? null : businessNum.trim(),
                bank_name: bankName,
                account_number: accountNumber.trim(),
                account_holder: accountHolder.trim(),
                category,
                intro: intro.trim() || null,
                portfolio_url: portfolioUrl.trim() || null,
                biz_cert_file_name: bizCertFile ? bizCertFile.name : null,
                bank_book_file_name: bankBookFile.name,
                mail_order_file_name: mailOrderFile.name,
            });

            if (error) {
                if (error.code === '23505') {
                    alert(locale === 'ko' ? '이미 심사 대기 중인 입점 신청이 있습니다.' : 'You already have a pending application.');
                } else {
                    alert((locale === 'ko' ? '신청 접수에 실패했습니다: ' : 'Submission failed: ') + error.message);
                }
                return;
            }

            setIsSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F8] py-12 px-4 sm:px-6 lg:px-8 font-sans text-stone-700">
            <div className="max-w-4xl mx-auto space-y-10">
                
                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                    <Link 
                        href={`/${locale}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors bg-white px-4 py-2 rounded-2xl border border-stone-200 shadow-soft"
                    >
                        <ArrowLeft size={14} />
                        <span>메인 홈으로 돌아가기</span>
                    </Link>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                        <Sparkles size={12} />
                        <span>바이니트 파트너십 오픈</span>
                    </span>
                </div>

                {/* Hero Banner Card */}
                <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden space-y-6">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-3 relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold text-emerald-300 border border-white/10">
                            <Store size={14} />
                            <span>바이니트 공식 입점 제안 센터</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            국내 최고의 손뜨개 크리에이터 & 털실 브랜드를 기다립니다
                        </h1>
                        <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                            합리적인 수수료 혜택과 뜨개질 전문 커뮤니티 타겟 마케팅, 그리고 AI 도안 도우미가 부착된 7대 스마트 카탈로그로 바이니트와 함께 성장하세요.
                        </p>
                    </div>

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10 text-sm">
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-1">
                            <span className="font-bold text-emerald-300 block">✨ 3.5% 파격 수수료 혜택</span>
                            <span className="text-stone-300 text-sm">입점 첫 6개월 판매 수수료 인하 혜택 제공</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-1">
                            <span className="font-bold text-emerald-300 block">📦 CJ대한통운 등 8대 택배</span>
                            <span className="text-stone-300 text-sm">배송비 묶음그룹 및 2/3권역 자동 정산 시스템</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10 space-y-1">
                            <span className="font-bold text-emerald-300 block">🤖 AI 도안 연동 마케팅</span>
                            <span className="text-stone-300 text-sm">AI 패턴 생성기 내 실 추천 노출 시너지</span>
                        </div>
                    </div>
                </div>

                {/* Submission Completed Card */}
                {isSubmitted ? (
                    <div className="bg-white p-10 rounded-3xl border border-stone-200 shadow-soft text-center space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 animate-bounce">
                            <CheckCircle2 size={32} />
                        </div>

                        <div className="space-y-2 max-w-md mx-auto">
                            <h2 className="text-xl font-bold text-stone-900">입점 제안서가 성공적으로 접수되었습니다!</h2>
                            <p className="text-sm text-stone-500 font-medium leading-relaxed">
                                제출해 주신 <span className="font-bold text-stone-800">사업자등록증</span> 및 <span className="font-bold text-stone-800">통장사본</span>은 본사 검토를 거쳐 2~3 영업일 내로 안내드립니다.
                            </p>
                        </div>

                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 max-w-md mx-auto text-left text-sm space-y-2">
                            <div className="flex justify-between border-b border-stone-150 pb-2">
                                <span className="text-stone-400 font-bold">신청 브랜드/상호명</span>
                                <span className="font-bold text-stone-900">{brandName}</span>
                            </div>
                            <div className="flex justify-between border-b border-stone-150 pb-2">
                                <span className="text-stone-400 font-bold">대표자명</span>
                                <span className="font-bold text-stone-900">{repName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-400 font-bold">담당자 이메일</span>
                                <span className="font-bold text-blue-600">{email}</span>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-center gap-3">
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-sm font-bold transition-all"
                            >
                                추가 입점 제안하기
                            </button>
                            <Link
                                href={`/${locale}`}
                                className="px-6 py-3 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl text-sm font-bold transition-all shadow-soft"
                            >
                                메인 홈페이지로 가기
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Main Form */
                    <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-3xl border border-stone-200/80 shadow-soft space-y-8 animate-fadeIn">
                        <div className="border-b border-stone-150 pb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                    <FileText className="text-emerald-600" size={20} />
                                    <span>입점 제안서 및 파트너 신청서 작성</span>
                                </h2>
                                <p className="text-sm text-stone-400 font-medium mt-1">
                                    아래 필수 항목과 사업자 서류를 첨부해 주시면 본사 심사팀에서 신속히 검토 후 연락드립니다.
                                </p>
                            </div>
                        </div>

                        {/* Section 1: Basic Brand & Contact Info */}
                        <div className="space-y-4">
                            <span className="text-sm font-bold text-stone-800 uppercase tracking-wider block border-l-4 border-emerald-500 pl-2">
                                1. 브랜드 및 담당자 정보
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">상호명 / 브랜드명 *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="예: 차도운의 손뜨개 공방"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">대표자 성함 *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="예: 차도운"
                                        value={repName}
                                        onChange={(e) => setRepName(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">담당자 이메일 *</label>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="example@knit.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">휴대폰 번호 (연락처) *</label>
                                    <input 
                                        type="tel" 
                                        required
                                        placeholder="010-1234-5678"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Business & Payout Info */}
                        <div className="space-y-4 pt-4 border-t border-stone-150">
                            <span className="text-sm font-bold text-stone-800 uppercase tracking-wider block border-l-4 border-emerald-500 pl-2">
                                2. 사업자 구분 및 정산 계좌
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">사업자 과세 유형 *</label>
                                    <select
                                        value={sellerType}
                                        onChange={(e) => setSellerType(e.target.value as any)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white text-stone-800 font-bold"
                                    >
                                        <option value="biz_general">개인 사업자 (일반과세)</option>
                                        <option value="biz_simplified">개인 사업자 (간이과세)</option>
                                        <option value="corporate">법인 사업자</option>
                                        <option value="individual">개인 작가/크리에이터 (비사업자)</option>
                                    </select>
                                </div>

                                {sellerType !== 'individual' ? (
                                    <div>
                                        <label className="block text-sm font-bold text-stone-700 mb-1.5">사업자등록번호 *</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="123-45-67890"
                                            value={businessNum}
                                            onChange={(e) => setBusinessNum(e.target.value)}
                                            className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center pt-6 text-stone-400 text-sm font-medium">
                                        ※ 개인 작가의 경우 사업자번호 기입 없이 입점 신청이 가능합니다.
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">정산 은행 *</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white text-stone-800 font-bold"
                                    >
                                        <option value="신한은행">신한은행</option>
                                        <option value="국민은행">KB국민은행</option>
                                        <option value="카카오뱅크">카카오뱅크</option>
                                        <option value="농협은행">NH농협은행</option>
                                        <option value="우리은행">우리은행</option>
                                        <option value="하나은행">하나은행</option>
                                        <option value="토스뱅크">토스뱅크</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">정산 계좌번호 *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="하이픈(-) 포함하여 입력"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">예금주명 (대표자/법인명과 동일) *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="예: 차도운 (대표자명과 일치해야 함)"
                                        value={accountHolder}
                                        onChange={(e) => setAccountHolder(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: REQUIRED FILE UPLOADS (사업자등록증 & 통장사본) */}
                        <div className="space-y-4 pt-4 border-t border-stone-150">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-stone-800 uppercase tracking-wider block border-l-4 border-emerald-500 pl-2">
                                    3. 필수 증빙 서류 파일 첨부
                                </span>
                                <span className="text-sm text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                                    JPG, PNG, PDF 지원 (최대 10MB)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Business Certificate Upload */}
                                {sellerType !== 'individual' && (
                                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                                <Building2 size={14} className="text-emerald-600" />
                                                <span>사업자등록증 사본 *</span>
                                            </span>
                                            {bizCertFile && (
                                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <FileCheck size={10} />
                                                    <span>첨부완료</span>
                                                </span>
                                            )}
                                        </div>

                                        <label className="border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors space-y-1 text-center">
                                            <Upload size={20} className={bizCertFile ? "text-emerald-500" : "text-stone-400"} />
                                            <span className="text-sm font-bold text-stone-700 truncate max-w-[200px]">
                                                {bizCertFile ? bizCertFile.name : '사업자등록증 파일 선택'}
                                            </span>
                                            <span className="text-xs text-stone-400">클릭하여 사업자등록증 이미지/PDF 업로드</span>
                                            <input 
                                                type="file" 
                                                accept="image/*,application/pdf"
                                                onChange={(e) => e.target.files?.[0] && setBizCertFile(e.target.files[0])}
                                                className="hidden" 
                                            />
                                        </label>
                                    </div>
                                )}

                                {/* Bankbook Copy Upload */}
                                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                            <CreditCard size={14} className="text-emerald-600" />
                                            <span>통장 사본 (정산 계좌) *</span>
                                        </span>
                                        {bankBookFile && (
                                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <FileCheck size={10} />
                                                <span>첨부완료</span>
                                            </span>
                                        )}
                                    </div>

                                    <label className="border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors space-y-1 text-center">
                                        <Upload size={20} className={bankBookFile ? "text-emerald-500" : "text-stone-400"} />
                                        <span className="text-sm font-bold text-stone-700 truncate max-w-[200px]">
                                            {bankBookFile ? bankBookFile.name : '통장 사본 파일 선택'}
                                        </span>
                                        <span className="text-xs text-stone-400">클릭하여 정산통장 사본 이미지/PDF 업로드</span>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            onChange={(e) => e.target.files?.[0] && setBankBookFile(e.target.files[0])}
                                            className="hidden" 
                                        />
                                    </label>
                                </div>

                                {/* Mail-order Business Registration Upload */}
                                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                                            <FileText size={14} className="text-emerald-600" />
                                            <span>통신판매업신고증 사본 *</span>
                                        </span>
                                        {mailOrderFile && (
                                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <FileCheck size={10} />
                                                <span>첨부완료</span>
                                            </span>
                                        )}
                                    </div>

                                    <label className="border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors space-y-1 text-center">
                                        <Upload size={20} className={mailOrderFile ? "text-emerald-500" : "text-stone-400"} />
                                        <span className="text-sm font-bold text-stone-700 truncate max-w-[200px]">
                                            {mailOrderFile ? mailOrderFile.name : '통신판매업신고증 파일 선택'}
                                        </span>
                                        <span className="text-xs text-stone-400">클릭하여 통신판매업신고증 이미지/PDF 업로드</span>
                                        <input 
                                            type="file" 
                                            accept="image/*,application/pdf"
                                            onChange={(e) => e.target.files?.[0] && setMailOrderFile(e.target.files[0])}
                                            className="hidden" 
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Products & Portfolio Intro */}
                        <div className="space-y-4 pt-4 border-t border-stone-150">
                            <span className="text-sm font-bold text-stone-800 uppercase tracking-wider block border-l-4 border-emerald-500 pl-2">
                                4. 주요 취급 상품 및 브랜드 소개
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">주요 카테고리 *</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white text-stone-800 font-bold"
                                    >
                                        <option value="yarn">털실 / 실 (울, 모헤어, 코튼 등)</option>
                                        <option value="needle">바늘 / 부자재 (조립식 대바늘 등)</option>
                                        <option value="kit">DIY 니팅 패키지 / 키트</option>
                                        <option value="finished">완성품 (손뜨개 의류/소품)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">홈페이지 / SNS / 자사몰 주소</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://instagram.com/your_brand"
                                        value={portfolioUrl}
                                        onChange={(e) => setPortfolioUrl(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-bold text-stone-700 mb-1.5">브랜드 소개 및 제안 내용</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="브랜드에 대한 간단한 소개나 주요 판매 상품 라인업을 작성해 주세요."
                                        value={intro}
                                        onChange={(e) => setIntro(e.target.value)}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 text-stone-800 font-bold resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl text-base font-bold transition-all shadow-soft flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                <span>입점 제안서 및 증빙 서류 제출하기</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
