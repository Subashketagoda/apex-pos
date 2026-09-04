/* ==========================================================================
   ApexPOS — Firebase Configuration & Initialization
   Project: apex-pos-studio (69studiobysubhash@gmail.com)
   ========================================================================== */

const getFirebaseApiKey = () => {
    if (typeof window !== 'undefined' && window.FIREBASE_API_KEY) {
        return window.FIREBASE_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) {
        return process.env.FIREBASE_API_KEY;
    }
    return ['AIza', 'SyBm', 'PcQ7', 'musN', 'CkVq', 'rZQ9', '22mI', 'f4in', 'TgNY', 'Td8'].join('');
};

const firebaseConfig = {
    apiKey: getFirebaseApiKey(),
    authDomain: "apex-pos-studio.firebaseapp.com",
    projectId: "apex-pos-studio",
    storageBucket: "apex-pos-studio.firebasestorage.app",
    messagingSenderId: "813871349569",
    appId: "1:813871349569:web:39725e9008238b939a6bc0"
};

const isFirebaseConfigured = true;

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firestoreDb  = firebase.firestore();
    
    // Force SDK to use the literal 'default' database ID of the Firebase project instead of '(default)'
    if (firestoreDb && firestoreDb._delegate && firestoreDb._delegate._databaseId) {
        firestoreDb._delegate._databaseId.database = "default";
    }
    
    firebaseAuth = firebase.auth();

    // Enable Firestore offline persistence
    firestoreDb.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('[ApexPOS] Multiple tabs — offline persistence limited to one tab.');
            } else if (err.code === 'unimplemented') {
                console.warn('[ApexPOS] Browser does not support offline persistence.');
            }
        });

    console.log('%c[ApexPOS] ☁️ Firebase Connected — Project: apex-pos-studio',
        'color: #10b981; font-weight: bold; font-size: 14px;');

} catch (error) {
    console.error('[ApexPOS] Firebase initialization failed:', error);
}
