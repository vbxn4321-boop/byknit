import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Heart, Instagram, Twitter } from 'lucide-react';

export function Footer() {
    const t = useTranslations('common');
    const tFooter = useTranslations('footer');
    const tCommunity = useTranslations('community');
    const locale = useLocale();

    return (
        <footer className="border-t border-tan-200 bg-cream-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-300 to-peach-200 flex items-center justify-center shadow-soft">
                                <Heart className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold text-brown-700">
                                {t('appName')}
                            </span>
                        </div>
                        <p className="text-brown-600 text-sm leading-relaxed">
                            {t('tagline')}
                        </p>
                    </div>

                    {/* 플랫폼 */}
                    <div className="text-center">
                        <h3 className="font-semibold text-brown-700 mb-4">{tFooter('platform')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href={`/${locale}/marketplace`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('marketplace')}</Link></li>
                            <li><Link href={`/${locale}/editor`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('patternEditor')}</Link></li>
                            <li><Link href={`/${locale}/ai`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('aiGenerator')}</Link></li>
                        </ul>
                    </div>

                    {/* 커뮤니티 */}
                    <div className="text-center">
                        <h3 className="font-semibold text-brown-700 mb-4">{tCommunity('title')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href={`/${locale}/community`} className="text-brown-600 hover:text-rose-400 transition-colors">{tCommunity('filters.latest')}</Link></li>
                            <li><Link href={`/${locale}/community`} className="text-brown-600 hover:text-rose-400 transition-colors">{tCommunity('filters.popular')}</Link></li>
                            <li><Link href={`/${locale}/community`} className="text-brown-600 hover:text-rose-400 transition-colors">{tCommunity('filters.myActivity')}</Link></li>
                        </ul>
                    </div>

                    {/* 리소스 */}
                    <div className="text-center">
                        <h3 className="font-semibold text-brown-700 mb-4">{tFooter('resources')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href={`/${locale}/help`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('helpCenter')}</Link></li>
                            <li><Link href={`/${locale}/tutorials`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('tutorials')}</Link></li>
                            <li><Link href={`/${locale}/blog`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('blog')}</Link></li>
                            <li><Link href={`/${locale}/marketplace#credit-rewards`} className="text-brown-600 hover:text-rose-400 transition-colors">{tCommunity('sidebar.coinRewardInfo')}</Link></li>
                        </ul>
                    </div>

                    {/* 법적 */}
                    <div className="text-center">
                        <h3 className="font-semibold text-brown-700 mb-4">{tFooter('legal')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href={`/${locale}/privacy`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('privacyPolicy')}</Link></li>
                            <li><Link href={`/${locale}/terms`} className="text-brown-600 hover:text-rose-400 transition-colors">{tFooter('termsOfService')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-tan-200">
                    {/* Business Info & Disclaimer */}
                    <div className="mb-12 space-y-6 text-[11px] leading-relaxed text-stone-500">
                        <div className="space-y-1">
                            <h4 className="font-bold text-brown-800 text-sm mb-2">{tFooter('businessInfo.companyName')}</h4>
                            <p>{tFooter('businessInfo.representative')} | {tFooter('businessInfo.businessLicense')}</p>
                            <p>{tFooter('businessInfo.address')}</p>
                            <p>{tFooter('businessInfo.cpo')}</p>
                            <p>{tFooter('businessInfo.contact')} | {tFooter('businessInfo.hosting')}</p>
                            <div className="pt-1">
                                <a
                                    href="http://www.ftc.go.kr/bizCommPop.do?wrkr_no=20190895"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline hover:text-rose-500 transition-colors"
                                >
                                    {tFooter('businessInfo.checkBusinessInfo')}
                                </a>
                            </div>
                        </div>

                        <p className="pt-4 border-t border-tan-200/50 max-w-4xl text-stone-400">
                            {tFooter('businessInfo.disclaimer')}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm text-brown-600">
                            <span>{tFooter('copyright', { year: new Date().getFullYear() })}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-tan-200 flex items-center justify-center text-brown-600 hover:text-rose-400 hover:border-rose-300 transition-all shadow-soft">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white border border-tan-200 flex items-center justify-center text-brown-600 hover:text-rose-400 hover:border-rose-300 transition-all shadow-soft">
                                <Instagram className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
