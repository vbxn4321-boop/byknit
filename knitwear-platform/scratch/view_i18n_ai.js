const fs = require('fs');

const ko = JSON.parse(fs.readFileSync('src/i18n/messages/ko.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/messages/en.json', 'utf8'));

console.log('=== KO AI NAMESPACE ===');
console.log(JSON.stringify(ko.ai, null, 2));

console.log('\n=== EN AI NAMESPACE ===');
console.log(JSON.stringify(en.ai, null, 2));
