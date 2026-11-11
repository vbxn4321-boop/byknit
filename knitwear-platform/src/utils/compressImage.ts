// 브라우저 전용: 업로드 전에 사진을 줄여 Supabase 저장 용량과 전송량(egress)을 아낀다.

/** 업로드 파일명에 타임스탬프나 UUID가 붙어 내용이 바뀌지 않으므로 브라우저가 1년간 캐시해도 된다 */
export const IMAGE_CACHE_SECONDS = '31536000';

const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

function encode(bitmap: ImageBitmap, width: number, height: number, type: string, quality: number): Promise<Blob | null> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    if (type === 'image/jpeg') {
        // JPEG는 투명도를 지원하지 않으므로 투명 영역을 흰색으로 채운다
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

/**
 * 긴 변을 maxSide 이하로 줄이고 WebP(미지원 브라우저는 JPEG)로 다시 저장한다.
 * 줄일 수 없거나 결과가 더 크면 원본을 그대로 돌려준다.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<File> {
    if (typeof window === 'undefined' || !file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) {
        return file;
    }

    let bitmap: ImageBitmap;
    try {
        // HEIC처럼 브라우저가 읽지 못하는 형식은 여기서 실패하므로 원본을 올린다
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    try {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        let blob = await encode(bitmap, width, height, 'image/webp', quality);
        // Safari 등 WebP 인코딩을 지원하지 않는 브라우저는 PNG를 돌려주므로 JPEG로 다시 시도한다
        if (!blob || blob.type !== 'image/webp') {
            blob = await encode(bitmap, width, height, 'image/jpeg', quality);
        }
        if (!blob || blob.size >= file.size) return file;

        const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
        const baseName = file.name.replace(/\.[^.]*$/, '') || 'image';
        return new File([blob], `${baseName}.${extension}`, { type: blob.type, lastModified: Date.now() });
    } catch {
        return file;
    } finally {
        bitmap.close();
    }
}
