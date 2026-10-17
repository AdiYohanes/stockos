/**
 * Canonical Indonesian small-shop (warung) domain constants.
 * Standard categories and base inventory units for single-shop operations.
 */

export const WARUNG_CATEGORIES = [
  "Bahan Pokok",
  "Mi Instan",
  "Minuman",
  "Makanan Ringan",
  "Bumbu & Dapur",
  "Perawatan Diri",
  "Kebersihan Rumah",
  "Obat & P3K",
] as const;

export type WarungCategory = (typeof WARUNG_CATEGORIES)[number];

export const WARUNG_UNITS = [
  "Pcs",
  "Bungkus",
  "Botol",
  "Sachet",
  "Renceng",
  "Kaleng",
  "Karung",
  "Kg",
  "Butir",
  "Pouch",
  "Dus",
  "Kotak",
] as const;

export type WarungUnit = (typeof WARUNG_UNITS)[number];
