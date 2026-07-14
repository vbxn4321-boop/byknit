const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DESIGNER_ID = '1c5cab92-64d4-4b8f-99cb-c20539ee740f';

const PATTERNS_TO_PUBLISH = [
    {
        designer_id: DESIGNER_ID,
        type: 'internal_pdf',
        title: {
            ko: "초보자를 위한 '데일리 코튼 네트백'",
            en: "Daily Cotton Net Bag (Beginner Friendly)"
        },
        description: {
            ko: "<p>난이도: ★☆☆☆☆ (초급 / 코바늘 입문 추천)</p><p>완성 사이즈: 가로 약 30cm, 세로 약 32cm (끈 제외)</p><p>권장 바늘: 코바늘 5/0호 (3.0mm)</p><p>권장 실: 면사(Cotton) 100% 약 120g</p><p>게이지: 한길긴뜨기 기준 20코 x 10단 = 10 x 10 cm</p>",
            en: "<p>Difficulty: ★☆☆☆☆ (Beginner / Crochet Intro)</p><p>Finished Size: Approx. 30cm wide, 32cm long (excluding straps)</p><p>Recommended Hook: US C-2 / 5/0 (3.0mm)</p><p>Recommended Yarn: 100% Cotton yarn, approx. 120g</p><p>Gauge: 20 sts x 10 rows = 10 x 10 cm in Double Crochet</p>",
            detailed_ko: `<p>### 시작 부분 (Cast On)</p>
<p>코바늘 5/0호와 면 100% 실을 준비합니다. 기초 사슬뜨기 35코를 부드럽게 잡습니다.</p>
<p></p>
<p>1. 바닥 타원형 뜨기 (Base)</p>
<p>기둥 사슬 3코를 세운 후, 마지막 사슬코에 한길긴뜨기 2코를 더 뜹니다. 이어서 각 사슬코마다 한길긴뜨기를 1코씩 쭉 뜨고, 시작 사슬코(반대쪽 끝)에는 한길긴뜨기 5코를 모아 떠서 둥글게 회전합니다. 반대편도 동일하게 대칭으로 뜨고 첫 기둥코에 빼뜨기하여 바닥 단을 마무리합니다. (총 74코)</p>
<p></p>
<p>2. 몸통 그물 무늬 뜨기 (Net Body)</p>
<p>2단: 기둥코 사슬 4코(한길긴뜨기 1코 + 사슬 1코 역할)를 세우고, 바닥 1코를 건너뛴 뒤 다음 코에 한길긴뜨기 1코를 뜹니다. 이어서 [사슬 1코, 1코 건너기, 한길긴뜨기 1코] 패턴을 단 끝까지 반복하고 사슬코에 빼뜨기합니다.</p>
<p>3단 ~ 20단: 2단과 동일하게 그물(네트) 무늬를 원하는 높이(약 30cm)가 될 때까지 평단으로 계속 반복하여 높이를 올립니다.</p>
<p></p>
<p>3. 가방 끈 뜨기 (Straps)</p>
<p>21단: 그물 무늬 위에 전체적으로 짧은뜨기를 1단 평단으로 뜹니다.</p>
<p>22단 (끈 위치 잡기): 짧은뜨기 15코를 뜨고, 가방 끈이 될 사슬뜨기 60코를 허공에 뜹니다. 아래 몸판에서 15코를 건너뛴 후 다시 짧은뜨기 22코를 뜹니다. 이어서 사슬뜨기 60코를 뜨고 15코를 건너뛴 뒤 남은 코를 짧은뜨기로 마무리합니다.</p>
<p>23단 ~ 24단: 가방 끈 사슬코 부분을 포함한 전체 코에 짧은뜨기를 떠서 끈을 도톰하고 튼튼하게 보강합니다.</p>
<p></p>
<p>4. 마무리 (Finishing)</p>
<p>실을 자르고 약 15cm 남긴 뒤, 돗바늘을 이용하여 실꼬리들을 가방 안쪽 편물 사이사이로 숨겨 깔끔하게 정리합니다. 시원하고 가벼운 데일리 코튼 네트백이 완성됩니다!</p>`,
            detailed_en: `<p>### Cast On</p>
<p>Prepare a 3.0mm crochet hook and 100% cotton yarn. Chain 35 stitches loosely.</p>
<p></p>
<p>1. Oval Base</p>
<p>Chain 3 to start, then work 2 double crochets in the last chain. Work 1 double crochet in each chain across. In the very first chain, work 5 double crochets to turn. Repeat on the opposite side, slip stitch to join. (Total 74 sts)</p>
<p></p>
<p>2. Net Body</p>
<p>Round 2: Chain 4 (counts as 1 dc + ch 1), skip 1 st, dc in next st. Repeat [ch 1, skip 1, dc 1] around. Slip stitch to join.</p>
<p>Rounds 3-20: Repeat Round 2 until the bag reaches approx. 30cm in height.</p>
<p></p>
<p>3. Straps</p>
<p>Round 21: Work single crochet in each stitch around.</p>
<p>Round 22: Sc 15, chain 60 for the strap, skip 15 sts, sc 22, chain 60, skip 15 sts, sc to the end.</p>
<p>Rounds 23-24: Work single crochet in all stitches, including the chain straps, to make them sturdy.</p>
<p></p>
<p>4. Finishing</p>
<p>Cut yarn, weave in all loose ends on the inside of the bag using a tapestry needle. Your cool Daily Cotton Net Bag is ready!</p>`
        },
        price_usd: 0,
        price_krw: 0,
        category: 'accessory',
        subcategory: 'bag',
        difficulty: 'beginner',
        is_free: true,
        status: 'published',
        images: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop'],
        item_type: 'digital',
        content: {
            type: 'pdf',
            pdf_url: '',
            original_filename: "데일리 코튼 네트백.pdf",
            metadata: {
                craft_type: 'crochet',
                subcategory: 'bag',
                yarn_weight: 'Fingering or Sport',
                needles: '3.0mm (5/0)',
                gauge: '20코 x 10단',
                sizes: { ko: '원사이즈', en: 'One Size' },
                measurements: { ko: '가로 30cm, 세로 32cm', en: 'Width 30cm, Length 32cm' }
            }
        }
    },
    {
        designer_id: DESIGNER_ID,
        type: 'internal_pdf',
        title: {
            ko: "네츄럴 와이어 라피아 햇",
            en: "Natural Wire Raffia Hat"
        },
        description: {
            ko: "<p>난이도: ★★☆☆☆ (초중급 / 코바늘 모자)</p><p>완성 사이즈: 머리 둘레 약 56~58cm (성인 여성 기준)</p><p>권장 바늘: 코바늘 6/0호 (3.5mm)</p><p>권장 실: 라피아실 (종이실) 약 100g</p><p>부자재: 모자 챙용 와이어 약 1m, 열수축 튜브 또는 테이프</p>",
            en: "<p>Difficulty: ★★☆☆☆ (Advanced Beginner / Hat)</p><p>Size: Head circumference approx. 56~58cm</p><p>Recommended Hook: US E-4 / 6/0 (3.5mm)</p><p>Recommended Yarn: Raffia paper yarn, approx. 100g</p><p>Materials: Hat brim wire (approx. 1m), shrink tube</p>",
            detailed_ko: `<p>### 시작 부분 (Cast On)</p>
<p>코바늘 6/0호와 라피아실을 준비합니다. 손에 힘을 빼고 매직링을 만들어 짧은뜨기 6코로 시작합니다.</p>
<p></p>
<p>1. 모자 탑 부분 늘림 (Crown)</p>
<p>1단 ~ 12단: 원형 늘리기 규칙(단마다 6코씩 균일하게 늘림)을 적용하여 원형판을 뜹니다. 12단이 끝나면 총 72코가 되며, 정수리 지름이 약 16.5cm가 될 때까지 코를 늘려줍니다.</p>
<p></p>
<p>2. 모자 바디 평단 뜨기 (Body)</p>
<p>13단 ~ 28단: 코 늘림 없이 72코 평단으로 짧은뜨기를 계속 뜹니다. 모자가 아래로 둥글게 처지면서 머리를 감싸는 바디라인이 형성됩니다. 높이가 약 9~10cm가 되면 멈춤니다.</p>
<p></p>
<p>3. 모자 챙 코늘림 및 와이어 작업 (Brim)</p>
<p>29단: [짧은뜨기 5코, 코늘림 1코] 패턴을 단 끝까지 반복하여 챙을 넓히기 시작합니다.</p>
<p>30단 ~ 38단: 단마다 코가 우글거리지 않도록 완만한 늘림을 진행하며 챙의 넓이를 넓힙니다. (원하는 넓이만큼 단수 조절 가능)</p>
<p>39단 (와이어 삽입): 챙의 마지막 단을 뜰 때, 준비한 모자 와이어를 편물 가장자리에 대고 실로 감싸 안으며 짧은뜨기를 뜹니다. 와이어 끝은 1cm 정도 겹쳐 열수축 튜브나 테이프로 단단히 고정합니다.</p>
<p></p>
<p>4. 마무리 (Finishing)</p>
<p>마지막 코에 빼뜨기한 후 실을 여유 있게 자르고, 돗바늘로 실꼬리를 모자 안쪽으로 숨깁니다. 완성된 모자는 스팀다리미를 살짝 띄워 스팀을 쐬어주면 형태가 예쁘게 고정됩니다.</p>`,
            detailed_en: `<p>### Cast On</p>
<p>Prepare a 3.5mm hook and raffia yarn. Make a magic ring and work 6 single crochets.</p>
<p></p>
<p>1. Crown</p>
<p>Rounds 1-12: Increase 6 stitches evenly in each round. At Round 12, you will have 72 sts (diameter approx. 16.5cm).</p>
<p></p>
<p>2. Body</p>
<p>Rounds 13-28: Work even in single crochet (72 sts) until the hat body measures approx. 9-10cm from the crown.</p>
<p></p>
<p>3. Brim & Wire</p>
<p>Round 29: Work [sc 5, inc 1] around to start the brim.</p>
<p>Rounds 30-38: Increase gradually to keep the brim flat and smooth.</p>
<p>Round 39 (Wire): Place the brim wire along the edge and single crochet over it to enclose the wire. Secure wire ends with a shrink tube.</p>
<p></p>
<p>4. Finishing</p>
<p>Slip stitch, cut yarn and weave in ends. Lightly steam the hat to block it into shape.</p>`
        },
        price_usd: 10,
        price_krw: 14500,
        category: 'accessory',
        subcategory: 'hat',
        difficulty: 'intermediate',
        is_free: false,
        status: 'published',
        images: ['https://images.unsplash.com/photo-1533461502717-83546f485d24?w=600&auto=format&fit=crop'],
        item_type: 'digital',
        content: {
            type: 'pdf',
            pdf_url: '',
            original_filename: "네츄럴 와이어 라피아 햇.pdf",
            metadata: {
                craft_type: 'crochet',
                subcategory: 'hat',
                yarn_weight: 'Sport or DK',
                needles: '3.5mm (6/0)',
                gauge: '18코 x 20단',
                sizes: { ko: '여성 프리사이즈', en: 'Women Free Size' },
                measurements: { ko: '머리둘레 56~58cm', en: 'Circumference 56~58cm' }
            }
        }
    },
    {
        designer_id: DESIGNER_ID,
        type: 'internal_pdf',
        title: {
            ko: "프렌치 리브 린넨 슬리브리스 (여름 니트)",
            en: "French Rib Linen Sleeveless Top"
        },
        description: {
            ko: "<p>난이도: ★★★☆☆ (중급자 추천 / 대바늘 의류)</p><p>완성 사이즈: M 사이즈 (가슴둘레 약 92cm, 총장 약 48cm)</p><p>권장 바늘: 대바늘 4.0mm (정형 고무단용 3.5mm)</p><p>권장 실: 린넨(Linen) 100% 또는 린넨/코튼 혼방사 약 180g</p><p>게이지: 프렌치 리브 무늬 기준 22코 x 28단 = 10 x 10 cm</p>",
            en: "<p>Difficulty: ★★★☆☆ (Intermediate / Garment)</p><p>Size: Medium (Bust 92cm, Length 48cm)</p><p>Recommended Needles: US 6 / 4.0mm (US 4 / 3.5mm for ribbing)</p><p>Recommended Yarn: 100% Linen or Linen blend, approx. 180g</p><p>Gauge: 22 sts x 28 rows = 10 x 10 cm in French Rib pattern</p>",
            detailed_ko: `<p>### 시작 부분 (Cast On)</p>
<p>대바늘 3.5mm 바늘로 신축성 있는 코잡기 기법을 사용하여 160코를 잡고 원형으로 연결합니다. (바텀업 방식으로 진행됩니다.)</p>
<p></p>
<p>1. 몸통 밑단 및 본판 뜨기 (Body)</p>
<p>1단 ~ 8단: 1코 고무뜨기(겉1, 안1)로 밑단을 탄탄하게 멉니다.</p>
<p>9단: 4.0mm 바늘로 교체하고 본판 무늬인 [프렌치 리브 무늬(겉뜨기 3코, 안뜨기 1코)]를 진행합니다. 무늬를 유지하며 총장 30cm가 될 때까지 평단으로 원형 뜨기를 진행합니다.</p>
<p></p>
<p>2. 앞판/뒤판 분할 및 암홀 줄임 (Armholes)</p>
<p>앞판 80코와 뒤판 80코를 분할하여, 이제부터는 각각 편물을 돌려가며 평면 왕복 뜨기로 진행합니다.</p>
<p>앞판 암홀 줄임 (경사각 만들기): 매 2단마다 양 끝 2코 안쪽에서 코줄임(K2tog, SSK)을 진행합니다. 양쪽에서 각각 1코씩, 총 12회 줄여줍니다. (앞판 남은 코수: 56코)</p>
<p></p>
<p>3. U넥 라인 및 어깨 경사뜨기 (Neckline & Shoulder)</p>
<p>앞판 높이가 암홀 분할선으로부터 12cm가 되었을 때, U넥 라인을 만들기 위해 중심 16코를 코막음(BO)합니다.</p>
<p>좌우 어깨를 분할하여 넥라인 양 끝에서 매 2단마다 1코씩 총 6회 줄입니다. (어깨 남은 코수: 각 14코)</p>
<p>어깨 경사뜨기: 어깨선이 뒤로 자연스럽게 흐르도록 독일식 되돌아뜨기(German Short Rows) 기법을 사용하여 5코, 5코, 4코 순으로 3회 나누어 경사를 깎아준 뒤 코막음합니다. 뒤판도 동일한 높이로 작업 후 어깨선을 매트리스 스티치로 이어붙입니다.</p>
<p></p>
<p>4. 아이코드 마감 및 마무리 (Finishing)</p>
<p>3.5mm 바늘을 사용하여 목 둘레와 양쪽 진동둘레(암홀)에서 코를 고르게 줍습니다.</p>
<p>3코 아이코드(I-Cord) 기법을 사용하여 테두리를 말끔하고 고급스럽게 마감합니다. 실꼬리를 정리한 후 미지근한 물에 울샴푸로 가볍게 손세탁하고, 블로킹 보드에 핀을 꽂아 편물을 반듯하게 펴서 그늘에 건조하여 완성합니다.</p>`,
            detailed_en: `<p>### Cast On</p>
<p>Using 3.5mm circular needles, cast on 160 sts. Join in the round. (Worked bottom-up)</p>
<p></p>
<p>1. Ribbing & Body</p>
<p>Rounds 1-8: Work in 1x1 rib (k1, p1).</p>
<p>Round 9: Change to 4.0mm needles. Work in French Rib pattern [k3, p1] around until body measures 30cm from cast-on edge.</p>
<p></p>
<p>2. Armhole Shaping</p>
<p>Divide work into Front (80 sts) and Back (80 sts). Work flat from here.</p>
<p>Front Armhole: Decrease 1 st at each end every RS row (using k2tog and ssk) 12 times. (56 sts remaining on Front)</p>
<p></p>
<p>3. Neckline & Short Rows</p>
<p>When front armhole measures 12cm, bind off center 16 sts for the U-neck.</p>
<p>Shape neck: Decrease 1 st at neck edge every 2nd row 6 times. (14 sts remaining for each shoulder)</p>
<p>Shoulder Short Rows: Work German Short Rows over the remaining shoulder stitches in 3 steps (5, 5, 4 sts) for a slope. Bind off. Repeat for Back and join shoulders using mattress stitch.</p>
<p></p>
<p>4. I-Cord Edging & Blocking</p>
<p>Using 3.5mm needles, pick up stitches evenly along the neckline and armholes.</p>
<p>Work a 3-stitch I-cord bind-off for a clean, professional finish. Weave in all ends. Wet block the garment to open up the linen lace texture.</p>`
        },
        price_usd: 15,
        price_krw: 21750,
        category: 'clothing',
        subcategory: 'top',
        difficulty: 'intermediate',
        is_free: false,
        status: 'published',
        images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop'],
        item_type: 'digital',
        content: {
            type: 'pdf',
            pdf_url: '',
            original_filename: "프렌치 리브 린넨 슬리브리스 (여름 니트).pdf",
            metadata: {
                craft_type: 'knitting',
                subcategory: 'top',
                yarn_weight: 'DK',
                needles: '4.0mm (US 6) & 3.5mm (US 4)',
                gauge: '22코 x 28단',
                sizes: { ko: 'M 사이즈', en: 'Medium' },
                measurements: { ko: '가슴둘레 92cm, 총장 48cm', en: 'Bust 92cm, Length 48cm' }
            }
        }
    }
];

async function publish() {
    console.log('Starting to publish 3 summer patterns...');
    
    for (const pattern of PATTERNS_TO_PUBLISH) {
        console.log(`Publishing: ${pattern.title.ko}`);
        const { data, error } = await supabase
            .from('patterns')
            .insert(pattern)
            .select()
            .single();
            
        if (error) {
            console.error(`Failed to publish ${pattern.title.ko}:`, error.message);
        } else {
            console.log(`Successfully published! ID: ${data.id}`);
        }
    }
    
    console.log('All done!');
}

publish();
