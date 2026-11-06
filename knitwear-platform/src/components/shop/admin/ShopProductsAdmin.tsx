'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import RichTextEditor from '@/components/common/RichTextEditor';
import { createClient } from '@/utils/supabase/client';
import { adminDeleteShopProduct, adminListShopProducts, adminSaveShopProduct } from '@/app/actions/shopAdmin';
import { SHOP_CATEGORIES, shopCategoryLabel } from '@/constants/shop';
import type { ShopProduct, ShopProductInput } from '@/types/shop';

const BUCKET = 'shop-products';
const MAX_IMAGES = 8;

const EMPTY_FORM: ShopProductInput = {
    name: '',
    category: 'needles',
    summary: '',
    description: '',
    priceKrw: 0,
    stock: 0,
    images: [],
    isActive: true,
};

function toForm(product: ShopProduct): ShopProductInput {
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        summary: product.summary ?? '',
        description: product.description ?? '',
        priceKrw: product.price_krw,
        stock: product.stock,
        images: product.images,
        isActive: product.is_active,
    };
}

export function ShopProductsAdmin() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState<ShopProductInput | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        const result = await adminListShopProducts();
        setProducts(result.products);
        setError(result.error ?? '');
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleUpload = async (files: FileList | null) => {
        if (!files?.length || !form) return;
        setUploading(true);
        setError('');

        const supabase = createClient();
        const uploaded: string[] = [];
        for (const file of Array.from(files).slice(0, MAX_IMAGES - form.images.length)) {
            // 스토리지 키에는 한글을 쓸 수 없어 원본 파일명 대신 무작위 이름을 쓴다
            const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const path = `${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
            if (uploadError) {
                setError(`이미지 업로드 실패 (${file.name}): ${uploadError.message}`);
                break;
            }
            uploaded.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
        }

        setForm(prev => (prev ? { ...prev, images: [...prev.images, ...uploaded] } : prev));
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const moveImage = (index: number, delta: number) => {
        setForm(prev => {
            if (!prev) return prev;
            const images = [...prev.images];
            const target = index + delta;
            if (target < 0 || target >= images.length) return prev;
            [images[index], images[target]] = [images[target], images[index]];
            return { ...prev, images };
        });
    };

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setError('');
        const result = await adminSaveShopProduct(form);
        setSaving(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setForm(null);
        load();
    };

    const handleDelete = async (product: ShopProduct) => {
        if (!window.confirm(`'${product.name}' 상품을 삭제할까요?\n주문 이력이 있으면 삭제하지 않고 판매 중지합니다.`)) return;
        const result = await adminDeleteShopProduct(product.id);
        if (result.error) {
            setError(result.error);
            return;
        }
        if (result.result === 'hidden') {
            window.alert('주문 이력이 있어 판매 중지로 변경했습니다.');
        }
        load();
    };

    const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200';
    const labelClass = 'block text-sm font-bold text-stone-700 mb-1.5';

    if (form) {
        return (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-stone-900">{form.id ? '상품 수정' : '새 상품 등록'}</h2>
                    <button type="button" aria-label="닫기" onClick={() => setForm(null)} className="text-stone-400 hover:text-stone-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div>
                    <label htmlFor="shop-name" className={labelClass}>상품명</label>
                    <input id="shop-name" maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="shop-category" className={labelClass}>카테고리</label>
                        <select id="shop-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                            {SHOP_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.ko}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="shop-price" className={labelClass}>가격 (원)</label>
                        <input id="shop-price" type="number" min={100} step={100} value={form.priceKrw || ''} onChange={e => setForm({ ...form, priceKrw: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="shop-stock" className={labelClass}>재고 (개)</label>
                        <input id="shop-stock" type="number" min={0} step={1} value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className={inputClass} />
                    </div>
                </div>

                <div>
                    <label htmlFor="shop-summary" className={labelClass}>한 줄 소개 (선택)</label>
                    <input id="shop-summary" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} className={inputClass} />
                </div>

                <div>
                    <p className={labelClass}>상품 이미지 (첫 번째가 대표 이미지, 최대 {MAX_IMAGES}장)</p>
                    <div className="flex flex-wrap gap-3">
                        {form.images.map((src, index) => (
                            <div key={src} className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-200 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`상품 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                                {index === 0 && (
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-stone-900 text-white text-[10px] font-bold">대표</span>
                                )}
                                <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/50 text-white">
                                    <button type="button" aria-label="앞으로 이동" onClick={() => moveImage(index, -1)} className="p-1"><ChevronLeft className="w-4 h-4" /></button>
                                    <button type="button" aria-label="이미지 삭제" onClick={() => setForm({ ...form, images: form.images.filter(i => i !== src) })} className="p-1"><Trash2 className="w-4 h-4" /></button>
                                    <button type="button" aria-label="뒤로 이동" onClick={() => moveImage(index, 1)} className="p-1"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                        {form.images.length < MAX_IMAGES && (
                            <button
                                type="button"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="w-28 h-28 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 flex flex-col items-center justify-center gap-1 text-xs font-bold hover:border-stone-400 disabled:opacity-50"
                            >
                                <ImagePlus className="w-6 h-6" />
                                {uploading ? '업로드 중...' : '이미지 추가'}
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={e => handleUpload(e.target.files)}
                    />
                    <p className="text-xs text-stone-400 mt-2">JPG, PNG, WEBP · 장당 5MB 이하</p>
                </div>

                <div>
                    <p className={labelClass}>상세 설명</p>
                    <RichTextEditor
                        key={form.id ?? 'new'}
                        content={form.description ?? ''}
                        onChange={description => setForm(prev => (prev ? { ...prev, description } : prev))}
                        minHeight="360px"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-stone-700">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                    샵에 공개 (판매 중)
                </label>

                {error && <p role="alert" className="p-3 rounded-xl bg-rose-50 text-sm text-rose-600">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-600">취소</button>
                    <button type="button" onClick={handleSave} disabled={saving || uploading} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-50">
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-stone-500">상품 {products.length}개</p>
                <button type="button" onClick={() => setForm({ ...EMPTY_FORM })} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600">
                    <Plus className="w-4 h-4" />
                    상품 등록
                </button>
            </div>

            {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 text-sm text-rose-600">{error}</p>}

            {loading ? (
                <p className="py-16 text-center text-sm text-stone-400">불러오는 중...</p>
            ) : products.length === 0 ? (
                <p className="py-16 text-center text-sm text-stone-400 bg-white rounded-2xl border border-stone-200">등록된 상품이 없습니다. 첫 상품을 등록해 보세요.</p>
            ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-stone-500 border-b border-stone-200">
                            <tr>
                                <th className="p-4 font-bold">상품</th>
                                <th className="p-4 font-bold">카테고리</th>
                                <th className="p-4 font-bold text-right">가격</th>
                                <th className="p-4 font-bold text-right">재고</th>
                                <th className="p-4 font-bold">상태</th>
                                <th className="p-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="border-b border-stone-100 last:border-0">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3 min-w-48">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                                                {product.images[0] && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <span className="font-medium text-stone-800">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-stone-600 whitespace-nowrap">{shopCategoryLabel(product.category, 'ko')}</td>
                                    <td className="p-4 text-right text-stone-800 whitespace-nowrap">₩{product.price_krw.toLocaleString()}</td>
                                    <td className={`p-4 text-right font-medium ${product.stock === 0 ? 'text-rose-500' : 'text-stone-800'}`}>{product.stock}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                            {product.is_active ? '판매 중' : '판매 중지'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-1">
                                            <button type="button" aria-label={`${product.name} 수정`} onClick={() => setForm(toForm(product))} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button type="button" aria-label={`${product.name} 삭제`} onClick={() => handleDelete(product)} className="p-2 rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
