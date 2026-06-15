'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Loader2, FileText, Image as ImageIcon, Plus, HelpCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createPdfPattern } from '@/app/actions/pattern';
import RichTextEditor from '../common/RichTextEditor';
import { YarnPart } from '../studio/types';
import { NeedleSelector } from '../common/NeedleSelector';
import { UnitInput } from '../common/UnitInput';

// Taxonomy Definitions (Copied from GridEditor)
const CATEGORY_TAXONOMY = {
    clothing: {
        label: { en: 'Clothing', ko: '의류' },
        sub: [
            { id: 'sweater', label: { en: 'Sweater/Pullover', ko: '스웨터/풀오버' } },
            { id: 'cardigan', label: { en: 'Cardigan', ko: '가디건' } },
            { id: 'vest', label: { en: 'Vest', ko: '조끼/베스트' } },
            { id: 'top', label: { en: 'Top/Tee', ko: '상의/티셔츠' } },
            { id: 'dress', label: { en: 'Dress/Skirt', ko: '원피스/스커트' } },
            { id: 'outer', label: { en: 'Coat/Jacket', ko: '아우터/코트' } },
            { id: 'intimates', label: { en: 'Intimates/Swim', ko: '속옷/수영복' } },
        ]
    },
    accessory: {
        label: { en: 'Accessories', ko: '액세서리/잡화' },
        sub: [
            { id: 'scarf', label: { en: 'Scarf/Cowl', ko: '목도리/워머' } },
            { id: 'shawl', label: { en: 'Shawl/Wrap', ko: '숄/랩' } },
            { id: 'hat', label: { en: 'Hat/Beanie', ko: '모자/비니' } },
            { id: 'gloves', label: { en: 'Gloves/Mittens', ko: '장갑/워머' } },
            { id: 'socks', label: { en: 'Socks/Footwear', ko: '양말/신발' } },
            { id: 'bag', label: { en: 'Bag/Purse', ko: '가방/파우치' } },
            { id: 'jewelry', label: { en: 'Headwear/Jewelry', ko: '헤어/주얼리' } },
        ]
    },
    home: {
        label: { en: 'Home/Living', ko: '홈/리빙' },
        sub: [
            { id: 'blanket', label: { en: 'Blanket', ko: '담요/블랭킷' } },
            { id: 'cushion', label: { en: 'Cushion', ko: '쿠션' } },
            { id: 'scrubber', label: { en: 'Scrubber', ko: '수세미' } },
            { id: 'coaster', label: { en: 'Coaster/Mat', ko: '코스터/매트' } },
            { id: 'basket', label: { en: 'Basket/Storage', ko: '바구니/정리함' } },
            { id: 'cover', label: { en: 'Cover/Case', ko: '커버/케이스' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    baby: {
        label: { en: 'Baby/Kids', ko: '유아/아동' },
        sub: [
            { id: 'baby_clothes', label: { en: 'Baby Clothes', ko: '의류' } },
            { id: 'baby_hat', label: { en: 'Hat/Bonnet', ko: '모자/보넷' } },
            { id: 'baby_socks', label: { en: 'Socks/Booties', ko: '양말/신발' } },
            { id: 'baby_blanket', label: { en: 'Baby Blanket', ko: '겉싸개/담요' } },
            { id: 'baby_etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    toy_hobby: {
        label: { en: 'Toys & Hobbies', ko: '장난감/취미' },
        sub: [
            { id: 'doll', label: { en: 'Doll/Toy', ko: '인형' } },
            { id: 'amigurumi', label: { en: 'Amigurumi', ko: '아미구루미' } },
            { id: 'ornament', label: { en: 'Ornament', ko: '장식품/오너먼트' } },
        ]
    },
    pet: {
        label: { en: 'Pets', ko: '애완동물' },
        sub: [
            { id: 'pet_clothes', label: { en: 'Pet Clothes', ko: '강아지/고양이 옷' } },
            { id: 'pet_toy', label: { en: 'Pet Toy', ko: '장난감' } },
            { id: 'pet_access', label: { en: 'Pet Accessories', ko: '액세서리' } },
        ]
    },
    other: {
        label: { en: 'Others', ko: '기타' },
        sub: [
            { id: 'pattern_component', label: { en: 'Component/Stitch Pattern', ko: '패턴/스티치 (부분)' } },
            { id: 'chart', label: { en: 'Chart Only', ko: '차트/도안' } },
            { id: 'button', label: { en: 'Button/Component', ko: '단추/부자재' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    }
};

const YARN_WEIGHTS = [
    { id: 'lace', label: 'Lace (레이스)' },
    { id: 'fingering', label: 'Fingering (핑거링/4ply)' },
    { id: 'sport', label: 'Sport (스포트/5ply)' },
    { id: 'dk', label: 'DK (DK/8ply)' },
    { id: 'worsted', label: 'Worsted (워스티드/10ply)' },
    { id: 'bulky', label: 'Bulky (벌키/12ply)' },
    { id: 'super_bulky', label: 'Super Bulky (슈퍼 벌키)' },
];

const YARD_TO_METER = 0.9144;

export function PublishPatternModal({ isOpen, onClose, locale, initialFile, initialData }: { isOpen: boolean; onClose: () => void; locale: string; initialFile?: File | null; initialData?: any }) {
    const router = useRouter();
    const tPublish = useTranslations('Publish');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(initialFile || null);

    // UI State
    const [yardageUnit, setYardageUnit] = useState<'m' | 'yd'>('m');
    const [invalidFields, setInvalidFields] = useState<string[]>([]);

    // Metadata State (Matching GridEditor structure)
    const [publishMetadata, setPublishMetadata] = useState({
        title: initialData?.title || '',
        price: initialData?.price ? (typeof initialData.price === 'string' ? parseFloat(initialData.price) : initialData.price) : 0,
        isFree: initialData?.price ? false : true,
        difficulty: initialData?.difficulty || 'intermediate',
        category: initialData?.category || 'clothing',
        subcategory: '',
        craftType: 'knitting' as 'knitting' | 'crochet' | 'mixed' | 'other',
        yarnWeight: initialData?.yarn_weight || '',
        yardage: '',
        needles: initialData?.needle_size || '',
        gaugeStitches: initialData?.gauge || '', // Will use as string
        briefDescription: initialData?.description || '',
        detailedDescription: '', // For uploaded PDF, this might be notes or redundant
        imageUrl: '', // Cover image (Required)
        additionalImages: [] as string[],
        usedColors: [] as string[],
        sizes: '',
        measurements: '',
        hashtags: [] as string[],

        yarnParts: [] as YarnPart[],
        sizeParts: [] as { id: string; name: string; detail: string }[]
    });

    useEffect(() => {
        if (initialFile && !file) {
            setFile(initialFile);
        }
    }, [initialFile, file]);

    // Clear invalid status when field changes
    useEffect(() => {
        if (invalidFields.length > 0) {
            const newInvalid = invalidFields.filter(field => {
                if (field === 'title' && publishMetadata.title) return false;
                if (field === 'imageUrl' && publishMetadata.imageUrl) return false;
                if (field === 'category' && publishMetadata.category) return false;
                if (field === 'craftType' && publishMetadata.craftType) return false;
                if (field === 'needleSize' && publishMetadata.needles) return false;
                // Strict Yarn Info Validation: Must have at least one defined part OR (legacy) yarn weight and yardage
                // Per user request "mandatory", we enforce it.
                if (field === 'yarnInfo' && (publishMetadata.yarnParts.length > 0 || publishMetadata.yarnWeight)) return false;
                if (field === 'sizes' && (publishMetadata.sizes || publishMetadata.sizeParts.length > 0)) return false;
                if (field === 'measurements' && publishMetadata.measurements) return false;
                if (field === 'briefDescription' && publishMetadata.briefDescription) return false;
                if (field === 'hashtags' && publishMetadata.hashtags.length >= 3) return false;
                return true;
            });
            if (newInvalid.length !== invalidFields.length) {
                setInvalidFields(newInvalid);
            }
        }
    }, [publishMetadata, invalidFields]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'new_sub') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Upload to storage immediately to get URL
        // In a real app, maybe do this on submit? But here user expects preview.
        try {
            setLoading(true);
            const supabase = createClient();
            const filename = `preview_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { data, error } = await supabase.storage
                .from('patterns')
                .upload(filename, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('patterns')
                .getPublicUrl(filename);

            if (type === 'main') {
                setPublishMetadata(prev => ({ ...prev, imageUrl: publicUrl }));
            } else {
                setPublishMetadata(prev => ({
                    ...prev,
                    additionalImages: [...prev.additionalImages, publicUrl]
                }));
            }
        } catch (error) {
            console.error('Image upload failed', error);
            alert('Image upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        // Validation
        const errors: string[] = [];
        if (!publishMetadata.title) errors.push('title');
        if (!publishMetadata.imageUrl) errors.push('imageUrl');
        if (!publishMetadata.category) errors.push('category');
        if (!publishMetadata.subcategory) errors.push('subcategory');
        if (!publishMetadata.needles) errors.push('needleSize');
        if (!publishMetadata.sizes) errors.push('sizes');
        if (!publishMetadata.measurements) errors.push('measurements');
        if (!publishMetadata.briefDescription) errors.push('briefDescription');
        if (publishMetadata.hashtags.length < 3) errors.push('hashtags');

        // Yarn Validation: Require at least one part OR yarn info
        if (!publishMetadata.yarnParts || publishMetadata.yarnParts.length === 0) {
            // If no dynamic parts, check if legacy fields are empty (though we encourage parts)
            // Let's enforce adding at least one part for consistency if the user is in the "add part" flow
            if (!publishMetadata.yarnWeight) errors.push('yarnInfo');
        }

        if (errors.length > 0) {
            setInvalidFields(errors);
            // Scroll to first error
            const firstError = errors[0];
            const element = document.getElementById(`field-${firstError}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (!file) return; // Should allow publish without file? logic above says file required.

        setLoading(true);

        try {
            // 1. Upload PDF
            const supabase = createClient();
            const pdfFilename = `pdf_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('patterns')
                .upload(pdfFilename, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl: pdfUrl } } = supabase.storage
                .from('patterns')
                .getPublicUrl(pdfFilename);

            // 2. Call Server Action
            const payload: any = {
                ...publishMetadata,
                pdfUrl,
                price: publishMetadata.isFree ? 0 : Number(publishMetadata.price),
                gauge: String(publishMetadata.gaugeStitches),
                yarnAmount: String(publishMetadata.yardage || ''),
                gaugeStitches: parseInt(String(publishMetadata.gaugeStitches)) || 0,
                gaugeRows: 0,
                yardage: parseInt(String(publishMetadata.yardage)) || 0,
                sizes: publishMetadata.sizes,
                measurements: publishMetadata.measurements,
                hashtags: publishMetadata.hashtags || [],
                yarnParts: publishMetadata.yarnParts || [],
                sizeParts: publishMetadata.sizeParts || []
            };

            await createPdfPattern(payload);

            alert(locale === 'ko' ? '도안이 성공적으로 출시되었습니다!' : 'Pattern published successfully!');
            onClose();
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper for currency display
    const isKo = locale === 'ko';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden border border-tan-100">
                <div className="sticky top-0 bg-white border-b border-tan-100 p-8 pb-4 flex items-center justify-between z-10">
                    <h2 className="text-3xl font-bold text-brown-800 tracking-tight">
                        {tPublish('title')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-tan-100 rounded-full transition-colors">
                        <X className="w-8 h-8 text-brown-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar space-y-10 pt-4">
                    {/* PDF File Section (Read-onlyish since it was uploaded) */}
                    {file && (
                        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-sage-600 shadow-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-sage-800 text-sm">{file?.name}</p>
                                    <p className="text-xs text-sage-500">
                                        {(file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB • {isKo ? '업로드됨' : 'Uploaded'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1.5 bg-white rounded-lg shadow-sm hover:shadow">
                                {isKo ? '변경' : 'Change'}
                            </button>
                        </div>
                    )}

                    {/* File Upload Section (Top, per user request) */}
                    {!file && (
                        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-stone-800 flex items-center gap-2">
                                    <FileText size={16} className="text-stone-500" />
                                    {isKo ? '도안 파일 (PDF)' : 'Pattern File (PDF)'}
                                </label>
                                <label className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm transition-all hover:bg-rose-50">
                                    {file ? (isKo ? '파일 변경' : 'Change File') : (isKo ? '파일 업로드' : 'Upload File')}
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            {!file && (
                                <div className="text-xs text-stone-400 pl-6">
                                    {isKo ? '판매할 도안 PDF 파일을 업로드해주세요.' : 'Please upload the pattern PDF file to sell.'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Image (Required) */}
                    <div id="field-imageUrl">
                        <div className="flex justify-between items-end mb-2">
                            <label className={`text-sm font-bold ${invalidFields.includes('imageUrl') ? 'text-rose-500' : 'text-stone-800'}`}>
                                대표 이미지 <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-xs text-stone-400">권장: 1080x1080px (1:1)</span>
                        </div>
                        <div className={`border-2 border-dashed ${invalidFields.includes('imageUrl') ? 'border-rose-300 bg-rose-50' : 'border-tan-200'} rounded-xl p-4 text-center hover:bg-stone-50 transition-colors relative group mb-2`}>
                            {!publishMetadata.imageUrl ? (
                                <>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, 'main')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="py-8">
                                        <ImageIcon className="mx-auto text-stone-400 mb-2" size={32} />
                                        <p className="text-stone-500 font-medium">클릭하여 대표 이미지 업로드</p>
                                    </div>
                                </>
                            ) : (
                                <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg shadow-md">
                                    <img src={publishMetadata.imageUrl} alt="Main" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setPublishMetadata(p => ({ ...p, imageUrl: '' }))}
                                        className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Tip */}
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
                            <span className="text-amber-500 text-lg">💡</span>
                            <p className="text-xs text-amber-700 leading-relaxed">
                                <strong>꿀팁:</strong> 실제 완성된 작품 사진을 메인으로 사용하면
                                <span className="font-bold underline ml-1">조회수와 다운로드 수가 평균 3배 이상 증가</span>합니다!
                            </p>
                        </div>
                    </div>


                    {/* Sub Images (Optional) */}
                    <div>
                        <label className="text-sm font-bold text-stone-500 block mb-2">상세 이미지 (선택, 최대 10장)</label>
                        <div className="grid grid-cols-5 gap-2">
                            {publishMetadata.additionalImages?.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm border border-stone-100">
                                    <img src={img} alt={`Sub ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setPublishMetadata(p => ({
                                            ...p,
                                            additionalImages: p.additionalImages.filter((_, i) => i !== idx)
                                        }))}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {(publishMetadata.additionalImages?.length || 0) < 10 && (
                                <div className="aspect-square border-2 border-dashed border-tan-200 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer relative">
                                    <Plus size={24} />
                                    <span className="text-xs font-bold mt-1">추가</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, 'new_sub')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title & Images Section */}
                    <div className="space-y-5">
                        <div id="field-title">
                            <label className={`text-base font-bold ${invalidFields.includes('title') ? 'text-rose-500' : 'text-stone-800'} block mb-2`}>{tPublish('fields.patternTitle')} <span className="text-rose-500">*</span></label>
                            <input
                                type="text"
                                className={`w-full border ${invalidFields.includes('title') ? 'border-rose-300 ring-2 ring-rose-100' : 'border-tan-200'} rounded-xl px-4 py-3.5 text-stone-800 font-bold text-lg focus:ring-4 focus:ring-rose-100 outline-none transition-all placeholder:text-stone-300`}
                                value={publishMetadata.title}
                                onChange={e => setPublishMetadata(p => ({ ...p, title: e.target.value }))}
                                placeholder={tPublish('fields.patternTitlePlaceholder')}
                            />
                        </div>
                    </div>

                    {/* Price Row (Full Width) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-base font-bold text-stone-800">
                                {tPublish('fields.price')} <span className="text-rose-500">*</span>
                                <span className="text-xs font-normal text-stone-400 ml-1.5">
                                    ({isKo ? '크레딧' : 'Credits'})
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group bg-stone-50 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${publishMetadata.isFree ? 'bg-rose-500 border-rose-500' : 'border-stone-300 group-hover:border-rose-400'}`}>
                                    {publishMetadata.isFree && <Check size={10} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={publishMetadata.isFree || false}
                                    onChange={e => setPublishMetadata(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? 0 : 100 }))}
                                />
                                <span className="text-xs font-bold text-stone-500 group-hover:text-rose-600 transition-colors uppercase tracking-wider">{tPublish('fields.freeLabel')}</span>
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="10"
                                disabled={publishMetadata.isFree}
                                className="w-full border border-tan-200 rounded-xl px-4 py-3.5 text-stone-800 font-bold text-lg focus:ring-4 focus:ring-rose-100 outline-none disabled:bg-stone-50 disabled:text-stone-300 transition-all font-mono"
                                value={publishMetadata.isFree ? '0' : (publishMetadata.price === 0 ? '' : publishMetadata.price.toString())}
                                onChange={e => setPublishMetadata(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-bold bg-white px-2 pointer-events-none">
                                {isKo ? '크레딧' : 'Credits'}
                            </div>
                        </div>
                    </div>

                    {/* Craft Type Row (Full Width) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <label className="text-base font-bold text-stone-800">{tPublish('fields.craftType')} <span className="text-rose-500">*</span></label>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {(['knitting', 'crochet', 'mixed', 'other'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setPublishMetadata(p => ({ ...p, craftType: type }))}
                                    className={`py-3.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${publishMetadata.craftType === type ? 'bg-white text-rose-600 border-rose-200 ring-2 ring-rose-50' : 'bg-white text-stone-500 border-stone-200 hover:border-tan-300 hover:bg-stone-50'}`}
                                >
                                    {tPublish(`options.${type}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Categories Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div id="field-category">
                            <label className={`text-base font-bold ${invalidFields.includes('category') ? 'text-rose-500' : 'text-stone-800'} block mb-2 px-1`}>{tPublish('fields.category')} <span className="text-rose-500">*</span></label>
                            <select
                                className={`w-full border ${invalidFields.includes('category') ? 'border-rose-300 ring-2 ring-rose-100' : 'border-tan-200'} rounded-xl px-4 py-3.5 text-stone-800 font-medium focus:ring-4 focus:ring-rose-100 outline-none bg-white appearance-none cursor-pointer`}
                                value={publishMetadata.category}
                                onChange={e => setPublishMetadata(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                            >
                                {Object.entries(CATEGORY_TAXONOMY).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label[isKo ? 'ko' : 'en']}</option>
                                ))}
                            </select>
                        </div>
                        <div id="field-subcategory">
                            <label className={`text-base font-bold ${invalidFields.includes('subcategory') ? 'text-rose-500' : 'text-stone-800'} block mb-2 px-1`}>{tPublish('fields.subcategory')} <span className="text-rose-500">*</span></label>
                            <select
                                className={`w-full border ${invalidFields.includes('subcategory') ? 'border-rose-300 ring-2 ring-rose-100' : 'border-tan-200'} rounded-xl px-4 py-3.5 text-stone-800 font-medium focus:ring-4 focus:ring-rose-100 outline-none disabled:bg-stone-50 disabled:text-stone-400 bg-white appearance-none cursor-pointer`}
                                value={publishMetadata.subcategory || ''}
                                onChange={e => setPublishMetadata(p => ({ ...p, subcategory: e.target.value }))}
                                disabled={!publishMetadata.category}
                            >
                                <option value="" disabled>{tPublish('options.select')}</option>
                                {CATEGORY_TAXONOMY[publishMetadata.category as keyof typeof CATEGORY_TAXONOMY]?.sub.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.label[isKo ? 'ko' : 'en']}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Main Details Section */}
                    {/* Main Details Section */}
                    <div className="space-y-6 pt-0">


                        {/* Structured Size Info Row */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-base font-bold text-stone-800">
                                    {isKo ? '완성 사이즈' : 'Finished Sizes'} <span className="text-rose-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setPublishMetadata(p => ({
                                        ...p,
                                        sizeParts: [...(p.sizeParts || []), { id: crypto.randomUUID(), name: '', detail: '' }]
                                    }))}
                                    className="text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                                >
                                    <Plus size={14} />
                                    {isKo ? '사이즈 추가' : 'Add Size'}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(publishMetadata.sizeParts || []).map((part, idx) => (
                                    <div key={part.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 relative group animate-in slide-in-from-top-2">
                                        <button
                                            type="button"
                                            onClick={() => setPublishMetadata(p => ({
                                                ...p,
                                                sizeParts: p.sizeParts?.filter(item => item.id !== part.id)
                                            }))}
                                            className="absolute top-2 right-2 text-stone-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* Size Name */}
                                            <div>
                                                <label className="text-xs font-bold text-stone-500 block mb-1">{isKo ? '사이즈 명' : 'Size Name'}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                    value={part.name}
                                                    onChange={e => setPublishMetadata(p => ({
                                                        ...p,
                                                        sizeParts: p.sizeParts?.map(item => item.id === part.id ? { ...item, name: e.target.value } : item)
                                                    }))}
                                                    placeholder={isKo ? 'S' : 'e.g., S'}
                                                />
                                            </div>

                                            {/* Detail */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-bold text-stone-500 block mb-1">{isKo ? '상세 치수' : 'Dimensions'}</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                    value={part.detail}
                                                    onChange={e => setPublishMetadata(p => ({
                                                        ...p,
                                                        sizeParts: p.sizeParts?.map(item => item.id === part.id ? { ...item, detail: e.target.value } : item)
                                                    }))}
                                                    placeholder={isKo ? '가슴 50cm, 총장 60cm' : 'e.g., Chest 50cm, Length 60cm'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {(!publishMetadata.sizeParts || publishMetadata.sizeParts.length === 0) && (
                                    <div
                                        onClick={() => setPublishMetadata(p => ({
                                            ...p,
                                            sizeParts: [...(p.sizeParts || []), { id: crypto.randomUUID(), name: '', detail: '' }]
                                        }))}
                                        className={`border-2 border-dashed ${invalidFields.includes('sizes') ? 'border-rose-300 bg-rose-50' : 'border-tan-200'} rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer`}
                                    >
                                        <Plus size={24} className="mb-2" />
                                        <span className="text-sm font-bold">{isKo ? '사이즈 정보 추가' : 'Add Size Info'}</span>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Yarn & Gauge Section */}
                        <div className="grid grid-cols-1 gap-6" id="field-yarnInfo">
                            {/* Yarn Parts Repeater */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-base font-bold text-stone-800">{tPublish('fields.yarnParts')} <span className="text-rose-500">*</span></label>
                                    <button
                                        type="button"
                                        onClick={() => setPublishMetadata(p => ({
                                            ...p,
                                            yarnParts: [...(p.yarnParts || []), { id: crypto.randomUUID(), partName: '', yarnName: '', amount: '', needle: '' }]
                                        }))}
                                        className="text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                                    >
                                        <Plus size={14} />
                                        {isKo ? '파트 추가' : 'Add Part'}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(publishMetadata.yarnParts || []).map((part, idx) => (
                                        <div key={part.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 relative group animate-in slide-in-from-top-2">
                                            <button
                                                type="button"
                                                onClick={() => setPublishMetadata(p => ({
                                                    ...p,
                                                    yarnParts: p.yarnParts?.filter(item => item.id !== part.id)
                                                }))}
                                                className="absolute top-2 right-2 text-stone-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                                title={tPublish('fields.removePart')}
                                            >
                                                <X size={14} />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                {/* Part Name */}
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partName')}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                        value={part.partName}
                                                        onChange={e => setPublishMetadata(p => ({
                                                            ...p,
                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, partName: e.target.value } : item)
                                                        }))}
                                                        placeholder={tPublish('fields.partNamePlaceholder')}
                                                    />
                                                </div>

                                                {/* Yarn Name */}
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.yarnName')}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                        value={part.yarnName}
                                                        onChange={e => setPublishMetadata(p => ({
                                                            ...p,
                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, yarnName: e.target.value } : item)
                                                        }))}
                                                        placeholder={tPublish('fields.yarnNamePlaceholder')}
                                                    />
                                                </div>

                                                {/* Technique */}
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partTechnique')}</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                        value={part.technique || ''}
                                                        onChange={e => setPublishMetadata(p => ({
                                                            ...p,
                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, technique: e.target.value } : item)
                                                        }))}
                                                        placeholder={tPublish('fields.techniquePlaceholder')}
                                                    />
                                                </div>

                                                {/* Needle Size */}
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partNeedle')}</label>
                                                    <NeedleSelector
                                                        value={part.needle}
                                                        onChange={val => setPublishMetadata(p => ({
                                                            ...p,
                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, needle: val } : item)
                                                        }))}
                                                        placeholder="Select Size"
                                                    />
                                                </div>

                                                {/* Gauge */}
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partGauge')}</label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                value={part.gauge?.split(' ')[0]?.replace(/[^0-9]/g, '') || ''}
                                                                onChange={e => {
                                                                    const sts = e.target.value.replace(/[^0-9]/g, '');
                                                                    const rows = part.gauge?.split(' ')[1]?.replace(/[^0-9]/g, '') || '';
                                                                    setPublishMetadata(p => ({
                                                                        ...p,
                                                                        yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, gauge: `${sts}${tPublish('fields.gaugeStitchPlaceholder')} ${rows}${tPublish('fields.gaugeRowPlaceholder')}` } : item)
                                                                    }));
                                                                }}
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{tPublish('fields.gaugeStitchPlaceholder')}</span>
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                value={part.gauge?.split(' ')[1]?.replace(/[^0-9]/g, '') || ''}
                                                                onChange={e => {
                                                                    const sts = part.gauge?.split(' ')[0]?.replace(/[^0-9]/g, '') || '';
                                                                    const rows = e.target.value.replace(/[^0-9]/g, '');
                                                                    setPublishMetadata(p => ({
                                                                        ...p,
                                                                        yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, gauge: `${sts}${tPublish('fields.gaugeStitchPlaceholder')} ${rows}${tPublish('fields.gaugeRowPlaceholder')}` } : item)
                                                                    }));
                                                                }}
                                                                placeholder="0"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{tPublish('fields.gaugeRowPlaceholder')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Amount */}
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partAmount')}</label>
                                                    <UnitInput
                                                        value={part.amount}
                                                        onChange={val => setPublishMetadata(p => ({
                                                            ...p,
                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, amount: val } : item)
                                                        }))}
                                                        placeholder={tPublish('fields.amountPlaceholder')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!publishMetadata.yarnParts || publishMetadata.yarnParts.length === 0) && (
                                        <div
                                            onClick={() => setPublishMetadata(p => ({
                                                ...p,
                                                yarnParts: [...(p.yarnParts || []), { id: crypto.randomUUID(), partName: '', yarnName: '', amount: '', needle: '' }]
                                            }))}
                                            className={`border-2 border-dashed ${invalidFields.includes('yarnInfo') ? 'border-rose-300 bg-rose-50' : 'border-tan-200'} rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer`}
                                        >
                                            <Plus size={24} className="mb-2" />
                                            <span className="text-sm font-bold">{isKo ? '파트 추가' : 'Add Part'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>      {/* Gauge Info Row Removed */}
                    </div>

                    {/* Combined legacy sizes field hidden or made optional if sizeParts exist? 
                            User seems to want structured, but we have legacy field. 
                            Let's keep legacy field below for "Overall Range" or "Additional Notes" if needed, 
                            but maybe hide if sizeParts are used? 
                            Actually, let's keep it but make it optional if sizeParts exist. 
                        */}



                    {/* Used Colors (Optional) */}
                    {publishMetadata.usedColors && publishMetadata.usedColors.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-base font-bold text-stone-500 block px-1">{tPublish('fields.usedColors')} ({publishMetadata.usedColors.length})</label>
                            <div className="flex flex-wrap gap-2.5">
                                {publishMetadata.usedColors.map((color, i) => (
                                    <div key={i} className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-stone-100 shadow-sm">
                                        <div className="w-5 h-5 rounded-full border border-stone-200 shadow-inner" style={{ backgroundColor: color }}></div>
                                        <span className="text-xs font-bold text-stone-600 font-mono">{color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Descriptions */}
                    {/* Descriptions - Fixed layout issues: Added shrink-0 and removed excessive growth */}
                    <div className="space-y-6 pt-6 border-t border-stone-100 flex-shrink-0">
                        <div className="flex-none">
                            <div className="flex justify-between items-baseline mb-2 px-1">
                                <label className="text-base font-bold text-stone-800">{tPublish('fields.briefDescription')} <span className="text-rose-500">*</span></label>
                                <span className="text-xs text-stone-400 font-medium">{tPublish('fields.briefDescriptionHint')}</span>
                            </div>
                            <div className="rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-rose-100 transition-all flex-none">
                                <RichTextEditor
                                    content={publishMetadata.briefDescription}
                                    onChange={content => setPublishMetadata(p => ({ ...p, briefDescription: content }))}
                                    placeholder={tPublish('fields.briefDescriptionPlaceholder')}
                                    minHeight="320px"
                                />
                            </div>
                        </div>

                        <div className="flex-none">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <label className="text-base font-bold text-stone-800 whitespace-nowrap">{tPublish('fields.detailedDescription')}</label>
                                <span className="bg-brown-100 text-brown-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {tPublish('fields.detailedDescriptionTag')}
                                </span>
                            </div>
                            <div className="rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-rose-100 transition-all flex-none">
                                <RichTextEditor
                                    content={publishMetadata.detailedDescription || ''}
                                    onChange={content => setPublishMetadata(p => ({ ...p, detailedDescription: content }))}
                                    placeholder={tPublish('fields.detailedDescriptionHint')}
                                    minHeight="400px"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hashtags */}
                    <div className="space-y-4 pt-6" id="field-hashtags">
                        <div className="flex flex-col gap-1 px-1">
                            <div className="flex justify-between items-center">
                                <label className={`text-base font-bold ${invalidFields.includes('hashtags') ? 'text-rose-500' : 'text-stone-800'}`}>{tPublish('fields.hashtags')} <span className="text-rose-500">*</span></label>
                                <span className={`text-xs font-bold pt-1 ${publishMetadata.hashtags.length < 3 ? 'text-rose-500' : 'text-stone-400'}`}>
                                    {publishMetadata.hashtags.length}/10 {publishMetadata.hashtags.length < 3 && `(${isKo ? `${3 - publishMetadata.hashtags.length}개 더 필요` : `${3 - publishMetadata.hashtags.length} more needed`})`}
                                </span>
                            </div>
                            <span className="text-xs text-stone-400 font-medium">{tPublish('fields.hashtagsHint')}</span>
                        </div>

                        <div className="flex flex-wrap gap-2.5 min-h-[58px] p-2 bg-stone-50 rounded-2xl border border-tan-100">
                            {publishMetadata.hashtags?.map((tag, idx) => (
                                <span key={idx} className="bg-white border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in zoom-in-95">
                                    #{tag}
                                    <button
                                        onClick={() => setPublishMetadata(p => ({ ...p, hashtags: p.hashtags.filter((_, i) => i !== idx) }))}
                                        className="hover:text-rose-800 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                            {publishMetadata.hashtags.length < 10 && (
                                <input
                                    type="text"
                                    className="bg-transparent border-none outline-none text-stone-700 font-bold text-lg px-3 py-2 flex-1 min-w-[120px] placeholder:text-stone-300"
                                    placeholder={tPublish('fields.hashtagPlaceholder')}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value.trim().replace(/^#/, '').replace(/,/g, '');
                                            if (val && !publishMetadata.hashtags.includes(val)) {
                                                setPublishMetadata(p => ({ ...p, hashtags: [...p.hashtags, val] }));
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 pb-2">
                        <button
                            onClick={handlePublish}
                            disabled={loading}
                            className={`w-full ${loading ? 'bg-stone-300' : 'bg-rose-500 hover:bg-rose-600'} text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-xl flex items-center justify-center gap-3`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {tPublish('buttons.submitting')}
                                </>
                            ) : (
                                tPublish('buttons.submit')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}
