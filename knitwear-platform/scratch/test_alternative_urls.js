const https = require('https');

const ids = [
    'photo-1515562141207-7a88fb7ce338',
    'photo-1583847268964-b28dc8f51f92',
    'photo-1608748010899-18f300247112',
    'photo-1544816155-12df9643f363'
];

ids.forEach(id => {
    const url = `https://images.unsplash.com/${id}?w=600&auto=format&fit=crop`;
    https.get(url, (res) => {
        console.log(`ID: ${id} | Status Code: ${res.statusCode}`);
    }).on('error', (e) => {
        console.error(`Error for ${id}:`, e);
    });
});
