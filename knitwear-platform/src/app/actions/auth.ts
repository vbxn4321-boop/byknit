'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // manual data extraction as we might call this from a handler
    const data = Object.fromEntries(formData)
    const email = data.email as string
    const password = data.password as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const origin = (await headers()).get('origin')

    const data = Object.fromEntries(formData)
    const email = data.email as string
    const password = data.password as string

    const username = data.username as string;
    const passwordConfirm = data.passwordConfirm as string;

    // Validate Username (English only)
    const usernameRegex = /^[A-Za-z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
        return redirect('/signup?error=' + encodeURIComponent('프로필 이름은 영문, 숫자, 특수문자(._-)만 가능합니다.'))
    }

    if (password !== passwordConfirm) {
        return redirect('/signup?error=' + encodeURIComponent('비밀번호가 일치하지 않습니다.'))
    }

    const privacyAgreed = data.privacy_policy_agreed === 'on';
    const adAgreement = data.ad_agreement === 'on';
    const marketingConsent = data.marketing_consent === 'on';

    // Validate required fields (double check server-side)
    if (!privacyAgreed || !adAgreement) {
        return redirect('/signup?error=' + encodeURIComponent('필수 약관에 동의해주세요.'))
    }

    const referrerName = data.referrer_name as string;

    const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                full_name: username, // Map to both for compatibility
                privacy_policy_agreed: privacyAgreed,
                ad_agreement: adAgreement,
                marketing_consent: marketingConsent,
                referrer_name: referrerName || null,
            },
            // Explicitly require email confirmation flow if enabled in Supabase
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return redirect('/signup?error=' + encodeURIComponent(error.message)) // Changed to error param for red box
    }

    // Process Referral Bonus if provided
    if (referrerName && signUpData.user) {
        // Find referrer by username (display_name in profiles)
        const { data: referrerData } = await supabase
            .from('profiles')
            .select('id')
            .eq('display_name', referrerName)
            .single();

        if (referrerData) {
            // Grant +100 to referrer
            await supabase.from('credit_transactions').insert({
                user_id: referrerData.id,
                amount: 100,
                type: 'earning',
                description: `Referral Bonus (referred ${username})`
            });

            // Grant +100 to new user
            await supabase.from('credit_transactions').insert({
                user_id: signUpData.user.id,
                amount: 100,
                type: 'earning',
                description: 'Referred Sign Up Bonus'
            });
        }
    }

    // Success - Tell them to check email
    redirect('/login?message=' + encodeURIComponent('가입 인증 메일이 발송되었습니다. 메일을 확인해주세요!'))
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
