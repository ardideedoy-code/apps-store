/**
 * db.js
 * Wrapper for IndexedDB to handle local storage for the POS application.
 */

const DB_NAME = 'POS_Database';
const DB_VERSION = 2;

let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Users Table
            if (!db.objectStoreNames.contains('users')) {
                const usersOS = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                usersOS.createIndex('username', 'username', { unique: true });
                usersOS.createIndex('role', 'role', { unique: false });
            }

            // Products Table
            if (!db.objectStoreNames.contains('products')) {
                const productsOS = db.createObjectStore('products', { keyPath: 'kode_barang' });
                productsOS.createIndex('barcode', 'barcode', { unique: false });
                productsOS.createIndex('nama_barang', 'nama_barang', { unique: false });
                productsOS.createIndex('kategori', 'kategori', { unique: false });
            }

            // Suppliers Table
            if (!db.objectStoreNames.contains('suppliers')) {
                const suppliersOS = db.createObjectStore('suppliers', { keyPath: 'kode_supplier' });
                suppliersOS.createIndex('nama', 'nama', { unique: false });
            }

            // Customers Table
            if (!db.objectStoreNames.contains('customers')) {
                const customersOS = db.createObjectStore('customers', { keyPath: 'kode_pelanggan' });
                customersOS.createIndex('nama', 'nama', { unique: false });
            }

            // Sales Table (Header)
            if (!db.objectStoreNames.contains('sales')) {
                const salesOS = db.createObjectStore('sales', { keyPath: 'invoice' });
                salesOS.createIndex('tanggal', 'tanggal', { unique: false });
                salesOS.createIndex('kasir', 'kasir', { unique: false });
            }

            // Sales Items Table (Detail)
            if (!db.objectStoreNames.contains('sales_items')) {
                const salesItemsOS = db.createObjectStore('sales_items', { keyPath: 'id', autoIncrement: true });
                salesItemsOS.createIndex('invoice', 'invoice', { unique: false });
                salesItemsOS.createIndex('kode_barang', 'kode_barang', { unique: false });
            }

            // Purchases Table
            if (!db.objectStoreNames.contains('purchases')) {
                const purchasesOS = db.createObjectStore('purchases', { keyPath: 'nomor_pembelian' });
                purchasesOS.createIndex('tanggal', 'tanggal', { unique: false });
                purchasesOS.createIndex('supplier', 'supplier', { unique: false });
            }
            
            // Purchase Items Table
            if (!db.objectStoreNames.contains('purchase_items')) {
                const purchaseItemsOS = db.createObjectStore('purchase_items', { keyPath: 'id', autoIncrement: true });
                purchaseItemsOS.createIndex('nomor_pembelian', 'nomor_pembelian', { unique: false });
            }

            // Cash Flow Table
            if (!db.objectStoreNames.contains('cash_flow')) {
                const cashFlowOS = db.createObjectStore('cash_flow', { keyPath: 'id', autoIncrement: true });
                cashFlowOS.createIndex('tanggal', 'tanggal', { unique: false });
                cashFlowOS.createIndex('tipe', 'tipe', { unique: false }); // Masuk / Keluar
                cashFlowOS.createIndex('kategori', 'kategori', { unique: false }); // Penjualan / Pembelian / Manual Masuk / Manual Keluar
            }

            // Settings Table
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            // Logs Table
            if (!db.objectStoreNames.contains('logs')) {
                const logsOS = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
                logsOS.createIndex('timestamp', 'timestamp', { unique: false });
                logsOS.createIndex('user', 'user', { unique: false });
                logsOS.createIndex('action', 'action', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            seedDefaultData();
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error: ', event.target.error);
            reject(event.target.error);
        };
    });
};

const seedDefaultData = () => {
    // Default Admin User
    getAllData('users').then(users => {
        if (users.length === 0) {
            addData('users', {
                username: 'admin',
                password: 'password', // In a real app, hash this!
                nama: 'Administrator',
                role: 'Administrator'
            });
            addData('users', {
                username: 'kasir',
                password: 'password',
                nama: 'Kasir 1',
                role: 'Kasir'
            });
        }
    });

    // Default Settings
    getAllData('settings').then(settings => {
        if (settings.length === 0) {
            const defaultSettings = [
                { key: 'nama_toko', value: 'Toko GTI Maju' },
                { key: 'alamat_toko', value: 'Jl. Jendral Sudirman No. 123' },
                { key: 'telepon', value: '081234567890' },
                { key: 'footer_struk', value: 'Terima kasih atas kunjungan Anda' },
                { key: 'pajak_default', value: 11 },
                { key: 'mata_uang', value: 'Rp' }
            ];
            defaultSettings.forEach(s => addData('settings', s));
        }
    });
};

// Generic DB Functions
const addData = (storeName, data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const putData = (storeName, data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const getData = (storeName, key) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const getAllData = (storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const deleteData = (storeName, key) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
};

const getByIndex = (storeName, indexName, key) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

// Export DB functions globally
window.posDB = {
    initDB,
    addData,
    putData,
    getData,
    getAllData,
    deleteData,
    getByIndex
};
