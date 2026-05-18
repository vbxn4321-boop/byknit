import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/utils/supabase/middleware';
import { locales, defaultLocale } from './i18n/request';

const handleI18n = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
});

export default async function middleware(request: NextRequest) {
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
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
