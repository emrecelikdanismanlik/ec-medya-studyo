import type {
  DayId,
  FramingMode,
  LogoAsset,
  ProfilePhotoAsset,
  StudioSettings,
  VerifiedDailyData,
} from '../types/studio';

const SETTINGS_KEY = 'ec_medya_studyo_settings_v1';
const VERIFIED_CACHE_KEY = 'ec_medya_studyo_verified_cache_v1';

const DB_NAME = 'ec_brand_vault_db';
const DB_VERSION = 1;
const STORE_LOGO = 'logo';
const STORE_PROFILES = 'profiles';

export const DEFAULT_SETTINGS: StudioSettings = {
  apiKey: '',
  imageModel: 'gemini-nano-banana-2.1',
  imageSize: '1K',
  autoGenerateCover: false,
};

export function loadStudioSettings(): StudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StudioSettings>;
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      imageModel:
        parsed.imageModel === 'gemini-3-pro-image' ? 'gemini-3-pro-image' : 'gemini-nano-banana-2.1',
      imageSize: parsed.imageSize === '2K' ? '2K' : '1K',
      autoGenerateCover: Boolean(parsed.autoGenerateCover),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStudioSettings(settings: StudioSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getCacheMap(): Record<string, VerifiedDailyData> {
  try {
    const raw = localStorage.getItem(VERIFIED_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, VerifiedDailyData>;
  } catch {
    return {};
  }
}

export function getCachedVerifiedData(dayId: DayId, dateKey: string): VerifiedDailyData | null {
  const map = getCacheMap();
  const key = `${dateKey}_${dayId}`;
  return map[key] ?? null;
}

export function saveCachedVerifiedData(data: VerifiedDailyData): void {
  const map = getCacheMap();
  const key = `${data.dateKey}_${data.dayId}`;
  map[key] = data;

  // Keep only the most recent 14 entries so localStorage stays compact
  const entries = Object.entries(map).sort((a, b) => b[1].fetchedAt - a[1].fetchedAt);
  const trimmed = Object.fromEntries(entries.slice(0, 14));
  localStorage.setItem(VERIFIED_CACHE_KEY, JSON.stringify(trimmed));
}

export function clearCachedVerifiedData(dayId: DayId, dateKey: string): void {
  const map = getCacheMap();
  delete map[`${dateKey}_${dayId}`];
  localStorage.setItem(VERIFIED_CACHE_KEY, JSON.stringify(map));
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB açılamadı'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_LOGO)) {
        db.createObjectStore(STORE_LOGO, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROFILES)) {
        db.createObjectStore(STORE_PROFILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getStoredLogo(): Promise<LogoAsset | null> {
  try {
    const db = await openVaultDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGO, 'readonly');
      const store = tx.objectStore(STORE_LOGO);
      const req = store.get('official-logo');
      req.onsuccess = () => resolve((req.result as LogoAsset | undefined) ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function saveStoredLogo(logo: LogoAsset): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LOGO, 'readwrite');
    const store = tx.objectStore(STORE_LOGO);
    const req = store.put({ ...logo, id: 'official-logo' });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function deleteStoredLogo(): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_LOGO, 'readwrite');
    const store = tx.objectStore(STORE_LOGO);
    const req = store.delete('official-logo');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function getStoredProfilePhotos(): Promise<ProfilePhotoAsset[]> {
  try {
    const db = await openVaultDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROFILES, 'readonly');
      const store = tx.objectStore(STORE_PROFILES);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = ((req.result as ProfilePhotoAsset[]) ?? []).sort(
          (a, b) => b.createdAt - a.createdAt
        );
        resolve(items);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return [];
  }
}

export async function saveProfilePhoto(photo: ProfilePhotoAsset): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readwrite');
    const store = tx.objectStore(STORE_PROFILES);
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function setDefaultProfilePhoto(photoId: string): Promise<void> {
  const existing = await getStoredProfilePhotos();
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readwrite');
    const store = tx.objectStore(STORE_PROFILES);
    for (const item of existing) {
      store.put({ ...item, isDefault: item.id === photoId });
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateProfilePhotoFraming(
  photoId: string,
  framing: FramingMode
): Promise<void> {
  const existing = await getStoredProfilePhotos();
  const target = existing.find((p) => p.id === photoId);
  if (!target) return;
  await saveProfilePhoto({ ...target, framing });
}

export async function deleteProfilePhoto(photoId: string): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_PROFILES, 'readwrite');
    const store = tx.objectStore(STORE_PROFILES);
    const req = store.delete(photoId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

let cachedBuiltInLogo: LogoAsset | null = null;

/**
 * Returns user-uploaded custom logo or falls back to the built-in official 3D EÇ logo.
 */
export async function getEffectiveLogo(): Promise<LogoAsset> {
  const custom = await getStoredLogo();
  if (custom) return custom;

  if (cachedBuiltInLogo) return cachedBuiltInLogo;

  const response = await fetch('./brand/ec-logo.png');
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Varsayılan logo yüklenemedi'));
    reader.readAsDataURL(blob);
  });

  const base64 = dataUrl.split(',')[1] ?? '';
  cachedBuiltInLogo = {
    id: 'builtin-official-logo',
    name: 'Resmi 3D EÇ Logosu',
    mimeType: 'image/png',
    base64,
    dataUrl,
    updatedAt: 0,
  };
  return cachedBuiltInLogo;
}

/**
 * Downscales and compresses uploaded logo or profile photo to keep IndexedDB and API payloads fast.
 */
export async function processUploadedImage(
  file: File,
  maxDimension = 1280,
  outputMime: 'image/png' | 'image/jpeg' = 'image/jpeg'
): Promise<{ dataUrl: string; base64: string; mimeType: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Görsel okunamadı'));
      image.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas bağlamı oluşturulamadı');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl =
      outputMime === 'image/png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.92);

    const base64 = dataUrl.split(',')[1] ?? '';
    return {
      dataUrl,
      base64,
      mimeType: outputMime,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
