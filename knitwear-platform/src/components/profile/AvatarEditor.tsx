'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { updateProfile } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';

interface AvatarEditorProps {
    currentAvatarUrl?: string;
    displayName?: string;
}

export function AvatarEditor({ currentAvatarUrl, displayName }: AvatarEditorProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile
            await updateProfile({ avatar_url: publicUrl });

            router.refresh(); // Refresh the page to show the new avatar
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group w-28 h-28 mx-auto mb-4">
            {/* Avatar Display */}
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-peach-200 to-rose-200">
                {currentAvatarUrl ? (
                    <img
                        src={currentAvatarUrl}
                        alt={displayName || 'Profile'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-white font-black">
                        {displayName?.[0] || <User size={48} />}
                    </div>
                )}
            </div>

            {/* Overlay Edit Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-black/20"
                title="Change Profile Picture"
            >
                {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                    <Camera className="w-8 h-8 text-white" />
                )}
            </button>

            {/* Hidden Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
