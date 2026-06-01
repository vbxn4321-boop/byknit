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

    // Use admin client to bypass Supabase rate limits and SMTP issues
    const { createAdminClient, createClient } = await import('@/utils/supabase/server');
    const adminClient = await createAdminClient();
    const supabase = await createClient();

    // 1. Generate Link & Create User in one step
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'signup',
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
            redirectTo: `${origin}/auth/callback`,
        }
    });

    if (linkError) {
        return redirect('/signup?error=' + encodeURIComponent(linkError.message))
    }

    const actionLink = linkData?.properties?.action_link;
    const newUserId = linkData?.user?.id;

    if (!actionLink) {
        return redirect('/signup?error=' + encodeURIComponent('인증 링크를 생성할 수 없습니다.'))
    }

    // 2. Send the beautifully designed custom email using Resend API directly
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
        const htmlTemplate = `
        <div style="max-width:480px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;background:#faf8f5;padding:40px 20px;">
          <div style="background:#ffffff;border-radius:20px;padding:40px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #f0ece6;">
            
            <div style="text-align:center;margin-bottom:32px;">
              <span style="font-size:28px;font-weight:900;color:#292524;letter-spacing:-0.5px;">by<span style="color:#f43f5e;">Knit</span></span>
              <p style="margin:8px 0 0;font-size:12px;color:#a8a29e;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Global Knitting Platform</p>
            </div>
        
            <div style="text-align:center;margin-bottom:28px;">
              <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#fff1f2,#fecdd3);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">✉️</span>
              </div>
              <h1 style="font-size:20px;font-weight:800;color:#292524;margin:0 0 8px;">이메일 인증을 완료해주세요</h1>
              <p style="font-size:14px;color:#78716c;margin:0;line-height:1.6;">byKnit에 가입해 주셔서 감사합니다!<br/>아래 버튼을 눌러 이메일 인증을 완료하시면<br/>모든 서비스를 이용하실 수 있습니다.</p>
            </div>
        
            <div style="text-align:center;margin:32px 0;">
              <a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;font-size:16px;font-weight:800;padding:14px 48px;border-radius:14px;text-decoration:none;box-shadow:0 4px 14px rgba(244,63,94,0.35);">이메일 인증하기</a>
            </div>
        
            <p style="font-size:12px;color:#a8a29e;text-align:center;line-height:1.6;margin:24px 0 0;">버튼이 작동하지 않으면 아래 링크를 복사하여<br/>브라우저 주소창에 붙여넣어 주세요.</p>
            <p style="font-size:11px;color:#d6d3d1;text-align:center;word-break:break-all;margin:8px 0 0;">${actionLink}</p>
        
            <hr style="border:none;border-top:1px solid #f0ece6;margin:28px 0 20px;" />
        
            <p style="font-size:11px;color:#d6d3d1;text-align:center;margin:0;line-height:1.5;">본 메일은 byKnit 회원가입 요청에 의해 발송되었습니다.<br/>가입을 요청하지 않으셨다면 이 메일을 무시해 주세요.<br/>© 2026 byKnit. All rights reserved.</p>
          </div>
        </div>`;

        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'byKnit <hello@by-knit.com>',
                    to: email,
                    subject: '[byKnit] 회원가입 인증 메일입니다',
                    html: htmlTemplate
                })
            });
        } catch (e) {
            console.error("Failed to send custom email:", e);
        }
    }

    // Process Referral Bonus if provided
    if (referrerName && newUserId) {
        // Find referrer by username (display_name in profiles)
        const { data: referrerData } = await adminClient
            .from('profiles')
            .select('id')
            .eq('display_name', referrerName)
            .single();

        if (referrerData) {
            // Grant +100 to referrer
            await adminClient.from('credit_transactions').insert({
                user_id: referrerData.id,
                amount: 100,
                type: 'earning',
                description: `Referral Bonus (referred ${username})`
            });

            // Grant +100 to new user
            await adminClient.from('credit_transactions').insert({
                user_id: newUserId,
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

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return redirect('/login?error=' + encodeURIComponent('Authentication required.'));
    }

    const data = Object.fromEntries(formData)
    const username = data.username as string;

    const usernameRegex = /^[A-Za-z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
        return redirect('/onboarding?error=' + encodeURIComponent('프로필 이름은 영문, 숫자, 특수문자(._-)만 가능합니다.'))
    }

    const privacyAgreed = data.privacy_policy_agreed === 'on';
    const adAgreement = data.ad_agreement === 'on';
    const marketingConsent = data.marketing_consent === 'on';
    const ageVerification = data.age_verification === 'on';

    if (!privacyAgreed || !adAgreement || !ageVerification) {
        return redirect('/onboarding?error=' + encodeURIComponent('필수 약관에 동의해주세요.'))
    }

    const referrerName = data.referrer_name as string;

    // Update raw_user_meta_data
    await supabase.auth.updateUser({
        data: {
            username: username,
            full_name: username,
            privacy_policy_agreed: privacyAgreed,
            ad_agreement: adAgreement,
            marketing_consent: marketingConsent,
            referrer_name: referrerName || null,
        }
    });

    // Update profiles table explicitly
    const { error: profileUpdateError } = await supabase.from('profiles').update({
        display_name: username,
        username: username,
        privacy_policy_agreed: privacyAgreed
    }).eq('id', user.id);

    if (profileUpdateError) {
        return redirect('/onboarding?error=' + encodeURIComponent(profileUpdateError.message));
    }

    // Process Referral Bonus if provided
    if (referrerName) {
        // Find referrer by username (display_name in profiles)
        const { data: referrerData } = await supabase
            .from('profiles')
            .select('id')
            .eq('display_name', referrerName)
            .single();

        if (referrerData && referrerData.id !== user.id) {
            // Check if user already got a referral bonus
            const { data: existingBonus } = await supabase
                .from('credit_transactions')
                .select('id')
                .eq('user_id', user.id)
                .eq('description', 'Referred Sign Up Bonus')
                .single();
                
            if (!existingBonus) {
                // Grant +100 to referrer
                await supabase.from('credit_transactions').insert({
                    user_id: referrerData.id,
                    amount: 100,
                    type: 'earning',
                    description: `Referral Bonus (referred ${username})`
                });

                // Grant +100 to new user
                await supabase.from('credit_transactions').insert({
                    user_id: user.id,
                    amount: 100,
                    type: 'earning',
                    description: 'Referred Sign Up Bonus'
                });
            }
        }
    }

    // Success - Redirect to home
    revalidatePath('/', 'layout');
    redirect('/');
}

