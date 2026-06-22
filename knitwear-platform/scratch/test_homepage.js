const axios = require('axios');

async function test() {
    const urls = [
        'https://by-knit.com/',
        'https://by-knit.com/ko',
        'https://by-knit.com/en',
        'https://by-knit.com/login',
        'https://by-knit.com/ko/login'
    ];

    for (const url of urls) {
        console.log(`Fetching ${url} ...`);
        try {
            const res = await axios.get(url, {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                maxRedirects: 5
            });
            console.log(`SUCCESS: ${url} | Status: ${res.status}`);
        } catch (e) {
            console.error(`FAILED: ${url} | Error: ${e.message}`);
            if (e.response) {
                console.error(`Response status: ${e.response.status}`);
            }
        }
        console.log('--------------------');
    }
}

test();
