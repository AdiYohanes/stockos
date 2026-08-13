/**
 * Pure string regex formatting utilities to guarantee 100% identical
 * outputs on server and client across all locales without Intl dependencies.
 */

export function formatNumber(value: number): string {
  const parts = Math.round(value).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`;
}
