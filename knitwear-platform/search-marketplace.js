const fs = require('fs');
const path = require('path');

function searchFiles(dir, regex) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(searchFiles(fullPath, regex));
    } else if (file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (regex.test(content)) {
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (regex.test(line)) {
            results.push(`${fullPath}:${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
  return results;
}

const res = searchFiles(path.join(__dirname, 'src'), /마켓플레이스/);
console.log(res.join('\n'));
