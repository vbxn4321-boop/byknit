
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'
    const { locale } = await params

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check if user has completed onboarding
            const { data: { user } } = await supabase.auth.getUser();
            let needsOnboarding = false;
            
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('privacy_policy_agreed')
                    .eq('id', user.id)
                    .single();
                
                if (!profile || !profile.privacy_policy_agreed) {
                    needsOnboarding = true;
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // Normalize next path (ensure it doesn't already have a locale or redundant slashes)
            const cleanNext = next.startsWith('/') ? next : `/${next}`
            const redirectPath = needsOnboarding 
                ? `/${locale}/onboarding` 
                : `/${locale}${cleanNext === '/' ? '' : cleanNext}`

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`)
}
