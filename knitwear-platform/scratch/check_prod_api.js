const axios = require('axios');

async function check() {
    const url = 'https://by-knit.com/ko/debug-page';
    console.log(`Fetching debug page from ${url} ...`);
    
    try {
        const res = await axios.get(url, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const html = res.data;
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        
        if (match && match[1]) {
            // HTML entity decode basic characters if necessary
            let jsonText = match[1]
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            
            try {
                const parsed = JSON.parse(jsonText);
                console.log('Production Diagnostics Result:\n', JSON.stringify(parsed, null, 2));
            } catch (jsonErr) {
                console.log('Extracted raw text (failed to parse as JSON):', jsonText);
            }
        } else {
            console.log('Could not find pre tag in response. Response preview:', html.substring(0, 500));
        }
    } catch (e) {
        console.error('Error fetching debug page:', e.message);
        if (e.response) {
            console.error('Response Status:', e.response.status);
        }
    }
}

check();
