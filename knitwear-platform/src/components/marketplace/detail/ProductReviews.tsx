'use client';

import { useState, useEffect } from 'react';
import { Star, Camera } from 'lucide-react';
import { ReviewList } from '@/components/profile/ReviewList'; // Reusing for now, might need adaptation
import { getReviews } from '@/app/actions/social';
import { User } from '@supabase/supabase-js';

interface ProductReviewsProps {
    patternId: string;
    locale: string;
    user: User | null;
}

export function ProductReviews({ patternId, locale, user }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            const { reviews, error } = await getReviews(patternId);
            if (reviews) setReviews(reviews);
            setLoading(false);
        };
        fetchReviews();
    }, [patternId]);

    const handleWriteReview = () => {
        if (!user) {
            alert(locale === 'ko' ? '로그인이 필요합니다.' : 'Please login to write a review.');
            return;
        }
        // Logic to open review modal would go here. 
        // For this step, we'll just show an alert or placeholder.
        alert(locale === 'ko' ? '구매하거나 다운로드한 상품에만 리뷰를 작성할 수 있습니다.' : 'You can only review products you have purchased or downloaded.');
    };

    if (loading) return <div className="py-10 text-center text-gray-400">Loading reviews...</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {locale === 'ko' ? '구매후기' : 'Reviews'}
                        <span className="text-brown-500 ml-1">({reviews.length})</span>
                    </h3>
                    <p className="text-sm text-gray-500">
                        {locale === 'ko' ? '상품을 구매/다운로드하신 분들만 작성하실 수 있습니다.' : 'Only verified purchasers can write reviews.'}
                    </p>
                </div>
                <button
                    onClick={handleWriteReview}
                    className="px-5 py-2.5 bg-brown-800 text-white text-sm font-bold rounded-xl hover:bg-brown-900 transition-colors flex items-center gap-2"
                >
                    <Camera size={16} />
                    {locale === 'ko' ? '리뷰 작성하기' : 'Write Review'}
                </button>
            </div>

            {/* Reuse existing ReviewList but strictly for this pattern */}
            <ReviewList initialReviews={reviews} locale={locale} user={user} />
        </div>
    );
}
