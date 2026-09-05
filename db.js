/* ==========================================================================
   ApexPOS — Cloud Database Abstraction Layer (db.js)
   
   Wraps Firestore operations with localStorage fallback.
   If Firebase is not configured, all operations silently use localStorage.
   ========================================================================== */

const db = {

    // ====================================================================
    // Status helpers
    // ====================================================================
    
    /** Returns true if Firestore is available and enabled on this device */
    isCloud() {
        const mode = localStorage.getItem('apexpos_db_mode') || 'cloud';
        return mode === 'cloud' && isFirebaseConfigured && firestoreDb !== null;
    },

    // ====================================================================
    // LOAD — Read all collections from Firestore (or localStorage fallback)
    // ====================================================================

    /**
     * Loads all data from Firestore into the app state variables and sets up real-time sync listeners.
     */
    async init(onSyncUpdate) {
        if (!this.isCloud()) {
            // Fallback: load from localStorage (original behavior)
            this._loadFromLocalStorage();
            return;
        }

        try {
            // Active cart stays in localStorage for speed
            cart = JSON.parse(localStorage.getItem("apex_pos_active_cart")) || [];

            // Setup real-time listener for Products
            firestoreDb.collection('products').onSnapshot(async snap => {
                if (!snap.empty) {
                    products = snap.docs.map(doc => doc.data());
                    localStorage.setItem("apex_pos_products", JSON.stringify(products));
                    if (onSyncUpdate) onSyncUpdate('products');
                } else {
                    // Seed defaults
                    products = [...DEFAULT_PRODUCTS];
                    localStorage.setItem("apex_pos_products", JSON.stringify(products));
                    await this.saveProducts(products);
                    if (onSyncUpdate) onSyncUpdate('products');
                }
            }, err => console.error('[db] Products sync error:', err));

            // Setup real-time listener for Transactions
            firestoreDb.collection('transactions').orderBy('timestamp', 'desc').onSnapshot(snap => {
                const cloudTxns = snap.docs.map(doc => doc.data());
                const localTxns = JSON.parse(localStorage.getItem("apex_pos_transactions")) || [];
                const txnMap = new Map();
                localTxns.forEach(t => txnMap.set(t.id, t));
                cloudTxns.forEach(t => txnMap.set(t.id, t));
                transactions = Array.from(txnMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
                if (onSyncUpdate) onSyncUpdate('transactions');
            }, err => console.error('[db] Transactions sync error:', err));

            // Setup real-time listener for Z-Reports
            firestoreDb.collection('zReports').onSnapshot(snap => {
                const cloudZ = snap.docs.map(doc => doc.data());
                const localZ = JSON.parse(localStorage.getItem("apex_pos_zreports")) || [];
                const zMap = new Map();
                localZ.forEach(z => zMap.set(z.id, z));
                cloudZ.forEach(z => zMap.set(z.id, z));
                zReports = Array.from(zMap.values());
                localStorage.setItem("apex_pos_zreports", JSON.stringify(zReports));
                if (onSyncUpdate) onSyncUpdate('zReports');
            }, err => console.error('[db] Z-Reports sync error:', err));

            // Setup real-time listener for Settings
            firestoreDb.collection('config').doc('settings').onSnapshot(async doc => {
                if (doc.exists) {
                    settings = doc.data();
                    localStorage.setItem("apex_pos_settings", JSON.stringify(settings));
                    if (onSyncUpdate) onSyncUpdate('settings');
                } else {
                    settings = { ...DEFAULT_SETTINGS };
                    localStorage.setItem("apex_pos_settings", JSON.stringify(settings));
                    await this.saveSettings(settings);
                    if (onSyncUpdate) onSyncUpdate('settings');
                }
            }, err => console.error('[db] Settings sync error:', err));

            // Setup real-time listener for Held Carts
            firestoreDb.collection('heldCarts').onSnapshot(snap => {
                const cloudCarts = snap.docs.map(doc => doc.data());
                const localCarts = JSON.parse(localStorage.getItem("apex_pos_held_carts")) || [];
                const mergedMap = new Map();
                localCarts.forEach(c => mergedMap.set(c.id, c));
                cloudCarts.forEach(c => mergedMap.set(c.id, c));
                heldCarts = Array.from(mergedMap.values());
                localStorage.setItem("apex_pos_held_carts", JSON.stringify(heldCarts));
                if (onSyncUpdate) onSyncUpdate('heldCarts');
            }, err => console.error('[db] Held Carts sync error:', err));

        } catch (error) {
            console.error('[ApexPOS] Firestore realtime sync registration failed:', error);
            this._loadFromLocalStorage();
        }
    },

    /** Original localStorage loader (fallback) */
    _loadFromLocalStorage() {
        products = JSON.parse(localStorage.getItem("apex_pos_products")) || [...DEFAULT_PRODUCTS];
        transactions = JSON.parse(localStorage.getItem("apex_pos_transactions")) || [];
        zReports = JSON.parse(localStorage.getItem("apex_pos_zreports")) || [];
        settings = JSON.parse(localStorage.getItem("apex_pos_settings")) || { ...DEFAULT_SETTINGS };
        heldCarts = JSON.parse(localStorage.getItem("apex_pos_held_carts")) || [];
        cart = JSON.parse(localStorage.getItem("apex_pos_active_cart")) || [];

        if (!localStorage.getItem("apex_pos_products")) {
            localStorage.setItem("apex_pos_products", JSON.stringify(DEFAULT_PRODUCTS));
        }
        if (!localStorage.getItem("apex_pos_settings")) {
            localStorage.setItem("apex_pos_settings", JSON.stringify(DEFAULT_SETTINGS));
        }
    },

    // ====================================================================
    // SAVE — Write data to Firestore (or localStorage fallback)
    // ====================================================================

    /** Save entire products array to Firestore (chunked in batches of 200) */
    async saveProducts(productsArr) {
        localStorage.setItem("apex_pos_products", JSON.stringify(productsArr));
        if (!this.isCloud()) {
            return;
        }
        try {
            for (let i = 0; i < productsArr.length; i += 200) {
                const chunk = productsArr.slice(i, i + 200);
                const batch = firestoreDb.batch();
                chunk.forEach(p => {
                    const ref = firestoreDb.collection('products').doc(p.code);
                    batch.set(ref, p);
                });
                await batch.commit();
            }
        } catch (error) {
            console.error('[ApexPOS] Failed to save products to cloud:', error);
        }
    },

    /** Alias for saveProducts to prevent runtime crashes */
    async saveAllProducts(productsArr) {
        return this.saveProducts(productsArr);
    },
    async saveSingleProduct(product) {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_products", JSON.stringify(products));
            return;
        }
        try {
            await firestoreDb.collection('products').doc(product.code).set(product);
        } catch (error) {
            console.error('[ApexPOS] Failed to save product to cloud:', error);
            localStorage.setItem("apex_pos_products", JSON.stringify(products));
        }
    },

    /** Delete a single product */
    async deleteProduct(productCode) {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_products", JSON.stringify(products));
            return;
        }
        try {
            await firestoreDb.collection('products').doc(productCode).delete();
        } catch (error) {
            console.error('[ApexPOS] Failed to delete product from cloud:', error);
            localStorage.setItem("apex_pos_products", JSON.stringify(products));
        }
    },

    /** Save/add a transaction */
    async saveTransaction(txn) {
        localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
        if (!this.isCloud()) {
            return;
        }
        try {
            await firestoreDb.collection('transactions').doc(txn.id).set(txn);
        } catch (error) {
            console.error('[ApexPOS] Failed to save transaction to cloud:', error);
        }
    },

    /** Delete a single transaction from Firestore and localStorage */
    async deleteTransaction(txnId) {
        transactions = transactions.filter(t => t.id !== txnId);
        localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
        if (!this.isCloud()) {
            return;
        }
        try {
            await firestoreDb.collection('transactions').doc(txnId).delete();
        } catch (error) {
            console.error('[ApexPOS] Failed to delete transaction from cloud:', error);
        }
    },
    async saveAllTransactions(txnArr) {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_transactions", JSON.stringify(txnArr));
            return;
        }
        try {
            // Firestore batches max 500 ops, so we chunk
            const chunks = [];
            for (let i = 0; i < txnArr.length; i += 250) {
                chunks.push(txnArr.slice(i, i + 250));
            }
            
            for (const chunk of chunks) {
                const batch = firestoreDb.batch();
                chunk.forEach(txn => {
                    const ref = firestoreDb.collection('transactions').doc(txn.id);
                    batch.set(ref, txn);
                });
                await batch.commit();
            }
        } catch (error) {
            console.error('[ApexPOS] Failed to save transactions to cloud:', error);
            localStorage.setItem("apex_pos_transactions", JSON.stringify(txnArr));
        }
    },

    /** Mark shift transactions as closed in Firestore without deleting docs (keeps e-receipts working!) */
    async closeShiftTransactions(zReportId, txnIds) {
        localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
        if (!this.isCloud() || !Array.isArray(txnIds) || txnIds.length === 0) {
            return;
        }
        try {
            for (let i = 0; i < txnIds.length; i += 200) {
                const chunk = txnIds.slice(i, i + 200);
                const batch = firestoreDb.batch();
                chunk.forEach(id => {
                    const ref = firestoreDb.collection('transactions').doc(id);
                    batch.update(ref, { closed: true, zReportId: zReportId });
                });
                await batch.commit();
            }
        } catch (error) {
            console.error('[ApexPOS] Failed to mark transactions closed in cloud:', error);
        }
    },

    /** Clear all transactions (factory reset only) */
    async clearTransactions() {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_transactions", JSON.stringify([]));
            return;
        }
        try {
            const snapshot = await firestoreDb.collection('transactions').get();
            const batch = firestoreDb.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } catch (error) {
            console.error('[ApexPOS] Failed to clear transactions from cloud:', error);
            localStorage.setItem("apex_pos_transactions", JSON.stringify([]));
        }
    },

    /** Save a Z-Report */
    async saveZReport(report) {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_zreports", JSON.stringify(zReports));
            return;
        }
        try {
            await firestoreDb.collection('zReports').doc(report.id).set(report);
        } catch (error) {
            console.error('[ApexPOS] Failed to save Z-Report to cloud:', error);
            localStorage.setItem("apex_pos_zreports", JSON.stringify(zReports));
        }
    },

    /** Save settings document */
    async saveSettings(settingsObj) {
        if (!this.isCloud()) {
            localStorage.setItem("apex_pos_settings", JSON.stringify(settingsObj));
            return;
        }
        try {
            await firestoreDb.collection('config').doc('settings').set(settingsObj);
        } catch (error) {
            console.error('[ApexPOS] Failed to save settings to cloud:', error);
            localStorage.setItem("apex_pos_settings", JSON.stringify(settingsObj));
        }
    },

    /** Save held carts */
    async saveHeldCarts(cartsArr) {
        localStorage.setItem("apex_pos_held_carts", JSON.stringify(cartsArr));
        if (!this.isCloud()) {
            return;
        }
        try {
            const batch = firestoreDb.batch();
            
            // Clear existing
            const existing = await firestoreDb.collection('heldCarts').get();
            existing.docs.forEach(doc => batch.delete(doc.ref));
            
            // Write current
            cartsArr.forEach(c => {
                const ref = firestoreDb.collection('heldCarts').doc(c.id);
                batch.set(ref, c);
            });
            
            await batch.commit();
        } catch (error) {
            console.error('[ApexPOS] Failed to save held carts to cloud:', error);
            localStorage.setItem("apex_pos_held_carts", JSON.stringify(cartsArr));
        }
    },

    /** Save active cart (always localStorage for speed) */
    saveActiveCart(cartArr) {
        localStorage.setItem("apex_pos_active_cart", JSON.stringify(cartArr));
    },

    // ====================================================================
    // PERSIST ALL — replaces the old persistState() calls
    // ====================================================================
    
    /** Persist all state (products, transactions, z-reports, settings, carts) */
    async persistAll() {
        // Cart saves immediately (localStorage for speed)
        this.saveActiveCart(cart);

        if (!this.isCloud()) {
            // localStorage fallback — same as original persistState
            localStorage.setItem("apex_pos_products", JSON.stringify(products));
            localStorage.setItem("apex_pos_transactions", JSON.stringify(transactions));
            localStorage.setItem("apex_pos_zreports", JSON.stringify(zReports));
            localStorage.setItem("apex_pos_settings", JSON.stringify(settings));
            localStorage.setItem("apex_pos_held_carts", JSON.stringify(heldCarts));
            return;
        }

        // Cloud save — fire and forget for non-critical saves
        try {
            await Promise.all([
                this.saveProducts(products),
                this.saveAllTransactions(transactions),
                this.saveSettings(settings),
                this.saveHeldCarts(heldCarts)
            ]);
        } catch (error) {
            console.error('[ApexPOS] Cloud persist failed:', error);
        }
    },

    // ====================================================================
    // FACTORY RESET — Clear all cloud data
    // ====================================================================
    
    async factoryReset() {
        if (!this.isCloud()) {
            localStorage.clear();
            return;
        }
        
        try {
            const collections = ['products', 'transactions', 'zReports', 'heldCarts'];
            
            for (const collName of collections) {
                const snapshot = await firestoreDb.collection(collName).get();
                if (!snapshot.empty) {
                    const batch = firestoreDb.batch();
                    snapshot.docs.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            }
            
            // Delete settings doc
            await firestoreDb.collection('config').doc('settings').delete();
            
            // Also clear localStorage
            localStorage.clear();
            
            console.log('[ApexPOS] ☁️ Cloud database factory reset complete.');
        } catch (error) {
            console.error('[ApexPOS] Factory reset failed:', error);
            localStorage.clear();
        }
    }
};
