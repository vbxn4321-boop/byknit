import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/studio/', '/onboarding/', '/reset-password/', '/payments/'],
        },
        sitemap: 'https://by-knit.com/sitemap.xml',
    };
}
