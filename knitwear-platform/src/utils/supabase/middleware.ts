
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest, i18nResponse?: NextResponse) {
    let supabaseResponse = i18nResponse ?? NextResponse.next({
        request,
    })

    // Create client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // Mutate the existing response (which might be the i18nResponse)
                    // instead of creating a new one to preserve redirects/rewrites.
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected Routes Logic
    // const path = request.nextUrl.pathname;

    // protected paths regex (ignoring locale prefix)
    // const isProtected = /\/(en|ko)?\/?(studio|ai|editor).*/.test(path);
    const isProtected = false; // Disable server-side redirect to allow client-side "login required" popups

    if (!user && isProtected) {
        // Redirect to login
        // Preserve the locale if possible
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
