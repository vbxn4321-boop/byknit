import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
        const cookieStore = await cookies()
        
        // Construct fallback response early so we can write cookies to it
        const redirectUrl = new URL(`/${locale}`, request.url)
        const response = NextResponse.redirect(redirectUrl)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                                response.cookies.set(name, value, options)
                            })
                        } catch (e) {
                            // ignore set error
                        }
                    },
                },
            }
        )

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

            let targetUrl = `${origin}${redirectPath}`
            if (!isLocalEnv && forwardedHost) {
                targetUrl = `https://${forwardedHost}${redirectPath}`
            }

            response.headers.set('Location', targetUrl)
            return response
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`)
}
