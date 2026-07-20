function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key) {
      data.delete(key);
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
  };
}

function isUsable(storage: Storage | null): boolean {
  if (!storage) {
    return false;
  }
  try {
    /*
     * A completely full store fails this write probe and gets swapped for an
     * empty shim, dropping persisted keys for the session. Rare; split
     * block-vs-full handling only if it shows up.
     */
    const key = '__appsemble_storage_test__';
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Guarantee `localStorage` and `sessionStorage` are usable.
 *
 * Browsers may return `null` or throw when web storage is disabled (privacy
 * settings, blocked cookies, some embedded webviews). The app reads storage on
 * load, so an unusable store crashes it. Replace an unusable store with an
 * in-memory fallback so reads and writes silently no-op for that session.
 */
export function polyfillStorage(): void {
  for (const type of ['localStorage', 'sessionStorage'] as const) {
    let storage: Storage | null = null;
    try {
      storage = window[type];
    } catch {
      // Accessing the property itself can throw when storage is blocked.
    }
    if (!isUsable(storage)) {
      Object.defineProperty(window, type, {
        configurable: true,
        value: createMemoryStorage(),
      });
    }
  }
}
