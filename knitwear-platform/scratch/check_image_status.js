const https = require('https');

const urls = [
    'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584992236310-6edddc085ffb?w=600&auto=format&fit=crop'
];

urls.forEach(url => {
    https.get(url, (res) => {
        console.log(`URL: ${url} | Status Code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Error for ${url}:`, e);
    });
});
