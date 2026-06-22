const fs = require('fs');
const path = 'src/app/actions/community.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/revalidatePath\('\/\[locale\]\/community', 'page'\);/g, "revalidatePath('/', 'layout');");

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
