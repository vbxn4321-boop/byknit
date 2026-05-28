
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfile } from '@/app/actions/profile';
import { User, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ProfileFormProps {
    profile: any;
    locale: string;
}

export function ProfileForm({ profile, locale }: ProfileFormProps) {
    const t = useTranslations('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        display_name: profile?.display_name || '',
        bio: profile?.bio || '',
        instagram_handle: profile?.instagram_handle || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            const res = await updateProfile(formData);
            if (res.error) {
                setError(res.error);
            } else {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            let errorMsg = err.message || "An unexpected error occurred";
            if (locale === 'ko') {
                if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
                    errorMsg = '이미 사용 중인 닉네임입니다.';
                } else {
                    errorMsg = '정보 수정 중 오류가 발생했습니다.';
                }
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl shadow-soft border border-tan-100">
            <h2 className="text-xl font-bold text-brown-700 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-400" />
                {t('info')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-brown-600 ml-1">{t('nickname')}</label>
                    <input
                        type="text"
                        value={formData.display_name}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^A-Za-z0-9._-]/g, '');
                            setFormData({ ...formData, display_name: val });
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-tan-200 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent transition-all bg-cream-50/30"
                        placeholder="My Nickname"
                    />
                </div>

            </div>


            <div className="flex items-center justify-between pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-rose rounded-2xl px-8 py-3 font-bold shadow-rose-sm hover:translate-y-[-2px] transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {t('editInfo')}
                </button>

                {success && (
                    <div className="flex items-center gap-2 text-sage-600 font-medium animate-in fade-in slide-in-from-right-4">
                        <Check className="w-5 h-5" />
                        {t('updateSuccess')}
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-rose-500 font-medium">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}
            </div>
        </form>
    );
}
