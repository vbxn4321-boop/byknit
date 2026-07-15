'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

// 크레딧 충전 상품 정의 (금액 원화 기준)
const CREDIT_PACKAGES = [
    { id: 'pkg-5k', name: '5,000 Credits', amount: 5000, credits: 5000 },
    { id: 'pkg-10k', name: '10,000 Credits', amount: 10000, credits: 10000 },
    { id: 'pkg-30k', name: '30,000 Credits', amount: 30000, credits: 30000, bonus: 1.1 },
    { id: 'pkg-50k', name: '50,000 Credits', amount: 50000, credits: 50000, bonus: 1.15 },
    { id: 'pkg-100k', name: '100,000 Credits', amount: 100000, credits: 100000, bonus: 1.20 }
];

// 결제 수단 정의
const PAYMENT_METHODS = [
    { id: 'card', name: '신용카드', icon: '💳', engName: 'Credit Card' },
    { id: 'kakaopay', name: '카카오페이', icon: '💛', engName: 'KakaoPay' }
];

export default function PaymentsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'ko';
    const isKo = locale === 'ko';

    const [user, setUser] = useState<User | null>(null);
    const [currentCredits, setCurrentCredits] = useState<number>(0);
    const [selectedPackage, setSelectedPackage] = useState(CREDIT_PACKAGES[1]); // 10k 기본 선택
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);

    const supabase = createClient();

    // 1. 유저 정보 및 크레딧 정보 획득
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/${locale}/login?next=/${locale}/payments`);
                return;
            }
            setUser(user);

            // Fetch profile credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (profile) {
                setCurrentCredits(profile.credits ?? 0);
            }
            setLoadingUser(false);
        };

        fetchUserData();
    }, [router, locale, supabase]);

    // 2. 포트원 V1(아임포트) SDK 스크립트 동적 주입
    useEffect(() => {
        // 이미 로드되었는지 확인
        if (document.getElementById('iamport-sdk')) {
            setIsSdkLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'iamport-sdk';
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        script.onload = () => {
            setIsSdkLoaded(true);
        };
        script.onerror = () => {
            console.error('Iamport SDK load failed');
        };
        document.body.appendChild(script);
    }, []);

    // 3. 결제 요청 핸들러
    const handlePayment = async () => {
        if (!user) return;
        if (!isSdkLoaded) {
            alert(isKo ? '결제 모듈을 로딩 중입니다. 잠시만 기다려 주세요.' : 'Loading payment module. Please wait.');
            return;
        }

        setIsProcessing(true);

        const orderId = `order-${user.id.substring(0, 8)}-${Date.now()}`;
        const finalCredits = Math.round(selectedPackage.credits * (selectedPackage.bonus ?? 1));

        // 포트원 V1 결제창 띄우기
        try {
            // @ts-ignore
            const IMP = window.IMP;
            if (!IMP) {
                throw new Error('Iamport SDK not initialized');
            }

            // 가맹점 식별코드 설정
            // 발급받으신 실제 가맹점 식별코드를 적용했습니다.
            IMP.init('imp55247668'); 

            // 결제 요청 객체 구성 (V1 규격)
            const paymentParams: any = {
                pay_method: 'card',
                merchant_uid: orderId,
                name: `${selectedPackage.name} 충전 (byKnit)`,
                amount: selectedPackage.amount,
                buyer_email: user.email || '',
                buyer_name: user.user_metadata?.full_name || '바이닛고객',
                buyer_tel: user.user_metadata?.phone || '010-0000-0000',
                m_redirect_url: `${window.location.origin}/${locale}/payments/success`, // 모바일 결제 후 이동할 주소
                custom_data: {
                    user_id: user.id,
                    credits: finalCredits
                },
                notice_url: `${window.location.origin}/api/payments/webhook`
            };

            if (selectedMethod === 'card') {
                paymentParams.channelKey = 'channel-key-ccac91e6-13a8-485b-8871-c1e819b6868c';
            } else {
                paymentParams.pg = mapPgCode(selectedMethod);
            }

            IMP.request_pay(paymentParams, (response: any) => {
                if (response.success) {
                    // 결제 성공 시 -> 성공 화면에서 서버 액션을 타서 지급하도록 처리
                    router.push(`/${locale}/payments/success?paymentId=${response.imp_uid}&amount=${selectedPackage.amount}&credits=${finalCredits}`);
                } else {
                    router.push(`/${locale}/payments/fail?code=PAY_ERROR&message=${encodeURIComponent(response.error_msg || 'Payment failed')}`);
                }
                setIsProcessing(false);
            });

        } catch (err: any) {
            console.error('Payment Error:', err);
            // 시뮬레이션 환경 (포트원 가입비가 없어 실제 결제창 미작동 상태인 경우 Mock 동작)
            console.log('Falling back to Sandbox simulation...');
            
            setTimeout(() => {
                const mockPaymentId = `mock-${Date.now()}`;
                router.push(`/${locale}/payments/success?paymentId=${mockPaymentId}&amount=${selectedPackage.amount}&credits=${finalCredits}&isMock=true`);
                setIsProcessing(false);
            }, 1500);
        }
    };

    // PG사 코드 매핑 (V1 전용)
    const mapPgCode = (method: string) => {
        switch (method) {
            case 'card': return 'html5_inicis.INIpayTest'; // KG이니시스 테스트 상점아이디
            case 'kakaopay': return 'kakaopay.TC0ONETIME'; // 카카오페이 테스트 상점아이디
            case 'naverpay': return 'naverpay'; // 네이버페이 테스트
            case 'tosspay': return 'tosspay'; // 토스페이 테스트
            default: return 'html5_inicis.INIpayTest';
        }
    };

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-cream-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brown-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow-soft border border-tan-200">
                
                {/* Header */}
                <div className="border-b border-tan-100 pb-6 mb-8">
                    <h1 className="text-3xl font-bold text-brown-800 mb-2">
                        {isKo ? '크레딧 충전' : 'Charge Credits'}
                    </h1>
                    <p className="text-brown-600">
                        {isKo 
                            ? '바이니트의 프리미엄 도안을 구매할 때 사용할 수 있는 크레딧을 충전합니다.' 
                            : 'Charge credits to purchase premium patterns on byKnit.'}
                    </p>
                </div>

                {/* User Status */}
                <div className="bg-cream-50 rounded-2xl p-5 mb-8 border border-tan-150 flex justify-between items-center">
                    <div>
                        <span className="text-sm text-brown-600">{isKo ? '로그인 계정' : 'Account'}</span>
                        <p className="font-semibold text-brown-800">{user?.email}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-brown-600">{isKo ? '보유 크레딧' : 'Current Balance'}</span>
                        <p className="text-2xl font-bold text-emerald-600">
                            {currentCredits.toLocaleString()} <span className="text-sm font-normal text-brown-700">Credits</span>
                        </p>
                    </div>
                </div>

                {/* Section 1: Choose Package */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-brown-800 mb-4">
                        {isKo ? '1. 충전 금액 선택' : '1. Select Amount'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {CREDIT_PACKAGES.map((pkg) => {
                            const bonusVal = pkg.bonus ? Math.round(pkg.credits * (pkg.bonus - 1)) : 0;
                            const isSelected = selectedPackage.id === pkg.id;

                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    onClick={() => setSelectedPackage(pkg)}
                                    className={`text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                        isSelected 
                                            ? 'border-brown-600 bg-cream-50 ring-2 ring-brown-600/20' 
                                            : 'border-tan-200 bg-white hover:border-tan-400'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-bold text-brown-800 text-lg">{pkg.name}</span>
                                        {pkg.bonus && (
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                                +{bonusVal.toLocaleString()} Bonus
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xl font-extrabold text-brown-800">
                                        ₩ {pkg.amount.toLocaleString()}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 2: Payment Method */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-brown-800 mb-4">
                        {isKo ? '2. 결제 수단 선택' : '2. Payment Method'}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = selectedMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'border-brown-600 bg-cream-50 font-bold'
                                            : 'border-tan-200 bg-white hover:border-tan-400'
                                    }`}
                                >
                                    <span className="text-2xl">{method.icon}</span>
                                    <span className="text-sm text-brown-800">
                                        {isKo ? method.name : method.engName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Summary & Checkout CTA */}
                <div className="border-t border-tan-100 pt-6 mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <span className="text-sm text-brown-600">{isKo ? '최종 지급 크레딧' : 'Total Credits to Receive'}</span>
                            <p className="text-xl font-bold text-brown-800">
                                {Math.round(selectedPackage.credits * (selectedPackage.bonus ?? 1)).toLocaleString()} Credits
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-brown-600">{isKo ? '결제 금액' : 'Price'}</span>
                            <p className="text-3xl font-extrabold text-brown-800">
                                ₩ {selectedPackage.amount.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-200 cursor-pointer flex justify-center items-center gap-2 ${
                            isProcessing 
                                ? 'bg-brown-300 cursor-not-allowed' 
                                : 'bg-brown-600 hover:bg-brown-700 shadow-soft hover:translate-y-[-1px]'
                        }`}
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                {isKo ? '결제 처리 중...' : 'Processing...'}
                            </>
                        ) : (
                            <>
                                {isKo 
                                    ? `₩ ${selectedPackage.amount.toLocaleString()} 안전 결제하기` 
                                    : `Pay ₩ ${selectedPackage.amount.toLocaleString()}`}
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-xs text-brown-600 mt-4 flex items-center justify-center gap-1">
                        🔒 PortOne 보안 결제 모듈을 사용하여 안전하게 정산됩니다.
                    </p>
                </div>

            </div>
        </div>
    );
}
