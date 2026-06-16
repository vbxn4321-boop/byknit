import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://byknit.com';
    const locales = ['ko', 'en'];

    // 1. Static paths
    const staticPaths = [
        '',
        '/marketplace',
        '/translator',
        '/community',
        '/tutorials',
        '/help',
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Add static paths for each locale
    for (const locale of locales) {
        for (const path of staticPaths) {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}${path}`,
                lastModified: new Date(),
                changeFrequency: path === '' ? 'daily' : 'weekly',
                priority: path === '' ? 1.0 : 0.8,
            });
        }
    }

    // 2. Dynamic marketplace patterns paths
    try {
        if (supabaseUrl && supabaseAnonKey) {
            const { data: patterns } = await supabase
                .from('patterns')
                .select('id, updated_at')
                .limit(500);

            if (patterns) {
                for (const pattern of patterns) {
                    for (const locale of locales) {
                        sitemapEntries.push({
                            url: `${baseUrl}/${locale}/marketplace/${pattern.id}`,
                            lastModified: pattern.updated_at ? new Date(pattern.updated_at) : new Date(),
                            changeFrequency: 'weekly',
                            priority: 0.6,
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error generating dynamic patterns sitemap:', e);
    }

    // 3. Dynamic community posts paths
    try {
        if (supabaseUrl && supabaseAnonKey) {
            const { data: posts } = await supabase
                .from('posts')
                .select('id, updated_at')
                .limit(500);

            if (posts) {
                for (const post of posts) {
                    for (const locale of locales) {
                        sitemapEntries.push({
                            url: `${baseUrl}/${locale}/community/${post.id}`,
                            lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
                            changeFrequency: 'weekly',
                            priority: 0.5,
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error generating dynamic posts sitemap:', e);
    }

    return sitemapEntries;
}
