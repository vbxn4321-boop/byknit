// Supabase Storage의 원본 사진 대신 Vercel 이미지 최적화(/_next/image)를 거친 작은 WebP를 쓴다.
// 최적화 결과는 Vercel에 캐시되므로 Supabase에서는 크기별로 한 번만 내려받는다.

const SUPABASE_PUBLIC_OBJECT = /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\//;

/** next.config의 기본 imageSizes/deviceSizes에 있는 값만 쓸 수 있다. 종류를 줄일수록 변환 횟수가 줄어든다. */
export type ImageWidth = 128 | 640 | 1080;

export function optimizedImageUrl(url: string | null | undefined, width: ImageWidth): string | undefined {
    if (!url) return undefined;
    if (!SUPABASE_PUBLIC_OBJECT.test(url)) return url;
    return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
