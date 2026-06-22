const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\CHA\\.gemini\\antigravity\\brain\\4884a311-2362-418a-8055-d6b74f2f9be3\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.step_index === 1346) {
            console.log("=== STEP 1346 ===");
            console.log(obj.content);
            break;
        }
    } catch (e) {
        // ignore JSON parse errors
    }
}
