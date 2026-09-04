const fs = require('fs');
const path = require('path');
const https = require('https');

const libDir = path.join(__dirname, 'lib');
if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir);
}

const urls = {
    'firebase-app-compat.js': 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js',
    'firebase-auth-compat.js': 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth-compat.js',
    'firebase-firestore-compat.js': 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore-compat.js',
    'lucide.min.js': 'https://unpkg.com/lucide@0.428.0/dist/umd/lucide.min.js',
    'chart.umd.js': 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js'
};

function download(filename, url) {
    const dest = path.join(libDir, filename);
    const file = fs.createWriteStream(dest);
    
    console.log(`Downloading ${url} to ${dest}...`);
    
    https.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
            // Handle redirect
            download(filename, response.headers.location);
            return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
            file.close();
            console.log(`Successfully downloaded ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => {});
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
}

Object.entries(urls).forEach(([filename, url]) => {
    download(filename, url);
});
