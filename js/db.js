// ----------------------------------------------------------------------------
// Local-only data layer, backed by IndexedDB. No accounts, no network, no sync.
// Everything lives on this device inside the browser. Use Settings → Backup to
// export a copy, and Settings → Restore to bring it back (or move to another device).
// ----------------------------------------------------------------------------

const DB_NAME = 'ledger-db';
const DB_VERSION = 1;
const STORES = ['products', 'sales', 'expenses', 'debts', 'budget'];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function tx(db, storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function getAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, storeName, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addItem(storeName, data) {
  const db = await openDB();
  const record = { id: uid(), ...data };
  return new Promise((resolve, reject) => {
    const req = tx(db, storeName, 'readwrite').add(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function updateItem(storeName, id, data) {
  const db = await openDB();
  const store = tx(db, storeName, 'readwrite');
  const existing = await new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!existing) throw new Error('Record not found');
  const merged = { ...existing, ...data, id };
  return new Promise((resolve, reject) => {
    const req = store.put(merged);
    req.onsuccess = () => resolve(merged);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteItem(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, storeName, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---- Backup / restore (full local dataset as a single JSON file) ----
export async function exportAll() {
  const data = {};
  for (const name of STORES) data[name] = await getAll(name);
  data._meta = { exportedAt: new Date().toISOString(), version: DB_VERSION };
  return data;
}

// Replaces everything currently stored with the contents of `data`.
export async function importAll(data) {
  const db = await openDB();
  for (const name of STORES) {
    const store = tx(db, name, 'readwrite');
    await new Promise((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });
  }
  for (const name of STORES) {
    if (!Array.isArray(data[name])) continue;
    const store = tx(db, name, 'readwrite');
    for (const record of data[name]) {
      store.put(record);
    }
  }
}

export async function clearAll() {
  const db = await openDB();
  for (const name of STORES) {
    const store = tx(db, name, 'readwrite');
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
