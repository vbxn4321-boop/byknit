'use client';

import { useTranslations } from 'next-intl';
import { Gauge, ArrowUp } from 'lucide-react';

export function EmptyGaugeState() {
    const t = useTranslations('calculator');

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-100 to-peach-100 flex items-center justify-center mb-6 shadow-soft">
                <Gauge className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-brown-700 mb-2">
                {t('emptyState.title')}
            </h3>
            <p className="text-stone-500 max-w-sm mb-6">
                {t('emptyState.description')}
            </p>
            <div className="flex items-center gap-2 text-rose-400 animate-bounce">
                <ArrowUp className="w-5 h-5" />
                <span className="font-medium">{t('emptyState.hint')}</span>
            </div>
        </div>
    );
}
