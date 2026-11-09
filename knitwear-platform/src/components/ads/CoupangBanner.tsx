// 쿠팡파트너스 다이나믹 배너 (공개 값).
// 발급 코드는 g.js 스크립트 형식이지만 React 안에서는 실행 위치를 보장할 수 없어 위젯 페이지를 iframe으로 직접 띄운다.
const WIDGET_ID = 1048290;
const TRACKING_CODE = 'AF4939539';
const WIDTH = 320;
const HEIGHT = 140;

const WIDGET_SRC = `https://ads-partners.coupang.com/widgets.html?id=${WIDGET_ID}&template=carousel&trackingCode=${TRACKING_CODE}&subId=&width=${WIDTH}&height=${HEIGHT}&tsource=`;

// 쿠팡은 국내 배송 위주이므로 한국어 페이지에만 노출한다.
// 대가성 문구는 쿠팡파트너스 고지 의무 사항이라 배너와 항상 함께 표시해야 한다.
export function CoupangBanner({ locale, className }: { locale: string; className?: string }) {
    if (locale !== 'ko') return null;

    return (
        <div className={className}>
            <p className="text-[10px] font-bold text-stone-400 tracking-wider uppercase mb-1">광고</p>
            <div className="flex justify-center overflow-hidden rounded-lg">
                <iframe
                    src={WIDGET_SRC}
                    title="쿠팡 추천 상품 광고"
                    width={WIDTH}
                    height={HEIGHT}
                    scrolling="no"
                    referrerPolicy="unsafe-url"
                    className="max-w-full border-0"
                />
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-stone-400">
                이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
        </div>
    );
}
