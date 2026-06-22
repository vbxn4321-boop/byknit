const fs = require('fs');

const logPath = 'C:\\Users\\CHA\\.gemini\\antigravity\\brain\\4884a311-2362-418a-8055-d6b74f2f9be3\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

console.log("=== TODAY USER REQUESTS ===");
for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.created_at && obj.created_at.startsWith('2026-06-15')) {
            if (obj.type === 'USER_INPUT') {
                console.log(`[USER] index: ${obj.step_index} | content: ${obj.content.replace(/<USER_REQUEST>\n|\n<\/USER_REQUEST>/g, '')}`);
            }
        }
    } catch (e) {}
}
