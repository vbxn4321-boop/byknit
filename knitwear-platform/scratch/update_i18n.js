const fs = require('fs');

const pathKo = 'src/i18n/messages/ko.json';
const pathEn = 'src/i18n/messages/en.json';

const fabricToPatternKo = {
    title: "서술형 도안 변환기",
    description: "편물 접사 사진을 업로드하면 조직을 분석하여 서술형(줄글) 뜨개 도안으로 변환해줍니다",
    uploadPrompt: "편물 조직 접사 사진을 올려주세요",
    metaSettings: "메타데이터 설정",
    craftType: "뜨개 종류",
    knitting: "대바늘",
    crochet: "코바늘",
    needleSize: "바늘 사이즈",
    needlePlaceholder: "예: 대바늘 4.5mm 또는 모사용 코바늘 5/0호",
    yarnWeight: "사용 실 종류 (선택)",
    yarnPlaceholder: "예: 린넨사, 울 혼방 20수 등",
    analyze: "직물 분석 시작",
    analyzing: "직물 패턴 분석 중...",
    previewTitle: "도안 미리보기 (맛보기)",
    previewDesc: "AI가 진단한 조직 형태와 가이드를 확인해 보세요. 아래 도안을 소장하려면 크레딧으로 잠금해제해야 합니다.",
    detectedStitch: "진단된 조직",
    recNeedles: "권장 바늘",
    recYarn: "권장 실",
    unlockBtn: "{credits} 크레딧으로 전체 도안 해제하기",
    unlockedTitle: "서술형 도안 전체 공개",
    downloadPDF: "PDF 도안 다운로드",
    copyClipboard: "클립보드에 복사",
    copied: "클립보드에 복사되었습니다!",
    insufficientCredits: "보유 크레딧이 부족합니다. 결제 페이지에서 충전 후 이용해 주세요.",
    alreadyUnlocked: "이미 잠금해제된 도안입니다. 언제든 무료로 다운로드하실 수 있습니다.",
    backToSelect: "목록으로 돌아가기",
    selectBranchTitle: "바이니트 AI 도구 선택",
    selectBranchDesc: "원하시는 AI 도안 변환 방식을 선택해 주세요.",
    cardChartTitle: "격자 배색 차트 변환",
    cardChartDesc: "사진을 모눈종이 형태의 배색 도안으로 변환하고 격자 에디터에서 바로 편집할 수 있습니다.",
    cardWrittenTitle: "서술형 줄글 도안 변환",
    cardWrittenDesc: "실물 편물 사진을 분석하여 단수별/코수별로 쓰여진 상세 서술형 뜨개 도안을 생성합니다."
};

const fabricToPatternEn = {
    title: "Written Pattern Converter",
    description: "Upload a close-up photo of fabric to analyze its stitch structure and generate a step-by-step written pattern.",
    uploadPrompt: "Upload close-up fabric photo",
    metaSettings: "Metadata Settings",
    craftType: "Craft Type",
    knitting: "Knitting",
    crochet: "Crochet",
    needleSize: "Needle/Hook Size",
    needlePlaceholder: "e.g., 4.5mm needles or 3.0mm crochet hook",
    yarnWeight: "Yarn Type (Optional)",
    yarnPlaceholder: "e.g., Linen yarn, Worsted wool, etc.",
    analyze: "Analyze Fabric",
    analyzing: "Analyzing Stitch Texture...",
    previewTitle: "Pattern Preview (Snippet)",
    previewDesc: "Check the diagnosed stitch pattern and recommendations below. Unlock the full pattern to save and download.",
    detectedStitch: "Detected Stitch",
    recNeedles: "Recommended Needles",
    recYarn: "Recommended Yarn",
    unlockBtn: "Unlock Full Pattern for {credits} Credits",
    unlockedTitle: "Full Written Pattern",
    downloadPDF: "Download PDF Pattern",
    copyClipboard: "Copy to Clipboard",
    copied: "Copied to clipboard!",
    insufficientCredits: "Insufficient credits. Please top up on the credits page first.",
    alreadyUnlocked: "Already unlocked! You can view and download this pattern anytime.",
    backToSelect: "Back to Tool Selection",
    selectBranchTitle: "byKnit AI Tool Selection",
    selectBranchDesc: "Select the conversion method you want to use.",
    cardChartTitle: "Grid Colorwork Chart",
    cardChartDesc: "Convert photos to a grid-based colorwork chart and edit directly in the pattern editor.",
    cardWrittenTitle: "Written Pattern Recipe",
    cardWrittenDesc: "Analyze the fabric stitch texture from a photo and generate row-by-row written instructions."
};

// Update KO
const ko = JSON.parse(fs.readFileSync(pathKo, 'utf8'));
ko.ai.fabricToPattern = fabricToPatternKo;
fs.writeFileSync(pathKo, JSON.stringify(ko, null, 2), 'utf8');
console.log('Successfully updated ko.json');

// Update EN
const en = JSON.parse(fs.readFileSync(pathEn, 'utf8'));
en.ai.fabricToPattern = fabricToPatternEn;
fs.writeFileSync(pathEn, JSON.stringify(en, null, 2), 'utf8');
console.log('Successfully updated en.json');
