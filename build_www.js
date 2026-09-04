const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Create destDir if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = [
    'index.html',
    'login.html',
    'receipt.html',
    'customer.html',
    'app.js',
    'db.js',
    'style.css',
    'firebase-config.js'
];

// Copy files
filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to www/`);
    } else {
        console.warn(`File ${file} not found!`);
    }
});

// Copy lib directory contents
const libSrc = path.join(srcDir, 'lib');
const libDest = path.join(destDir, 'lib');
if (fs.existsSync(libSrc)) {
    if (!fs.existsSync(libDest)) {
        fs.mkdirSync(libDest, { recursive: true });
    }
    const libFiles = fs.readdirSync(libSrc);
    libFiles.forEach(file => {
        fs.copyFileSync(path.join(libSrc, file), path.join(libDest, file));
        console.log(`Copied lib/${file} to www/lib/`);
    });
}

console.log('Build to www/ complete.');
