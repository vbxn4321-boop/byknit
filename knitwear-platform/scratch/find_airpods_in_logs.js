const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\CHA\\.gemini\\antigravity\\brain\\e6060ca7-187f-409c-8981-00d7f5bcbdcc\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath);
    process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log(`Searching for keyword matches...`);
let found = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('에어팟') || line.includes('AirPods') || line.includes('airpods') || line.includes('케이스')) {
        console.log(`--- Match at line ${i} ---`);
        try {
            const parsed = JSON.parse(line);
            console.log(`Type: ${parsed.type} | Source: ${parsed.source}`);
            // Check content or tool_calls
            if (parsed.content) {
                console.log(`Content snippet: ${parsed.content.substring(0, 500)}`);
            }
            if (parsed.tool_calls) {
                console.log(`Tool calls:`, JSON.stringify(parsed.tool_calls, null, 2).substring(0, 500));
            }
        } catch (e) {
            console.log(`Raw line snippet: ${line.substring(0, 500)}`);
        }
        found++;
        if (found > 30) {
            console.log('Too many matches, stopping.');
            break;
        }
    }
}
