const fs = require('fs');

// AIClient.tsx Fix
const aiPath = 'C:\\\\Users\\\\CHA\\\\Desktop\\\\knitwear-platform\\\\knitwear-platform\\\\src\\\\components\\\\ai\\\\AIClient.tsx';
let aiContent = fs.readFileSync(aiPath, 'utf8');

const wrapperRegex = /\{\!user \? \(\s*<div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-white border border-tan-200 shadow-soft text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">[\s\S]*?<\/div>\s*\) : \(\s*<ImageToChartTab locale=\{locale\} credits=\{credits\} user=\{user\} \/>\s*\)\}/g;
aiContent = aiContent.replace(wrapperRegex, '<ImageToChartTab locale={locale} credits={credits} user={user} />');

const importCheck = `const handleEditorImport = async () => {
        if (!user) {
            alert(locale === 'ko' ? '로그인이 필요한 기능입니다.' : 'Login required.');
            router.push(\`/\${locale}/login\`);
            return;
        }`;
aiContent = aiContent.replace(/const handleEditorImport = async \(\) => \{/g, importCheck);

const exportCheck = `const handleExport = async () => {
        if (!user) {
            alert(locale === 'ko' ? '로그인이 필요한 기능입니다.' : 'Login required.');
            router.push(\`/\${locale}/login\`);
            return;
        }`;
aiContent = aiContent.replace(/const handleExport = async \(\) => \{/g, exportCheck);

fs.writeFileSync(aiPath, aiContent, 'utf8');
console.log('Fixed AIClient.tsx');
