// Simple IndexedDB helper for storing image blobs by id
// Store: drmousepad-db -> images (key: id, value: { id, blob, createdAt })
// Store: drmousepad-db -> canvas (key: id, value: { id, canvasJson, createdAt })

const DB_NAME = 'drmousepad-db';
const DB_VERSION = 2; // Incrementado para agregar el nuevo store
const STORE_IMAGES = 'images';
const STORE_CANVAS = 'canvas';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no soportado'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CANVAS)) {
        db.createObjectStore(STORE_CANVAS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImageBlob(blob: Blob, id?: string): Promise<string> {
  const db = await openDB();
  const newId = id || `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    store.put({ id: newId, blob, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return newId;
}

export async function getImageBlob(id: string): Promise<Blob | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result?.blob as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImageBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.delete(id);
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllImages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.clear();
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
  });
}

// Funciones para manejar canvasJson
export async function saveCanvasJson(id: string, canvasJson: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CANVAS, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS);
    store.put({ id, canvasJson, createdAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCanvasJson(id: string): Promise<string | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CANVAS, 'readonly');
    const store = tx.objectStore(STORE_CANVAS);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result?.canvasJson as string | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCanvasJson(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CANVAS, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS);
    const req = store.delete(id);
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllCanvas(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CANVAS, 'readwrite');
    const store = tx.objectStore(STORE_CANVAS);
    const req = store.clear();
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
  });
}
