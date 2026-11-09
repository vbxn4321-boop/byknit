// 서버 전용: 포트원 V1 REST API 어댑터. 결제창이 V1 SDK(imp_uid)를 쓰므로 조회/취소도 V1으로 한다.
// 'use server' 파일이 아니므로 브라우저에서 직접 호출할 수 없다.
const API_BASE = 'https://api.iamport.kr';

export interface PortonePayment {
    id: string;
    status: 'PAID' | 'CANCELLED' | 'OTHER';
    amount: number;
    customData: any;
}

async function getAccessToken(): Promise<string | null> {
    const impKey = process.env.PORTONE_IMP_KEY;
    const impSecret = process.env.PORTONE_IMP_SECRET;
    if (!impKey || !impSecret) {
        console.error('[PortOne] PORTONE_IMP_KEY / PORTONE_IMP_SECRET are not configured');
        return null;
    }

    const response = await fetch(`${API_BASE}/users/getToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
        cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.code !== 0) {
        console.error(`[PortOne] Token request failed: ${response.status} ${body?.message ?? ''}`);
        return null;
    }
    return body.response.access_token;
}

function parseCustomData(raw: unknown): any {
    if (!raw || typeof raw !== 'string') return raw ?? null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function normalizeStatus(status: unknown): PortonePayment['status'] {
    if (status === 'paid') return 'PAID';
    if (status === 'cancelled') return 'CANCELLED';
    return 'OTHER';
}

/** 포트원에서 결제 정보를 조회한다. 조회에 실패하면 null을 반환한다. */
export async function fetchPortonePayment(impUid: string): Promise<PortonePayment | null> {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE}/payments/${encodeURIComponent(impUid)}`, {
        headers: { Authorization: token },
        cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.code !== 0 || !body.response) {
        console.error(`[PortOne] Payment lookup failed: ${response.status} ${body?.message ?? ''}`);
        return null;
    }

    return {
        id: body.response.imp_uid,
        status: normalizeStatus(body.response.status),
        amount: Number(body.response.amount) || 0,
        customData: parseCustomData(body.response.custom_data),
    };
}

/** 포트원에 전액 취소를 요청한다. 이미 취소된 결제도 성공으로 본다. */
export async function cancelPortonePayment(impUid: string, reason: string): Promise<boolean> {
    const payment = await fetchPortonePayment(impUid);
    if (!payment) return false;
    if (payment.status === 'CANCELLED') return true;

    const token = await getAccessToken();
    if (!token) return false;

    const response = await fetch(`${API_BASE}/payments/cancel`, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imp_uid: impUid, reason, amount: payment.amount, checksum: payment.amount }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.code !== 0) {
        console.error(`[PortOne] Cancel failed: ${response.status} ${body?.message ?? ''}`);
        return false;
    }
    return true;
}
