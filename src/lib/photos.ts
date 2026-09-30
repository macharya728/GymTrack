/** Machine photos live in IndexedDB (blobs are too big for localStorage). */
const DB = 'gymtrack-photos';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

export const getPhoto = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const putPhoto = (id: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, id));
export const deletePhoto = (id: string) => tx('readwrite', (s) => s.delete(id));
export async function allPhotos(): Promise<Record<string, Blob>> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const out: Record<string, Blob> = {};
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        out[String(c.key)] = c.value as Blob;
        c.continue();
      } else resolve(out);
    };
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
}

/** Shrink a camera photo to ≤1280px JPEG so storage and backups stay small. */
export async function compressImage(file: Blob, max = 1280, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality));
}

export const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(b);
  });

export const dataUrlToBlob = async (u: string) => (await fetch(u)).blob();
