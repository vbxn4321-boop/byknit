import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// In a real application, this would come from a CMS or a database.
const getPostData = (slug: string) => {
    const posts: Record<string, any> = {
        'launch-announcement': {
            category: 'news',
            title: 'byKnit 정식 오픈! 모눈종이 없는 디지털 뜨개질의 시작',
            date: '2026. 05. 21',
            imageUrl: '/blog/thumbnail-1.png',
            content: `
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
        },
        'ai-translator-tips': {
            category: 'tip',
            title: '복잡한 k2tog, ssk? AI로 영문 도안 완벽하게 번역하는 꿀팁',
            date: '2026. 05. 20',
            imageUrl: '/blog/thumbnail-2.png',
            content: `
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
                <p>사용법도 아주 간단합니다. 번역기에 영문 텍스트를 복사해서 붙여넣기만 하세요. 지금 바로 상단의 '튜토리얼' 메뉴에서 확인해 보세요!</p>
            `
        },
        'pet-colorwork': {
            category: 'tutorial',
            title: '내 반려동물 사진을 배색 차트로 바꾸는 마법 같은 방법',
            date: '2026. 05. 18',
            imageUrl: '/blog/thumbnail-3.png',
            content: `
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
        }
    };
    return posts[slug] || null;
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    // In Next.js 15+, params is a Promise that must be awaited
    const resolvedParams = await params;
    const post = getPostData(resolvedParams.slug);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <p className="text-2xl text-brown-600">게시글을 찾을 수 없습니다.</p>
            </div>
        );
    }

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
                    <Link href={`/${resolvedParams.locale}/blog`} className="inline-flex items-center text-brown-500 hover:text-rose-500 transition-colors mb-6 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        목록으로 돌아가기
                    </Link>

                    <div className="mb-8">
                        <span className="px-3 py-1 bg-rose-100 text-rose-500 text-sm font-bold rounded-full uppercase tracking-wider mb-4 inline-block">
                            {post.category === 'news' ? '소식' : post.category === 'tip' ? '꿀팁' : '튜토리얼'}
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
