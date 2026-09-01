const DB_NAME = "location-from-image";
const DB_VERSION = 1;
const STORE_NAME = "images";
const IMAGE_KEY = "uploaded";
const GPS_KEY = "uploaded-gps";

export type GpsData = {
  latitude: number;
  longitude: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDB();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = fn(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function saveImage(blob: Blob): Promise<void> {
  await withStore<IDBValidKey>("readwrite", (store) =>
    store.put(blob, IMAGE_KEY),
  );
}

export function getImage(): Promise<Blob | undefined> {
  return withStore<Blob | undefined>("readonly", (store) =>
    store.get(IMAGE_KEY),
  );
}

export async function clearImage(): Promise<void> {
  await withStore<undefined>("readwrite", (store) =>
    store.delete(IMAGE_KEY),
  );
  await withStore<undefined>("readwrite", (store) => store.delete(GPS_KEY));
}

// GPS coordinates extracted from the image's EXIF data at selection time.
// `null` means the image was processed but contained no geolocation data.
export async function saveGps(gps: GpsData | null): Promise<void> {
  await withStore<IDBValidKey>("readwrite", (store) =>
    store.put(gps, GPS_KEY),
  );
}

export function getGps(): Promise<GpsData | null | undefined> {
  return withStore<GpsData | null | undefined>("readonly", (store) =>
    store.get(GPS_KEY),
  );
}
