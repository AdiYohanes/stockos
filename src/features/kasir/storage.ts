import type { TallyItem } from "./types";

const STORAGE_KEY = "stockos_kasir_tally_v1";

export function loadTallyFromStorage(): TallyItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to load kasir tally from localStorage:", err);
    return [];
  }
}

export function saveTallyToStorage(items: TallyItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (err) {
    console.error("Failed to save kasir tally to localStorage:", err);
  }
}

export function clearTallyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear kasir tally from localStorage:", err);
  }
}

const listeners = new Set<() => void>();
let cachedTally: TallyItem[] | null = null;
const SERVER_SNAPSHOT: TallyItem[] = [];

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const tallyStore = {
  getSnapshot: (): TallyItem[] => {
    if (typeof window === "undefined") return SERVER_SNAPSHOT;
    if (cachedTally === null) {
      cachedTally = loadTallyFromStorage();
    }
    return cachedTally;
  },
  getServerSnapshot: (): TallyItem[] => SERVER_SNAPSHOT,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  set: (items: TallyItem[]): void => {
    cachedTally = items;
    saveTallyToStorage(items);
    notify();
  },
  clear: (): void => {
    cachedTally = [];
    clearTallyStorage();
    notify();
  },
};
