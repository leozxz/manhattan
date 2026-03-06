export type StoredItem = {
  id: string;
  connectorName: string;
  connectorImageUrl: string;
};

const STORAGE_KEY = "manhattan_items";

// Local logo overrides — maps lowercase connector name substring to local file
const LOCAL_LOGOS: Record<string, string> = {
  nubank: "/banks/nubank-logo-0-1.png",
  "nu pagamentos": "/banks/nubank-logo-0-1.png",
  c6: "/banks/c6-bank-logo-0.png",
};

export function getLogoUrl(item: StoredItem): string {
  const nameLower = item.connectorName.toLowerCase();
  for (const [key, path] of Object.entries(LOCAL_LOGOS)) {
    if (nameLower.includes(key)) return path;
  }
  return item.connectorImageUrl;
}

function dedupe(items: StoredItem[]): StoredItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

export function loadStoredItems(): StoredItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const items: StoredItem[] = JSON.parse(raw);
    const unique = dedupe(items);
    // Auto-fix if duplicates were found
    if (unique.length !== items.length) {
      saveStoredItems(unique);
    }
    return unique;
  } catch {
    return [];
  }
}

export function saveStoredItems(items: StoredItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupe(items)));
}

export function addStoredItem(item: StoredItem): StoredItem[] {
  addPersistentItemId(item.id);
  const items = loadStoredItems();
  if (items.some((i) => i.id === item.id)) return items;
  const updated = [...items, item];
  saveStoredItems(updated);
  return updated;
}

export function removeStoredItem(id: string): StoredItem[] {
  const items = loadStoredItems().filter((i) => i.id !== id);
  saveStoredItems(items);
  return items;
}

// Persistent list of ALL item IDs ever connected (never auto-deleted)
// Used to fetch investments from all known items even if removed from sidebar
const ALL_IDS_KEY = "manhattan_all_item_ids";

export function addPersistentItemId(id: string) {
  if (typeof window === "undefined" || id.startsWith("sim-")) return;
  const ids = loadAllItemIds();
  if (!ids.includes(id)) {
    localStorage.setItem(ALL_IDS_KEY, JSON.stringify([...ids, id]));
  }
}

export function loadAllItemIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ALL_IDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
