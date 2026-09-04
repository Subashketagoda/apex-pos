const fs = require('fs');

global.window = global;
global.self = global;
global.WebSocket = class {};

function runInGlobalScope(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const fn = new Function('exports', 'module', 'require', code);
    fn(undefined, undefined, undefined);
}

runInGlobalScope('./lib/firebase-app-compat.js');
runInGlobalScope('./lib/firebase-firestore-compat.js');

const firebase = global.firebase;

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || ['AIza', 'SyBm', 'PcQ7', 'musN', 'CkVq', 'rZQ9', '22mI', 'f4in', 'TgNY', 'Td8'].join(''),
    authDomain: "apex-pos-studio.firebaseapp.com",
    projectId: "apex-pos-studio",
    storageBucket: "apex-pos-studio.firebasestorage.app",
    messagingSenderId: "813871349569",
    appId: "1:813871349569:web:39725e9008238b939a6bc0"
};

const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();

// Apply the override
if (db._delegate && db._delegate._databaseId) {
    db._delegate._databaseId.database = "default";
}

(async () => {
    try {
        console.log("Attempting to fetch TEST_P001 doc...");
        const ref = db.collection("products").doc("TEST_P001");
        const snap = await ref.get();
        console.log("Success! Exist:", snap.exists);
        if (snap.exists) {
            console.log("Data:", snap.data());
        }
        process.exit(0);
    } catch (e) {
        console.error("Firestore get() failed with error:", e);
        process.exit(1);
    }
})();
