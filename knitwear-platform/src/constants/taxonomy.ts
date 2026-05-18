export const CATEGORY_TAXONOMY = {
    clothing: {
        label: { en: 'Clothing', ko: '의류' },
        sub: [
            { id: 'sweater', label: { en: 'Sweater/Pullover', ko: '스웨터/풀오버' } },
            { id: 'cardigan', label: { en: 'Cardigan', ko: '가디건' } },
            { id: 'vest', label: { en: 'Vest', ko: '조끼/베스트' } },
            { id: 'top', label: { en: 'Top/Tee', ko: '상의/티셔츠' } },
            { id: 'dress', label: { en: 'Dress/Skirt', ko: '원피스/스커트' } },
            { id: 'outer', label: { en: 'Coat/Jacket', ko: '아우터/코트' } },
            { id: 'intimates', label: { en: 'Intimates/Swim', ko: '속옷/수영복' } },
        ]
    },
    accessory: {
        label: { en: 'Accessories', ko: '액세서리/잡화' },
        sub: [
            { id: 'scarf', label: { en: 'Scarf/Cowl', ko: '목도리/워머' } },
            { id: 'shawl', label: { en: 'Shawl/Wrap', ko: '숄/랩' } },
            { id: 'hat', label: { en: 'Hat/Beanie', ko: '모자/비니' } },
            { id: 'gloves', label: { en: 'Gloves/Mittens', ko: '장갑/워머' } },
            { id: 'socks', label: { en: 'Socks/Footwear', ko: '양말/신발' } },
            { id: 'bag', label: { en: 'Bag/Purse', ko: '가방/파우치' } },
            { id: 'jewelry', label: { en: 'Headwear/Jewelry', ko: '헤어/주얼리' } },
        ]
    },
    home: {
        label: { en: 'Home/Living', ko: '홈/리빙' },
        sub: [
            { id: 'blanket', label: { en: 'Blanket', ko: '담요/블랭킷' } },
            { id: 'cushion', label: { en: 'Cushion', ko: '쿠션' } },
            { id: 'scrubber', label: { en: 'Scrubber', ko: '수세미' } },
            { id: 'coaster', label: { en: 'Coaster/Mat', ko: '코스터/매트' } },
            { id: 'basket', label: { en: 'Basket/Storage', ko: '바구니/정리함' } },
            { id: 'cover', label: { en: 'Cover/Case', ko: '커버/케이스' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    baby: {
        label: { en: 'Baby/Kids', ko: '유아/아동' },
        sub: [
            { id: 'baby_clothes', label: { en: 'Baby Clothes', ko: '의류' } },
            { id: 'baby_hat', label: { en: 'Hat/Bonnet', ko: '모자/보넷' } },
            { id: 'baby_socks', label: { en: 'Socks/Booties', ko: '양말/신발' } },
            { id: 'baby_blanket', label: { en: 'Baby Blanket', ko: '겉싸개/담요' } },
            { id: 'baby_etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    toy_hobby: {
        label: { en: 'Toys & Hobbies', ko: '장난감/취미' },
        sub: [
            { id: 'doll', label: { en: 'Doll/Toy', ko: '인형' } },
            { id: 'amigurumi', label: { en: 'Amigurumi', ko: '아미구루미' } },
            { id: 'ornament', label: { en: 'Ornament', ko: '장식품/오너먼트' } },
        ]
    },
    pet: {
        label: { en: 'Pets', ko: '애완동물' },
        sub: [
            { id: 'pet_clothes', label: { en: 'Pet Clothes', ko: '강아지/고양이 옷' } },
            { id: 'pet_toy', label: { en: 'Pet Toy', ko: '장난감' } },
            { id: 'pet_access', label: { en: 'Pet Accessories', ko: '액세서리' } },
        ]
    },
    other: {
        label: { en: 'Others', ko: '기타' },
        sub: [
            { id: 'pattern_component', label: { en: 'Component/Stitch Pattern', ko: '패턴/스티치 (부분)' } },
            { id: 'chart', label: { en: 'Chart Only', ko: '차트/도안' } },
            { id: 'button', label: { en: 'Button/Component', ko: '단추/부자재' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    }
};

export const YARN_WEIGHTS = [
    { id: 'lace', label: 'Lace (레이스)' },
    { id: 'fingering', label: 'Fingering (핑거링/4ply)' },
    { id: 'sport', label: 'Sport (스포트/5ply)' },
    { id: 'dk', label: 'DK (DK/8ply)' },
    { id: 'worsted', label: 'Worsted (워스티드/10ply)' },
    { id: 'bulky', label: 'Bulky (벌키/12ply)' },
    { id: 'super_bulky', label: 'Super Bulky (슈퍼 벌키)' },
];
