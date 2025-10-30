const DB_NAME = 'SwahiliLearnDB';
const DB_VERSION = 1;
const LESSON_STORE = 'lessons';

export interface OfflineLesson {
  id: string;
  title: string;
  level: string;
  category: string;
  content: any;
  downloadedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(LESSON_STORE)) {
        const objectStore = db.createObjectStore(LESSON_STORE, { keyPath: 'id' });
        objectStore.createIndex('level', 'level', { unique: false });
        objectStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
    };
  });
}

export async function saveLessonOffline(lesson: OfflineLesson): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LESSON_STORE], 'readwrite');
    const store = transaction.objectStore(LESSON_STORE);
    const request = store.put(lesson);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineLesson(id: string): Promise<OfflineLesson | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LESSON_STORE], 'readonly');
    const store = transaction.objectStore(LESSON_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllOfflineLessons(): Promise<OfflineLesson[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LESSON_STORE], 'readonly');
    const store = transaction.objectStore(LESSON_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteLessonOffline(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([LESSON_STORE], 'readwrite');
    const store = transaction.objectStore(LESSON_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function isLessonDownloaded(id: string): Promise<boolean> {
  try {
    const lesson = await getOfflineLesson(id);
    return !!lesson;
  } catch {
    return false;
  }
}

export async function getOfflineStorageSize(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return { used: 0, quota: 0 };
}
