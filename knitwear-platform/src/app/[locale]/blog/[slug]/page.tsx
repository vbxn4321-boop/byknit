import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

// Localized blog content helper
const getPostData = (slug: string, locale: string) => {
    const posts: Record<string, any> = {
        'summer-flower-coaster': {
            category: 'tutorial',
            title: locale === 'ko'
                ? '30분 만에 완성하는 감성 가득 여름 린넨 꽃 티코스터 도안'
                : 'Design a Summer Linen Flower Coaster in Just 30 Minutes',
            date: '2026. 07. 03',
            imageUrl: '/blog/thumbnail-4.png',
            content: locale === 'ko'
                ? `
                    <p>더운 여름철, 시원한 아이스 아메리카노나 차가운 음료를 마실 때 컵 표면에 맺히는 물방울 때문에 테이블이 흥건해지곤 하죠? 이럴 때 필요한 것이 바로 실용성과 감성을 모두 잡은 <strong>티코스터(컵받침)</strong>입니다.</p>
                    <br/>
                    <p>오늘은 여름철 대표 소재인 <strong>린넨(Linen) 실</strong>을 사용하여 코바늘로 간단하고 빠르게 뜰 수 있는 <strong>꽃 모양 티코스터 도안</strong>을 소개해 드립니다. 초보자분들도 약 30분이면 뚝딱 완성할 수 있을 만큼 쉽고 직관적인 과정이랍니다!</p>
                    <br/>
                    <h2>준비물 소개</h2>
                    <ul>
                        <li><strong>실</strong>: 린넨 혹은 코튼/린넨 혼방실 (베이지, 크림 계열의 내추럴한 컬러 추천)</li>
                        <li><strong>바늘</strong>: 코바늘 5/0호 (3.0mm)</li>
                        <li><strong>기타</strong>: 돋바늘, 가위</li>
                    </ul>
                    <br/>
                    <h2>바이니트가 제안하는 단계별 뜨개 과정</h2>
                    <ol>
                        <li><strong>1단 (시작코와 기둥코)</strong>: 매직링을 만들고 사슬코 3개(한길긴뜨기 1코에 해당)를 세운 뒤, 링 안에 한길긴뜨기 11코를 더 떠서 총 12코를 만들어 빼뜨기합니다.</li>
                        <li><strong>2단 (코 늘리기)</strong>: 1단의 모든 코에 한길긴뜨기 코늘림(한 코에 두 코씩 뜨기)을 진행하여 총 24코를 만듭니다.</li>
                        <li><strong>3단 (꽃잎 무늬 만들기)</strong>: 사슬코 1개로 기둥을 세운 뒤 <code>[한 코 건너뛰고 다음 코에 한길긴뜨기 5코(조개무늬), 한 코 건너뛰고 다음 코에 짧은뜨기 1코]</code> 패턴을 반복합니다. 자연스럽게 봉긋한 6개의 예쁜 꽃잎이 완성됩니다!</li>
                    </ol>
                    <br/>
                    <h2>여름 린넨 편물의 완성도를 높이는 한 끗, '블로킹(Blocking)'</h2>
                    <p>린넨 실은 뜨고 난 직후에는 다소 울퉁불퉁하거나 꽃잎 모양이 찌그러져 보일 수 있습니다. 이때 완성된 코스터에 물을 살짝 뿌리거나 스팀다리미의 스팀을 멀리서 쐬어준 뒤, 핀으로 모양을 둥글게 고정해 건조시키는 <strong>블로킹 과정</strong>을 거치면 편물이 편평하고 정갈하게 펴지면서 샵에서 파는 듯한 퀄리티로 재탄생합니다.</p>
                    <br/>
                    <p>지금 바로 마켓플레이스에서 <strong>[여름 린넨 꽃 티코스터]</strong> 무료 도안을 다운로드하여 나만의 감성 여름 테이블을 완성해 보세요!</p>
                    <br/>
                    <p>👉 <a href="/ko/marketplace">여름 린넨 꽃 티코스터 무료 도안 다운로드하러 가기</a></p>
                `
                : `
                    <p>During the hot summer, ice-cold beverages leave condensation that puddles on your table. What you need is a beautiful and functional <strong>tea coaster</strong> that captures both utility and aesthetic appeal.</p>
                    <br/>
                    <p>Today, we introduce a <strong>crochet flower coaster pattern</strong> made of summer-friendly <strong>linen yarn</strong>. It is simple enough for beginners to finish in under 30 minutes!</p>
                    <br/>
                    <h2>Materials needed</h2>
                    <ul>
                        <li><strong>Yarn</strong>: Linen or cotton/linen blend (natural beige or cream tones recommended)</li>
                        <li><strong>Hook</strong>: Crochet hook 5/0 (3.0mm)</li>
                        <li><strong>Notions</strong>: Tapestry needle, scissors</li>
                    </ul>
                    <br/>
                    <h2>Step-by-Step Tutorial</h2>
                    <ol>
                        <li><strong>Round 1 (Magic Ring)</strong>: Start with a magic ring. Chain 3 (counts as first dc), work 11 double crochets into the ring. Slip stitch to join (12 sts).</li>
                        <li><strong>Round 2 (Increase)</strong>: Chain 3, work 2 double crochets into each stitch around. Slip stitch to join (24 sts).</li>
                        <li><strong>Round 3 (Flower Petals)</strong>: Chain 1, <code>[skip 1 stitch, work 5 double crochets into the next stitch (shell stitch), skip 1 stitch, slip stitch/single crochet into the next stitch]</code>. Repeat this pattern to create 6 lovely rounded flower petals!</li>
                    </ol>
                    <br/>
                    <h2>Pro Tip: Block Your Linen Projects</h2>
                    <p>Linen pieces can look a bit crinkled or uneven right after crocheting. Spritzing the coaster with water or applying steam gently from a distance, then pinning it flat to dry (blocking) will smooth out the stitches and make your coaster look professionally crafted.</p>
                    <br/>
                    <p>Download the free <strong>[Summer Linen Flower Coaster]</strong> pattern in our marketplace now and dress up your summer coffee table!</p>
                    <br/>
                    <p>👉 <a href="/en/marketplace">Download Free Summer Linen Flower Coaster Pattern</a></p>
                `
        },
        'launch-announcement': {
            category: 'news',
            title: locale === 'ko' 
                ? 'byKnit 정식 오픈! 모눈종이 없는 디지털 뜨개질의 시작'
                : 'Official Launch of byKnit! The End of Graph Paper, The Start of Digital Knitting',
            date: '2026. 05. 21',
            imageUrl: '/blog/thumbnail-1.png',
            content: locale === 'ko'
                ? `
                    <p>안녕하세요! 뜨개인들의 필수 플랫폼, byKnit이 드디어 정식으로 런칭했습니다.</p>
                    <br/>
                    <p>그동안 모눈종이에 연필로 도안을 그리다가 지우개로 지우기를 반복하며 지치지 않으셨나요? 혹은 라벨리(Ravelry)에서 구매한 예쁜 영문 도안을 해석하느라 뜨개질보다 사전 찾는 시간이 더 길진 않으셨나요?</p>
                    <br/>
                    <p>이제 byKnit이 그 모든 번거로움을 해결해 드립니다.</p>
                    <br/>
                    <h2>byKnit에서 할 수 있는 세 가지 마법</h2>
                    <ul>
                        <li><strong>디지털 도안 에디터</strong>: 클릭 몇 번으로 대바늘/코바늘 기호를 입력하고 완벽한 도안을 만들어보세요.</li>
                        <li><strong>AI 차트 변환기</strong>: 원하는 사진을 업로드하면 AI가 배색 차트로 즉시 변환해 줍니다.</li>
                        <li><strong>스마트 계산기 & 번역기</strong>: 게이지 변환부터 복잡한 영문 약어(k2tog, ssk 등) 번역까지 한 번에!</li>
                    </ul>
                    <br/>
                    <p>지금 바로 회원가입하고 나만의 첫 디지털 도안을 만들어보세요!</p>
                `
                : `
                    <p>Hello! The essential platform for knitters, byKnit, has officially launched.</p>
                    <br/>
                    <p>Have you been tired of drawing patterns on graph paper with a pencil and erasing them over and over? Or have you spent more time looking up dictionaries than knitting to translate beautiful English patterns purchased from Ravelry?</p>
                    <br/>
                    <p>Now, byKnit solves all these hassles for you.</p>
                    <br/>
                    <h2>Three Magic Features on byKnit</h2>
                    <ul>
                        <li><strong>Digital Pattern Editor</strong>: Put knitting and crochet symbols with a few clicks to create the perfect chart.</li>
                        <li><strong>AI Chart Converter</strong>: Upload any image, and our AI instantly converts it into a colorwork knitting chart.</li>
                        <li><strong>Smart Calculator & Translator</strong>: Convert gauge easily and translate complex English abbreviations (k2tog, ssk, etc.) at once!</li>
                    </ul>
                    <br/>
                    <p>Sign up now and design your very first digital pattern!</p>
                `
        },
        'ai-translator-tips': {
            category: 'tip',
            title: locale === 'ko'
                ? '복잡한 k2tog, ssk? AI로 영문 도안 완벽하게 번역하는 꿀팁'
                : 'Struggling with k2tog and ssk? Tips to Perfectly Translate Knitting Patterns with AI',
            date: '2026. 05. 20',
            imageUrl: '/blog/thumbnail-2.png',
            content: locale === 'ko'
                ? `
                    <p>해외 니터들의 아름다운 패턴들! 막상 구매하고 나면 쏟아지는 영문 약어들에 머리가 아팠던 경험이 있으실 겁니다.</p>
                    <br/>
                    <p>k2tog, ssk, yo... 일반 번역기에 넣으면 'k2 함께', '미끄러짐 미끄러짐 뜨개질' 같은 이상한 말로 번역되곤 하죠. byKnit의 <strong>AI 도안 번역기</strong>는 다릅니다.</p>
                    <br/>
                    <h2>뜨개질 전용 인공지능</h2>
                    <p>byKnit의 AI는 전 세계의 뜨개질 약어를 학습했습니다. 단순히 단어를 바꾸는 것이 아니라 문맥을 파악합니다.</p>
                    <ul>
                        <li><strong>k2tog (Knit 2 together)</strong> → 오른코겹쳐뜨기(또는 두코모아뜨기)로 정확하게 해석합니다.</li>
                        <li><strong>ssk (Slip, slip, knit)</strong> → 왼코겹쳐뜨기(또는 덮어씌워모아뜨기)로 번역하여 코의 방향까지 고려합니다.</li>
                    </ul>
                    <br/>
                    <p>사용법도 아주 간단합니다. 번역기에 영문 텍스트를 복사해서 붙여넣기만 하세요. 지금 바로 상단의 '기능' 메뉴에서 확인해 보세요!</p>
                `
                : `
                    <p>Beautiful patterns from global creators! You might have had headaches with cascading English abbreviations after purchasing a pattern.</p>
                    <br/>
                    <p>k2tog, ssk, yo... Normal translators turn them into weird phrases like "k2 together" or "slip slip knit" word-for-word. byKnit's <strong>AI Pattern Translator</strong> is different.</p>
                    <br/>
                    <h2>Artificial Intelligence Tailored for Knitting</h2>
                    <p>byKnit's AI has learned knitting terms from around the world. It doesn't just translate words; it understands the context.</p>
                    <ul>
                        <li><strong>k2tog (Knit 2 together)</strong> → Correctly interprets the decrease direction and translates it properly.</li>
                        <li><strong>ssk (Slip, slip, knit)</strong> → Translates it considering the left-leaning decrease structure.</li>
                    </ul>
                    <br/>
                    <p>Usage is incredibly simple. Just copy and paste the English text into the translator. Check it out on the "AI Translator" page in the navigation menu!</p>
                `
        },
        'pet-colorwork': {
            category: 'tutorial',
            title: locale === 'ko'
                ? '내 반려동물 사진을 배색 차트로 바꾸는 마법 같은 방법'
                : "A Magical Way to Turn Your Pet's Photo Into a Knitting Colorwork Chart",
            date: '2026. 05. 18',
            imageUrl: '/blog/thumbnail-3.png',
            content: locale === 'ko'
                ? `
                    <p>사랑하는 우리 집 강아지, 고양이의 얼굴이 담긴 세상에 하나뿐인 스웨터나 쿠션을 떠보고 싶으신가요?</p>
                    <br/>
                    <p>예전에는 사진을 보고 일일이 모눈종이에 색을 칠해야 했지만, 이제 byKnit의 <strong>차트 변환기</strong>로 단 5초면 충분합니다.</p>
                    <br/>
                    <h2>사진을 배색 차트로 바꾸는 3단계</h2>
                    <ol>
                        <li><strong>업로드</strong>: 차트 변환기 메뉴에서 원하는 반려동물 사진을 업로드합니다. 가급적 배경이 깔끔하고 얼굴이 잘 보이는 사진이 좋습니다.</li>
                        <li><strong>옵션 설정</strong>: 원하는 작품의 크기(콧수와 단수)를 입력합니다. 초보자라면 색상 수를 3~5개로 제한하는 것을 추천합니다.</li>
                        <li><strong>변환 및 수정</strong>: 변환 버튼을 누르면 멋진 배색 차트가 생성됩니다! 이를 에디터로 넘겨서 디테일한 픽셀(코) 하나하나를 수정할 수 있습니다.</li>
                    </ol>
                    <br/>
                    <p>완성된 차트는 PDF로 다운로드해서 프린트하거나 태블릿에 띄워두고 뜨개질하시면 됩니다. 멋진 완성작을 커뮤니티에 꼭 자랑해 주세요!</p>
                `
                : `
                    <p>Want to knit a one-of-a-kind sweater or cushion with the face of your beloved dog or cat?</p>
                    <br/>
                    <p>In the past, you had to color graph paper block-by-block while looking at a photo. Now, byKnit's <strong>Chart Converter</strong> does it for you in just 5 seconds.</p>
                    <br/>
                    <h2>3 Steps to Convert Photo to Chart</h2>
                    <ol>
                        <li><strong>Upload</strong>: Upload your pet's photo on the Chart Converter page. A photo with a clean background and clear face works best.</li>
                        <li><strong>Set Options</strong>: Enter the dimensions (stitches and rows) for your project. If you are a beginner, we recommend limiting colors to 3–5.</li>
                        <li><strong>Convert & Edit</strong>: Click convert, and a beautiful colorwork chart is generated! You can load it into the editor to tweak individual stitches.</li>
                    </ol>
                    <br/>
                    <p>Once converted, download it as a PDF to print or display on your tablet while knitting. Don't forget to share your finished project in our community!</p>
                `
        },
        'summer-yarn-guide': {
            category: 'tip',
            title: locale === 'ko'
                ? '여름 뜨개실의 모든 것: 린넨, 라피아, 코튼 비교 가이드'
                : 'All About Summer Yarn: Comparing Linen, Raffia, and Cotton',
            date: '2026. 07. 01',
            imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop',
            content: locale === 'ko'
                ? `
                    <p>뜨거운 태양이 내리쬐는 여름, 뜨개질은 겨울의 전유물이라는 생각은 오산입니다! 적절한 소재를 선택한다면 여름철에도 시원하고 세련된 니트 의류와 다양한 인테리어 소품을 뜰 수 있습니다.</p>
                    <br/>
                    <p>여름 뜨개질에 사용되는 가장 대표적인 3대 소재인 <strong>린넨(Linen)</strong>, <strong>라피아(Raffia)</strong>, 그리고 <strong>코튼(Cotton)</strong> 실의 특징과 관리 및 세탁법을 한눈에 알아봅시다.</p>
                    <br/>
                    <h2>1. 시원함과 찰랑거림의 대명사, 린넨(Linen)</h2>
                    <p>아마(Flax) 섬유로 만들어지는 린넨은 열전도율이 높고 흡수성이 뛰어나 여름 의류에 가장 이상적인 소재입니다.</p>
                    <ul>
                        <li><strong>특징</strong>: 뜰 때는 다소 뻣뻣하고 거칠게 느껴질 수 있으나, 세탁을 거치면서 특유의 부드러움과 찰랑거리는 실루엣이 나타납니다.</li>
                        <li><strong>추천 도안</strong>: 민소매 여름 니트, 가벼운 가디건, 여름용 숄</li>
                        <li><strong>세탁 팁</strong>: 미지근한 물에 중성세제(울샴푸)를 사용해 가볍게 손세탁하세요. 블로킹 보드에 핀을 꽂아 건조하면 편물의 기하학적 무늬가 아름답게 살아납니다.</li>
                    </ul>
                    <br/>
                    <h2>2. 내츄럴한 여름 햇과 백의 완성, 라피아(Raffia)</h2>
                    <p>라피아 야자 잎에서 추출한 천연 섬유로, 시중에는 주로 물에 젖지 않는 종이실(Paper Yarn) 형태로 판매되고 있습니다.</p>
                    <ul>
                        <li><strong>특징</strong>: 매우 가볍고 편물이 탄탄하게 형태를 유지합니다. 통기성이 뛰어나 햇빛을 가려주는 모자나 탄탄한 가방에 제격입니다.</li>
                        <li><strong>추천 도안</strong>: 라피아 햇, 여름용 바스켓, 네츄럴 와이어 모자</li>
                        <li><strong>세탁 팁</strong>: 가급적 물세탁은 피하는 것이 좋습니다. 오염 부위는 젖은 타월로 가볍게 닦아내고, 모자가 찌그러진 경우 스팀다리미를 살짝 띄운 채 스팀을 주어 모양을 잡아주면 복원됩니다.</li>
                    </ul>
                    <br/>
                    <h2>3. 부드럽고 실용적인 만능 실, 코튼(Cotton)</h2>
                    <p>면화에서 얻은 천연 섬유로, 초보자부터 숙련자까지 사계절 내내 사랑받는 실입니다.</p>
                    <ul>
                        <li><strong>특징</strong>: 땀 흡수가 잘 되며 피부 자극이 거의 없어 매우 위생적이고 실용적입니다. 탄성이 적어 코 구멍이 정갈하고 또렷하게 나옵니다.</li>
                        <li><strong>추천 도안</strong>: 네트백, 팟홀더(냄비받침), 에어팟/소품 케이스, 티코스터</li>
                        <li><strong>세탁 팁</strong>: 물세탁에 가장 강한 소재입니다. 형태 보존을 위해 그늘에서 편평하게 뉘어서 건조하는 것을 추천합니다.</li>
                    </ul>
                `
                : `
                    <p>Knitting is not just for winter! Selecting the right materials allows you to create cool, fashionable knitwear and lovely accessories during the hot summer months.</p>
                    <br/>
                    <p>Let's explore the characteristics, recommended projects, and care tips for the top 3 summer yarns: <strong>Linen</strong>, <strong>Raffia</strong>, and <strong>Cotton</strong>.</p>
                    <br/>
                    <h2>1. Linen: Cool & Elegant Drape</h2>
                    <p>Made from the flax plant, linen is highly breathable and has excellent moisture absorption, making it ideal for summer garments.</p>
                    <ul>
                        <li><strong>Features</strong>: It can feel slightly stiff while knitting, but grows remarkably soft and drapey after washing.</li>
                        <li><strong>Best Projects</strong>: Summer sleeveless tops, light cardigans, airy shawls.</li>
                        <li><strong>Care Tip</strong>: Hand wash gently in lukewarm water using mild detergent. Blocking is key to opening up the beautiful lace texture.</li>
                    </ul>
                    <br/>
                    <h2>2. Raffia: Ideal for Sun Hats & Sturdy Bags</h2>
                    <p>Harvested from raffia palm leaves, most raffia yarns in the craft market are durable paper yarns designed for easy shaping.</p>
                    <ul>
                        <li><strong>Features</strong>: Light, breathable, and keeps structure well. Perfect for sun blocking items.</li>
                        <li><strong>Best Projects</strong>: Raffia bucket hats, straw bags, storage baskets.</li>
                        <li><strong>Care Tip</strong>: Avoid soaking in water. Wipe dirt gently with a damp cloth, and use steam from an iron to reshape it when distorted.</li>
                    </ul>
                    <br/>
                    <h2>3. Cotton: Soft, Durable & Versatile</h2>
                    <p>Soft natural fiber loved by knitters of all skill levels throughout the year.</p>
                    <ul>
                        <li><strong>Features</strong>: Highly absorbent, machine-washable, and defines stitches clearly due to low elasticity.</li>
                        <li><strong>Best Projects</strong>: Net bags, pot holders, AirPod sleeves, coasters.</li>
                        <li><strong>Care Tip</strong>: Highly washable. Dry flat in the shade to maintain shape and prevent stretching.</li>
                    </ul>
                `
        },
        'knitting-symbols-guide': {
            category: 'tutorial',
            title: locale === 'ko'
                ? '초보 니터를 위한 대바늘 기호 완벽 가이드: 겉뜨기부터 되돌아뜨기까지'
                : 'A Complete Guide to Knitting Symbols for Beginners: From Knit to Short Rows',
            date: '2026. 06. 30',
            imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop',
            content: locale === 'ko'
                ? `
                    <p>뜨개질 차트를 처음 펼쳤을 때 마주하는 낯선 기호들 때문에 뜨개질을 시작하기도 전에 포기하신 적이 있으신가요? 차트 속 기호는 뜨개의 국룰이자 만국공통어입니다.</p>
                    <br/>
                    <p>기본적인 대바늘 차트 기호의 의미와 약어를 차근차근 정리하여, 혼자서도 도안을 읽을 수 있도록 도와드리겠습니다.</p>
                    <br/>
                    <h2>1. 가장 기초가 되는 기본코</h2>
                    <ul>
                        <li><strong>| 또는 빈 칸 (겉뜨기 / Knit)</strong>: 도안의 앞면(겉면)을 보며 뜰 때는 바늘을 뒤에서 앞으로 찔러 겉뜨기를 뜹니다. 영문 약어로는 <strong>K</strong>로 표기합니다.</li>
                        <li><strong>- 또는 가로줄 (안뜨기 / Purl)</strong>: 바늘을 앞에서 뒤로 찔러 안뜨기를 뜹니다. 영문 약어로는 <strong>P</strong>로 표기합니다.</li>
                    </ul>
                    <br/>
                    <h2>2. 코를 늘리고 줄이는 기호 (Shaping)</h2>
                    <ul>
                        <li><strong>O (바늘비우기 / Yarn Over)</strong>: 바늘에 실을 한 바퀴 감아 의도적으로 구멍 무늬를 만들고 코를 1코 늘려줍니다. 영문 약어로는 <strong>YO</strong>로 씁니다.</li>
                        <li><strong>오른쪽 사선 (두 코 모아뜨기 / Knit 2 Together)</strong>: 오른쪽으로 기울어지는 코줄임 기법으로, 다음 2코를 한 번에 겉뜨기합니다. 영문 약어로는 <strong>k2tog</strong>입니다.</li>
                        <li><strong>왼쪽 사선 (왼코 겹치기 / Slip, Slip, Knit)</strong>: 왼쪽으로 기울어지는 코줄임 기법으로, 2코를 차례대로 겉뜨기 방향으로 미끄러뜨린 뒤 한 번에 겉뜨기합니다. 영문 약어로는 <strong>ssk</strong>입니다.</li>
                    </ul>
                    <br/>
                    <h2>3. 고급 편물 성형 기법</h2>
                    <ul>
                        <li><strong>되돌아뜨기 (German Short Rows)</strong>: 편물의 특정 부위에 입체감(예: 어깨선, 옷깃)을 주기 위해 끝까지 뜨지 않고 중간에 편물을 뒤집어 되돌아 뜨는 고난도 기법입니다. 이때 뒤집은 첫 코를 뒤로 세게 당겨 겹코(Double stitch)로 만드는 것이 실 마찰에 의한 구멍을 방지하는 포인트입니다.</li>
                    </ul>
                    <br/>
                    <p>byKnit의 **AI 번역기**와 **스마트 에디터**를 활용하시면 까다로운 기호도 실시간으로 해석하고 도안을 직관적으로 확인하실 수 있습니다. 도안에 당당히 마주해 보세요!</p>
                `
                : `
                    <p>Do charts with weird symbols look like hieroglyphics when you start a new knitting project? Understanding these symbols is like learning the universal language of knitters.</p>
                    <br/>
                    <p>Let's demystify the most common knitting symbols and abbreviations step-by-step so you can read patterns with confidence.</p>
                    <br/>
                    <h2>1. The Foundation: Knit and Purl</h2>
                    <ul>
                        <li><strong>| or blank square (Knit)</strong>: Insert needle from front to back, wrap yarn, and pull through. Abbreviated as <strong>K</strong>.</li>
                        <li><strong>- or horizontal dash (Purl)</strong>: Insert needle from back to front, wrap yarn, and pull through. Abbreviated as <strong>P</strong>.</li>
                    </ul>
                    <br/>
                    <h2>2. Basic Increases & Decreases</h2>
                    <ul>
                        <li><strong>O (Yarn Over)</strong>: Wrap the yarn over the right needle without knitting. Creates a decorative eyelet hole and adds a stitch. Abbreviated as <strong>YO</strong>.</li>
                        <li><strong>Right-leaning slash (Knit 2 Together)</strong>: Insert needle through 2 stitches at once and knit them together. Abbreviated as <strong>k2tog</strong>.</li>
                        <li><strong>Left-leaning slash (Slip, Slip, Knit)</strong>: Slip 2 stitches knit-wise, insert left needle into the front of these 2 stitches, and knit them together. Abbreviated as <strong>ssk</strong>.</li>
                    </ul>
                    <br/>
                    <h2>3. Intermediate Shaping</h2>
                    <ul>
                        <li><strong>Short Rows (German Short Rows)</strong>: Turning your work in the middle of a row before reaching the end to add height or depth (e.g. shoulders, collars). Pulling the working yarn over the needle creates a "double stitch" to prevent holes.</li>
                    </ul>
                    <br/>
                    <p>Use byKnit's **AI Translator** and **Smart Editor** to automatically interpret symbols and translate charts on-the-fly! Happy knitting!</p>
                `
        }
    };
    return posts[slug] || null;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug, resolvedParams.locale);

    if (!post) {
        return {
            title: resolvedParams.locale === 'ko' ? '게시글 없음 - byKnit' : 'Post Not Found - byKnit'
        };
    }

    const plainTextDesc = post.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

    return {
        title: `${post.title} | byKnit Blog`,
        description: plainTextDesc,
        openGraph: {
            title: post.title,
            description: plainTextDesc,
            url: `https://byknit.com/${resolvedParams.locale}/blog/${resolvedParams.slug}`,
            images: [
                {
                    url: `https://byknit.com${post.imageUrl}`,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: plainTextDesc,
            images: [`https://byknit.com${post.imageUrl}`],
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const resolvedParams = await params;
    const locale = resolvedParams.locale;
    const post = getPostData(resolvedParams.slug, locale);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <p className="text-2xl text-brown-600">
                    {locale === 'ko' ? '게시글을 찾을 수 없습니다.' : 'Post not found.'}
                </p>
            </div>
        );
    }

    // Category localization map
    const categoryLabels: Record<string, string> = {
        news: locale === 'ko' ? '소식' : 'NEWS',
        tip: locale === 'ko' ? '꿀팁' : 'TIPS',
        tutorial: locale === 'ko' ? '튜토리얼' : 'TUTORIAL'
    };

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-soft-xl overflow-hidden border border-tan-100">
                {/* Header Image */}
                <div className="w-full h-64 md:h-96 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="p-8 md:p-12">
                    <Link href={`/${locale}/blog`} className="inline-flex items-center text-brown-500 hover:text-rose-500 transition-colors mb-6 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {locale === 'ko' ? '목록으로 돌아가기' : 'Back to List'}
                    </Link>

                    <div className="mb-8">
                        <span className="px-3 py-1 bg-rose-100 text-rose-500 text-xs font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
                            {categoryLabels[post.category] || post.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-brown-800 mb-4 leading-tight">{post.title}</h1>
                        <p className="text-brown-400">{post.date}</p>
                    </div>

                    <hr className="border-tan-200 mb-8" />

                    {/* Content */}
                    <div 
                        className="prose prose-lg prose-brown max-w-none 
                        prose-headings:text-brown-800 prose-headings:font-bold
                        prose-p:text-brown-600 prose-p:leading-relaxed
                        prose-a:text-rose-500 hover:prose-a:text-rose-600
                        prose-li:text-brown-600
                        prose-strong:text-brown-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>
            </div>
        </div>
    );
}
