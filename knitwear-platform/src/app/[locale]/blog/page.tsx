import { useTranslations } from 'next-intl';

export default function BlogPage() {
    const t = useTranslations('footer');
    return (
        <div className="min-h-[60vh] py-20 px-4 flex flex-col items-center justify-center bg-cream-50">
            <h1 className="text-4xl font-bold text-brown-700 mb-4">{t('blog')}</h1>
            <p className="text-brown-600">Coming Soon / 준비 중입니다</p>
        </div>
    );
}
