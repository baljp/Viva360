const DB_NAME = 'viva360-local';
const DB_VERSION = 1;
const STORE = 'images';

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this runtime.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
};

const withStore = async <T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const req = run(store);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed.'));
    req.onsuccess = () => resolve(req.result);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      reject(tx.error || new Error('IndexedDB transaction failed.'));
      db.close();
    };
  });
};

export const idbImages = {
  put: async (key: string, blob: Blob): Promise<void> => {
    await withStore('readwrite', (store) => store.put(blob, key));
  },
  get: async (key: string): Promise<Blob | null> => {
    const result = await withStore('readonly', (store) => store.get(key));
    return (result as any) ? (result as Blob) : null;
  },
  del: async (key: string): Promise<void> => {
    await withStore('readwrite', (store) => store.delete(key));
  },
};

export const buildLocalImageKey = (id: string) => `img:${id}`;

