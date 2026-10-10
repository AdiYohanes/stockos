// DTO money stays decimal text; formatting never changes native costing.
export function formatProductMoney(value: string | null): string {
  if (value === null) return "—";
  const [whole, fraction = ""] = value.split(".");
  const decimals = fraction.replace(/0+$/, "");
  return `Rp ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${decimals ? `,${decimals}` : ""}`;
}
