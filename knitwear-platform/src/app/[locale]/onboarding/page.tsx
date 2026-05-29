import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { completeOnboarding } from '@/app/actions/auth';
import type { Locale } from '@/i18n/request';

export default async function OnboardingPage({
    searchParams,
    params
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    params: Promise<{ locale: Locale }>
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { locale } = await params;

    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Check if user already agreed to terms
    const { data: profile } = await supabase
        .from('profiles')
        .select('privacy_policy_agreed')
        .eq('id', user.id)
        .single();

    if (profile?.privacy_policy_agreed) {
        redirect(`/${locale}`);
    }

    const resolvedSearchParams = await searchParams;
    const error = resolvedSearchParams.error as string | undefined;
    
    // Attempt to extract default name from Google metadata
    const defaultName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    // Format name to English letters/numbers only if possible, or just leave it blank if Korean
    const cleanDefaultName = defaultName.replace(/[^A-Za-z0-9._-]/g, '');

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <OnboardingForm 
                    action={completeOnboarding} 
                    error={error} 
                    defaultName={cleanDefaultName}
                />
            </div>
        </div>
    );
}
