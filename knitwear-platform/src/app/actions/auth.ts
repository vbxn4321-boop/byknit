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
    const password = (data.password as string).normalize('NFC')

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

export async function sendSignupOtp(formData: FormData) {
    const data = Object.fromEntries(formData);
    const email = data.email as string;
    
    const username = data.username as string;
    const passwordConfirm = data.passwordConfirm as string;
    const password = data.password as string;

    // Validate Username (English only)
    const usernameRegex = /^[A-Za-z0-9._-]+$/;
    if (!usernameRegex.test(username)) {
        return { error: '프로필 이름은 영문, 숫자, 특수문자(._-)만 가능합니다.' };
    }

    if (password !== passwordConfirm) {
        return { error: '비밀번호가 일치하지 않습니다.' };
    }

    const privacyAgreed = data.privacy_policy_agreed === 'on';
    const adAgreement = data.ad_agreement === 'on';

    // Validate required fields (double check server-side)
    if (!privacyAgreed || !adAgreement) {
        return { error: '필수 약관에 동의해주세요.' };
    }

    const { createAdminClient } = await import('@/utils/supabase/server');
    const adminClient = await createAdminClient();

    // Check if user already exists
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const userExists = existingUser.users.find(u => u.email === email);
    if (userExists) {
        return { error: '이미 가입된 이메일입니다.' };
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Save to database
    const { error: dbError } = await adminClient.from('email_otps').insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt
    });

    if (dbError) {
        return { error: 'OTP 생성 중 오류가 발생했습니다. 다시 시도해주세요.' };
    }

    // Send custom email using Resend API
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
                <span style="font-size:28px;">🔑</span>
              </div>
              <h1 style="font-size:20px;font-weight:800;color:#292524;margin:0 0 8px;">인증번호 안내</h1>
              <p style="font-size:14px;color:#78716c;margin:0;line-height:1.6;">byKnit에 가입해 주셔서 감사합니다!<br/>아래 6자리 인증번호를 가입 화면에 입력해주세요.</p>
            </div>
        
            <div style="text-align:center;margin:32px 0;">
              <div style="display:inline-block;background:#f43f5e;color:#ffffff;font-size:32px;font-weight:800;padding:16px 40px;border-radius:14px;letter-spacing:8px;">${otpCode}</div>
            </div>
        
            <p style="font-size:12px;color:#a8a29e;text-align:center;line-height:1.6;margin:24px 0 0;">이 인증번호는 5분 동안만 유효합니다.</p>
        
            <hr style="border:none;border-top:1px solid #f0ece6;margin:28px 0 20px;" />
        
            <p style="font-size:11px;color:#d6d3d1;text-align:center;margin:0;line-height:1.5;">본 메일은 byKnit 회원가입 요청에 의해 발송되었습니다.<br/>© 2026 byKnit. All rights reserved.</p>
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
                    subject: '[byKnit] 회원가입 인증번호입니다',
                    html: htmlTemplate
                })
            });
        } catch (e) {
            console.error("Failed to send custom email:", e);
        }
    }

    return { success: true, email };
}

export async function verifySignupOtp(formData: FormData) {
    const data = Object.fromEntries(formData);
    const email = data.email as string;
    const otpCode = data.otp_code as string;
    const password = (data.password as string).normalize('NFC');
    const username = data.username as string;
    const privacyAgreed = data.privacy_policy_agreed === 'on';
    const adAgreement = data.ad_agreement === 'on';
    const marketingConsent = data.marketing_consent === 'on';
    const referrerName = data.referrer_name as string;

    const { createAdminClient, createClient } = await import('@/utils/supabase/server');
    const adminClient = await createAdminClient();
    const supabase = await createClient();

    // Verify OTP
    const { data: otpRecords, error: fetchError } = await adminClient
        .from('email_otps')
        .select('*')
        .eq('email', email)
        .eq('otp_code', otpCode)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError || !otpRecords || otpRecords.length === 0) {
        return { error: '인증번호가 올바르지 않거나 만료되었습니다.' };
    }

    // Mark as used
    await adminClient.from('email_otps').update({ is_used: true }).eq('id', otpRecords[0].id);

    // Create user securely
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            username: username,
            full_name: username,
            privacy_policy_agreed: privacyAgreed,
            ad_agreement: adAgreement,
            marketing_consent: marketingConsent,
            referrer_name: referrerName || null,
        }
    });

    if (createError) {
        return { error: '회원 생성 중 오류가 발생했습니다: ' + createError.message };
    }

    const newUserId = userData.user.id;

    // 1. Grant 1000 Welcome Sign Up Bonus to every new user explicitly
    if (newUserId) {
        await adminClient.from('credit_transactions').insert({
            user_id: newUserId,
            amount: 1000,
            type: 'initial_bonus',
            description: 'signUpBonus'
        });
    }

    // Process Referral Bonus if provided
    if (referrerName && newUserId) {
        const { data: referrerData } = await adminClient
            .from('profiles')
            .select('id')
            .eq('display_name', referrerName)
            .single();

        if (referrerData) {
            await adminClient.from('credit_transactions').insert({
                user_id: referrerData.id,
                amount: 100,
                type: 'earning',
                description: `Referral Bonus (referred ${username})`
            });

            await adminClient.from('credit_transactions').insert({
                user_id: newUserId,
                amount: 100,
                type: 'earning',
                description: 'Referred Sign Up Bonus'
            });
        }
    }

    // Auto login
    await supabase.auth.signInWithPassword({ email, password });

    return { success: true };
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

