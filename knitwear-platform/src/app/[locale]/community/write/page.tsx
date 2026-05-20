
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Send, Image as ImageIcon, Sparkles, 
    ChevronLeft, Type, AlignLeft,
    Package, X, Coins, Check
} from 'lucide-react';
import { createPost, getMyPatterns } from '@/app/actions/community';
import { createClient } from '@/utils/supabase/client';

interface PatternItem {
    id: string;
    title: any;
    thumbnail_url: string | null;
    images: string[] | null;
    difficulty: string;
    price_usd: number;
}

export default function CommunityWritePage({ params }: { params: Promise<{ locale: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locale, setLocale] = useState(resolvedParams.locale || 'ko');
    const [myPatterns, setMyPatterns] = useState<PatternItem[]>([]);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
    const [showPatternPicker, setShowPatternPicker] = useState(false);
    const [loadingPatterns, setLoadingPatterns] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [user, setUser] = useState<any>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const supabase = createClient();
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoadingAuth(false);
        }
        checkAuth();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        const input = document.getElementById('cover-image-input') as HTMLInputElement;
        if (input) input.value = '';
    };

    // 내 도안 목록 불러오기
    useEffect(() => {
        async function fetchPatterns() {
            setLoadingPatterns(true);
            const patterns = await getMyPatterns();
            setMyPatterns(patterns);
            setLoadingPatterns(false);
        }
        fetchPatterns();
    }, []);

    const selectedPattern = myPatterns.find(p => p.id === selectedPatternId);

    const getPatternTitle = (title: any): string => {
        if (!title) return 'Untitled';
        if (typeof title === 'string') return title;
        return title[locale] || title.ko || title.en || 'Untitled';
    };

    const getPatternImage = (pattern: PatternItem): string | null => {
        return pattern.thumbnail_url || (pattern.images && pattern.images[0]) || null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.append('locale', locale);

        if (selectedPatternId) {
            formData.append('pattern_id', selectedPatternId);
        }

        try {
            await createPost(formData);
            router.push(`/${resolvedParams.locale}/community`);
            router.refresh();
        } catch (error) {
            alert('글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-cream-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
                    <p className="text-xs font-bold text-brown-600">Loading Author Info...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-tan-200 shadow-soft text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-rose-sm">
                        <svg className="w-8 h-8 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold text-brown-800">
                            {locale === 'ko' ? '🔒 로그인이 필요한 장치입니다' : '🔒 Login Required'}
                        </h2>
                        <p className="text-sm text-brown-600 leading-relaxed">
                            {locale === 'ko' 
                                ? '커뮤니티 글을 작성하시려면 먼저 로그인을 완료해 주세요.' 
                                : 'Please log in to your account to write a community post.'}
                        </p>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={() => router.push(`/${locale}/login`)}
                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold hover:shadow-rose-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                        >
                            {locale === 'ko' ? '로그인 하러 가기' : 'Go to Login'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream-100">
            {/* Minimalist Writing Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-tan-100 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 font-bold transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>나가기</span>
                    </button>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                            <button 
                                onClick={() => setLocale('ko')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${locale === 'ko' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}
                            >
                                한국어
                            </button>
                            <button 
                                onClick={() => setLocale('en')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${locale === 'en' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}
                            >
                                English
                            </button>
                        </div>
                        
                        <button 
                            form="write-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-2.5 bg-stone-800 text-white font-black rounded-xl hover:bg-rose-500 transition-all shadow-lg shadow-stone-100 disabled:opacity-50 active:scale-95"
                        >
                            {isSubmitting ? '게시 중...' : (
                                <>
                                    <span>출판하기</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Editor Area */}
            <main className="max-w-4xl mx-auto">
                <div className="bg-white border-l border-r border-tan-200 min-h-screen px-10 sm:px-16 py-12">
                <form id="write-form" onSubmit={handleSubmit} className="space-y-12">
                    {/* Category Selection */}
                    <div className="flex flex-wrap gap-3">
                        {['general', 'showcase', 'qna', 'tip'].map((cat) => (
                            <label key={cat} className="cursor-pointer">
                                <input type="radio" name="category" value={cat} className="hidden peer" defaultChecked={cat === 'general'} />
                                <span className="px-5 py-2 rounded-full border border-stone-200 text-stone-600 font-bold text-sm peer-checked:bg-stone-800 peer-checked:text-white peer-checked:border-stone-800 transition-all">
                                    #{cat === 'general' ? '자유' : cat === 'qna' ? '질문' : cat === 'showcase' ? '자랑' : '팁'}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* ========== 도안 첨부 섹션 ========== */}
                    <div className="space-y-4">
                        {selectedPattern ? (
                            /* 선택된 도안 프리뷰 */
                            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                {getPatternImage(selectedPattern) && (
                                    <img 
                                        src={getPatternImage(selectedPattern)!} 
                                        alt="pattern thumbnail" 
                                        className="w-16 h-16 rounded-xl object-cover border border-emerald-100"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-emerald-800 truncate">
                                        📎 {getPatternTitle(selectedPattern.title)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                                            <Coins className="w-3 h-3" /> +50 크레딧 보상!
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setSelectedPatternId(null)}
                                    className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            /* 도안 선택 버튼 */
                            <button
                                type="button"
                                onClick={() => setShowPatternPicker(!showPatternPicker)}
                                className="group flex items-center gap-4 w-full p-5 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl hover:border-rose-300 hover:bg-rose-50/30 transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-rose-50 transition-colors">
                                    <Package className="w-6 h-6 text-stone-400 group-hover:text-rose-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-stone-700 group-hover:text-rose-600">내 도안 첨부하기</p>
                                    <p className="text-xs text-stone-400 mt-0.5">도안을 공유하면 <span className="font-bold text-amber-500">+50 크레딧</span>을 받아요!</p>
                                </div>
                            </button>
                        )}

                        {/* 도안 선택 드롭다운 */}
                        {showPatternPicker && !selectedPatternId && (
                            <div className="bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                                {loadingPatterns ? (
                                    <div className="p-8 text-center text-stone-400 font-bold">불러오는 중...</div>
                                ) : myPatterns.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-stone-500 font-bold">아직 등록된 도안이 없어요</p>
                                        <p className="text-xs text-stone-400 mt-1">도안 에디터에서 먼저 작품을 만들어보세요!</p>
                                    </div>
                                ) : (
                                    myPatterns.map((pattern) => (
                                        <button
                                            key={pattern.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPatternId(pattern.id);
                                                setShowPatternPicker(false);
                                            }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none"
                                        >
                                            {getPatternImage(pattern) ? (
                                                <img 
                                                    src={getPatternImage(pattern)!} 
                                                    alt="" 
                                                    className="w-12 h-12 rounded-xl object-cover border border-stone-100"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-stone-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-bold text-stone-800 text-sm truncate">
                                                    {getPatternTitle(pattern.title)}
                                                </p>
                                                <p className="text-xs text-stone-400 mt-0.5">
                                                    {pattern.difficulty} · {pattern.price_usd === 0 ? '무료' : `$${pattern.price_usd}`}
                                                </p>
                                            </div>
                                            <Check className="w-5 h-5 text-stone-200" />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title Input */}
                    <div className="group space-y-4">
                        <div className="flex items-center gap-2 text-stone-300 group-focus-within:text-rose-400 transition-colors">
                            <Type className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-widest">Title</span>
                        </div>
                        <input 
                            name="title"
                            required
                            placeholder="이야기의 제목을 입력하세요"
                            className="w-full text-4xl sm:text-5xl font-black text-stone-950 placeholder:text-stone-500 outline-none border-none bg-transparent"
                        />
                    </div>

                    {/* Content Input */}
                    <div className="group space-y-4">
                        <div className="flex items-center gap-2 text-stone-300 group-focus-within:text-rose-400 transition-colors">
                            <AlignLeft className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-widest">Content</span>
                        </div>
                        <textarea 
                            name="content"
                            required
                            rows={15}
                            placeholder="이곳에 전 세계 니터들과 나눌 이야기를 자유롭게 적어보세요..."
                            className="w-full text-xl text-stone-950 leading-relaxed placeholder:text-stone-500 outline-none border-none bg-transparent resize-none"
                        />
                    </div>
                    
                    {/* Image Attachment (Compact style) */}
                    <div className="pt-6 border-t border-tan-100 space-y-3">
                        <input 
                            type="file" 
                            accept="image/*" 
                            name="image" 
                            id="cover-image-input" 
                            className="hidden" 
                            onChange={handleImageChange}
                        />
                        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">사진 첨부 (선택)</p>
                        
                        {imagePreview ? (
                            <div className="flex items-center gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                                <img 
                                    src={imagePreview} 
                                    alt="Selected cover preview" 
                                    className="w-12 h-12 rounded-xl object-cover border border-stone-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-stone-700 truncate">
                                        📎 첨부된 사진 파일
                                    </p>
                                    <p className="text-xs text-stone-400 mt-0.5">상세 페이지에서 첨부파일로 내려받을 수 있습니다.</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="p-2 text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => document.getElementById('cover-image-input')?.click()}
                                className="group flex items-center gap-4 w-full p-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer"
                            >
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-rose-50 transition-colors">
                                    <ImageIcon className="w-5 h-5 text-stone-400 group-hover:text-rose-400" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-stone-700 group-hover:text-rose-600 text-sm">사진 첨부하기</p>
                                    <p className="text-xs text-stone-400 mt-0.5">게시글에 함께 첨부할 사진이나 이미지를 선택하세요.</p>
                                </div>
                            </button>
                        )}
                    </div>
                </form>
                </div>
            </main>
        </div>
    );
}
