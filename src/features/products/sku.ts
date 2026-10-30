/**
 * Auto-SKU rule for new products, derived from the product name:
 * first word (alphanumeric, max 4 chars, min 3) plus second word (max 4 chars),
 * uppercase, e.g. "aqua" → AQUA, "beng beng" → BENG-BENG, "mie instan goreng" → MIE-INST.
 * Collisions retry with a numeric suffix: attempt 1 → "BENG-BENG-2".
 */
export function skuFromName(name: string, attempt = 0): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  return ((words[0] ?? "").slice(0, 4).padEnd(3, "X") +
    (words[1] ? `-${words[1].slice(0, 4)}` : "") +
    (attempt > 0 ? `-${attempt + 1}` : ""));
}
