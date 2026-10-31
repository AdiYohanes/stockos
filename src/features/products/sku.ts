/**
 * Auto-SKU rule based on PLU (Price Look-Up) retail standards:
 * - Prefix "PLU-"
 * - 4-digit numeric code: 1 digit category prefix + 3 digits item code (001-999)
 *   e.g. Minuman (3) + Teh Botol Sosro → PLU-3239
 * - Category prefixes:
 *   1 = Bahan Pokok / Sembako / Sayur / Buah / Beras
 *   2 = Mi Instan / Mie
 *   3 = Minuman
 *   4 = Makanan Ringan / Snack
 *   5 = Bumbu & Dapur
 *   6 = Perawatan Diri
 *   7 = Kebersihan Rumah
 *   8 = Obat & P3K
 *   9 = Lainnya / Umum / Kantong
 * - Collisions retry by incrementing the item number, preserving 4-digit consistency.
 */

const CATEGORY_PREFIXES: Record<string, number> = {
  "bahan pokok": 1,
  "sembako": 1,
  "sayur": 1,
  "buah": 1,
  "beras": 1,
  "mi instan": 2,
  "mie instan": 2,
  "mie": 2,
  "minuman": 3,
  "minum": 3,
  "makanan ringan": 4,
  "snack": 4,
  "camilan": 4,
  "bumbu & dapur": 5,
  "bumbu": 5,
  "dapur": 5,
  "perawatan diri": 6,
  "toiletries": 6,
  "kebersihan rumah": 7,
  "kebersihan": 7,
  "detergen": 7,
  "obat & p3k": 8,
  "obat": 8,
  "p3k": 8,
};

export function getCategoryPluPrefix(category?: string | null): number {
  if (!category) return 9;
  const key = category.trim().toLowerCase();
  if (CATEGORY_PREFIXES[key] !== undefined) return CATEGORY_PREFIXES[key];
  for (const [cat, prefix] of Object.entries(CATEGORY_PREFIXES)) {
    if (key.startsWith(cat)) return prefix;
  }
  return 9;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function skuFromPlu(category: string, name: string, attempt = 0): string {
  const prefix = getCategoryPluPrefix(category);
  const cleanName = (name ?? "").trim().toLowerCase() || "produk";
  const hash = hashString(cleanName);
  const itemNum = (((hash % 999) + attempt) % 999) + 1;
  return `PLU-${prefix}${String(itemNum).padStart(3, "0")}`;
}

/**
 * Backward compatibility alias for skuFromName.
 */
export function skuFromName(name: string, attempt = 0): string {
  return skuFromPlu("", name, attempt);
}
