export const DUMMY_PATTERNS = [
    {
        id: 'dummy-pattern-1',
        title: { ko: '포근한 꽈배기 스웨터 도안', en: 'Cozy Cable Knit Sweater Pattern' },
        item_type: 'digital',
        images: ['/seed/pattern1.png'],
        price_usd: 8.5,
        is_free: false,
        is_on_sale: false,
        discount_percentage: 0,
        author_name: 'byKnit Studio',
        author_avatar: null,
        average_rating: 4.8,
        view_count: 1250,
        download_count: 320,
        like_count: 450,
        is_liked: true
    },
    {
        id: 'dummy-yarn-1',
        title: { ko: '노을빛 수제 염색사 1타래', en: 'Sunset Hand-dyed Yarn Skein' },
        item_type: 'physical',
        images: ['/seed/yarn1.png'],
        price_usd: 24.0,
        is_free: false,
        is_on_sale: true,
        discount_percentage: 15,
        author_name: 'Sunset Yarns',
        author_avatar: null,
        average_rating: 5.0,
        view_count: 890,
        download_count: 0,
        like_count: 210,
        is_liked: false
    },
    {
        id: 'dummy-kit-1',
        title: { ko: '초보자용 뜨개질 스타터 키트', en: 'Beginner Knitting Starter Kit' },
        item_type: 'physical',
        images: ['/seed/kit1.png'],
        price_usd: 45.0,
        is_free: false,
        is_on_sale: false,
        discount_percentage: 0,
        author_name: 'byKnit Official',
        author_avatar: null,
        average_rating: 4.9,
        view_count: 3200,
        download_count: 0,
        like_count: 890,
        is_liked: true
    },
    {
        id: 'dummy-tool-1',
        title: { ko: '감성 우드 대바늘 세트', en: 'Aesthetic Wooden Needle Set' },
        item_type: 'physical',
        images: ['/seed/tool1.png'],
        price_usd: 35.0,
        is_free: false,
        is_on_sale: false,
        discount_percentage: 0,
        author_name: 'Craft & Wood',
        author_avatar: null,
        average_rating: 4.7,
        view_count: 650,
        download_count: 0,
        like_count: 150,
        is_liked: false
    }
];

export const DUMMY_COMMUNITY_POSTS = [
    {
        id: 'dummy-post-1',
        title: '제가 만든 첫 가디건 자랑해요!',
        content: '<p>유튜브 보고 한 달 동안 열심히 떠서 드디어 완성했어요. 카페에서 입고 찍어봤는데 너무 마음에 드네요. 다들 byKnit 도안으로 도전해보세요!</p>',
        author_name: 'KnitLover_99',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        view_count: 450,
        like_count: 85,
        comment_count: 12,
        images: ['/seed/post1.png'],
        category: 'brag'
    },
    {
        id: 'dummy-post-2',
        title: '현재 작업 중인 프로젝트 (진행 중)',
        content: '<p>모헤어 실을 써서 엄청 부드러운데 코가 잘 안 보여서 고생 중입니다 ㅠㅠ 그래도 무늬가 조금씩 나오는 걸 보니 뿌듯하네요.</p>',
        author_name: '따뜻한겨울',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        view_count: 120,
        like_count: 34,
        comment_count: 5,
        images: ['/seed/post2.png'],
        category: 'wip'
    }
];
