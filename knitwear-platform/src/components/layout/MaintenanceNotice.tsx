import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { isMaintenanceActive } from '@/utils/maintenance';

const AVAILABLE = [
    { path: 'calculator', ko: '뜨개 계산기', en: 'Knitting calculators' },
    { path: 'editor', ko: '도안 에디터 (그리기만 가능, 저장 불가)', en: 'Chart editor (drawing only, no saving)' },
    { path: 'tutorials', ko: '튜토리얼', en: 'Tutorials' },
    { path: 'blog', ko: '블로그', en: 'Blog' },
    { path: 'shop', ko: '뜨개 쇼핑 (쿠팡 상품)', en: 'Knitting shop (Coupang products)' },
];

export function MaintenanceNotice({ locale }: { locale: string }) {
    if (!isMaintenanceActive()) return null;
    const isKo = locale === 'ko';

    return (
        <div role="status" className="bg-amber-50 border-b border-amber-200 text-amber-900">
            <div className="max-w-6xl mx-auto px-4 py-3 text-sm">
                <p className="flex items-start gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    <span>
                        {isKo
                            ? '11월 13일까지 서비스 점검 중이에요. 서버 사용량 한도 초과로 로그인, 도안 마켓, 커뮤니티, 결제, AI 기능을 잠시 이용할 수 없어요.'
                            : 'We are under maintenance until November 13. Sign-in, the pattern market, community, payments and AI features are temporarily unavailable.'}
                    </span>
                </p>
                <p className="mt-1.5 pl-6 text-amber-800">
                    <span className="font-semibold">{isKo ? '지금 이용할 수 있어요: ' : 'Available now: '}</span>
                    {AVAILABLE.map((item, index) => (
                        <span key={item.path}>
                            {index > 0 && ' · '}
                            <Link href={`/${locale}/${item.path}`} className="underline underline-offset-2 hover:text-amber-950">
                                {isKo ? item.ko : item.en}
                            </Link>
                        </span>
                    ))}
                </p>
            </div>
        </div>
    );
}
