'use client';

import { useState } from 'react';
import { Instagram, Edit3, Check, X, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface MarketIntroEditorProps {
    initialBio: string;
    initialInstagram: string;
    locale: string;
    userId: string;
}

export function MarketIntroEditor({ initialBio, initialInstagram, locale, userId }: MarketIntroEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio);
    const [instagram, setInstagram] = useState(initialInstagram);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Using React Query or local state update is good, but Server Action ensures cache revalidation
            const result = await import('@/app/actions/profile').then(mod =>
                mod.updateProfile({ bio, instagram_handle: instagram })
            );

            if (result.error) throw new Error(result.error);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to save:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="max-w-md mx-auto bg-cream-50 rounded-2xl p-4 border border-tan-100 space-y-3 animate-in fade-in">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-brown-500">
                            {locale === 'ko' ? '마켓 소개' : 'Market Introduction'}
                        </label>
                        <span className={`text-[10px] font-medium ${bio.length > 900 ? 'text-rose-500' : 'text-brown-400'}`}>
                            {bio.length}/1000
                        </span>
                    </div>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={1000}
                        placeholder={locale === 'ko' ? '당신의 마켓을 소개해주세요...' : 'Introduce your market...'}
                        className="w-full px-3 py-2 rounded-xl border border-tan-200 text-sm text-brown-700 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-brown-500 block mb-1">Instagram</label>
                    <div className="flex items-center gap-2">
                        <Instagram className="w-4 h-4 text-rose-400" />
                        <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            placeholder="@username"
                            className="flex-1 px-3 py-2 rounded-xl border border-tan-200 text-sm text-brown-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => {
                            setBio(initialBio);
                            setInstagram(initialInstagram);
                            setIsEditing(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-tan-100 text-brown-500 text-sm font-bold hover:bg-tan-200 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center">
            {/* Bio Text */}
            <p className="text-brown-600 text-sm mb-4 leading-relaxed whitespace-pre-wrap max-w-md mx-auto">
                {bio || (locale === 'ko' ? '마켓 소개를 작성해주세요' : 'Add a market introduction')}
            </p>

            {/* Instagram Link */}
            {instagram && (
                <a
                    href={`https://instagram.com/${instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-rose-500 text-sm font-bold hover:text-rose-600 transition-colors mb-4"
                >
                    <Instagram className="w-4 h-4" />
                    {instagram}
                </a>
            )}

            {/* Edit Button */}
            <div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-tan-100 text-brown-500 text-xs font-bold hover:bg-tan-200 transition-colors shadow-sm"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    {locale === 'ko' ? '마켓 정보 수정' : 'Edit Market Info'}
                </button>
            </div>
        </div>
    );
}
