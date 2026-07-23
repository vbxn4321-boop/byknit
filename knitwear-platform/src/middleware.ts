import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware';
import { locales, defaultLocale } from './i18n/request';

const handleI18n = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 💡 Naver site verification, robots.txt, sitemap.xml, favicon, icons should bypass I18n locale redirection
    if (
        pathname === '/robots.txt' || 
        pathname === '/sitemap.xml' || 
        pathname === '/favicon.ico' ||
        pathname === '/favicon.svg' ||
        pathname.startsWith('/icon') ||
        pathname.startsWith('/apple-icon') ||
        pathname.startsWith('/naver') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.png')
    ) {
        return NextResponse.next();
    }

    // 1. Run I18n middleware to get the localized response (rewrites/redirects)
    const i18nResponse = handleI18n(request);

    // 2. Pass this response to Supabase middleware to manage session cookies on top of it
    return await updateSession(request, i18nResponse);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, icon, apple-icon
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         */
        '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|naver|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
