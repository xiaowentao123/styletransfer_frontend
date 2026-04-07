import { HistoryRecord } from "../data/mock";

const DB_NAME = "style-transfer-history-db";
const STORE_NAME = "history";
const HISTORY_KEY = "history-by-user";
const LEGACY_HISTORY_KEY = "style-transfer-history-by-user";

type HistoryByUser = Record<string, HistoryRecord[]>;

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readLegacyHistory(): HistoryByUser {
  try {
    const raw = window.localStorage.getItem(LEGACY_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryByUser) : {};
  } catch {
    return {};
  }
}

export async function readHistoryByUser(): Promise<HistoryByUser> {
  const database = await openHistoryDb();

  return await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(HISTORY_KEY);

    request.onsuccess = () => {
      const history = request.result as HistoryByUser | undefined;
      resolve(history ?? readLegacyHistory());
    };
    request.onerror = () => reject(request.error);
  });
}

export async function writeHistoryByUser(historyByUser: HistoryByUser): Promise<void> {
  const database = await openHistoryDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(historyByUser, HISTORY_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
