export type StoredImage = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  fingerprint: string;
};

export type TransferDraft = {
  contentImageId: string | null;
  customStyleImageId: string | null;
  selectedStyle: string;
  strength: number;
  resolution: string;
  preserveStructure: boolean;
};

const STORAGE_KEYS = {
  imageLibrary: "style-transfer-image-library",
  draftByUser: "style-transfer-draft-by-user",
};

let runtimeImageLibrary: Record<string, StoredImage> = {};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readImageLibrary() {
  return runtimeImageLibrary;
}

export function saveImageLibrary(library: Record<string, StoredImage>) {
  runtimeImageLibrary = library;
}

export function readDraftByUser() {
  return readJson<Record<string, TransferDraft>>(STORAGE_KEYS.draftByUser, {});
}

export function saveDraftByUser(drafts: Record<string, TransferDraft>) {
  writeJson(STORAGE_KEYS.draftByUser, drafts);
}

export function clearTransferSession() {
  runtimeImageLibrary = {};
  window.localStorage.removeItem(STORAGE_KEYS.imageLibrary);
  window.localStorage.removeItem(STORAGE_KEYS.draftByUser);
}

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getFileFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

export async function persistLocalImage(file: File): Promise<StoredImage> {
  const fingerprint = await getFileFingerprint(file);
  const library = readImageLibrary();
  const existing = library[fingerprint];

  if (existing) {
    return existing;
  }

  const storedImage: StoredImage = {
    id: `img-${Date.now()}`,
    name: file.name,
    type: file.type,
    dataUrl: await fileToDataUrl(file),
    fingerprint,
  };

  const nextLibrary = {
    ...library,
    [fingerprint]: storedImage,
  };
  saveImageLibrary(nextLibrary);
  return storedImage;
}

export function findImageById(imageId: string | null) {
  if (!imageId) return null;
  const library = readImageLibrary();
  const matched = Object.values(library).find((item) => item.id === imageId);
  return matched ?? null;
}
