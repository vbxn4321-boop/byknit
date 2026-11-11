// Supabase 무료 플랜 전송량 초과로 DB/로그인/저장소가 막힌 기간의 점검 안내.
// 이 시각이 지나면 배너와 결제 차단이 자동으로 사라진다. 일찍 복구되면 값을 과거로 바꿔 배포한다.
export const MAINTENANCE_UNTIL = Date.parse('2026-11-14T00:00:00+09:00');

export function isMaintenanceActive(now = Date.now()): boolean {
    return now < MAINTENANCE_UNTIL;
}

export function maintenancePaymentMessage(isKo: boolean): string {
    return isKo
        ? '11월 13일까지 서비스 점검 중이라 결제를 받을 수 없어요. 점검이 끝난 뒤 다시 시도해 주세요.'
        : 'Payments are paused for maintenance until November 13. Please try again afterwards.';
}
