import fs from "node:fs";

/**
 * Taxonomy (kategori & pemasok) contract checks for managed master data (ADR 0002, issue #11).
 * Offline assertions: migration contract markers + Zod schema validation + PLU-9 fallback.
 */

const MIGRATION = "20261102000000_taxonomy_management.sql";
const sql = fs.readFileSync(new URL(`../supabase/migrations/${MIGRATION}`, import.meta.url), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// 1. Seed parity: the 8 canonical warung categories are seeded and existing product text adopted.
const { WARUNG_CATEGORIES } = await import("../src/features/products/constants.ts");
for (const name of WARUNG_CATEGORIES) {
  assert(sql.includes(`'${name}'`), `Missing seeded category '${name}' in ${MIGRATION}`);
}
assert(sql.includes("select distinct category from stockos_private.products"), "Migration must adopt existing product categories into the master table.");
assert(sql.includes("select distinct supplier from stockos_private.products"), "Migration must adopt existing product suppliers into the master table.");

// 2. Mutation operations and administrative audit kinds are whitelisted.
const operations = ["create_category", "update_category", "delete_category", "create_supplier", "update_supplier", "delete_supplier"];
for (const op of operations) assert(sql.includes(`'${op}'`), `Missing mutation operation '${op}' whitelist entry.`);
const kinds = ["category_created", "category_updated", "category_deleted", "supplier_created", "supplier_updated", "supplier_deleted"];
for (const kind of kinds) assert(sql.includes(`'${kind}'`), `Missing administrative event kind '${kind}'.`);

// 3. safe_failure whitelist carries taxonomy error codes.
assert(sql.includes("TAXONOMY_EXISTS"), "safe_failure whitelist must include TAXONOMY_EXISTS.");
assert(sql.includes("TAXONOMY_IN_USE"), "safe_failure whitelist must include TAXONOMY_IN_USE.");

// 4. RPC surface: 8 public owner RPCs with grants.
const rpcs = ["stockos_list_categories", "stockos_create_category", "stockos_update_category", "stockos_delete_category",
  "stockos_list_suppliers", "stockos_create_supplier", "stockos_update_supplier", "stockos_delete_supplier"];
for (const rpc of rpcs) {
  assert(sql.includes(`create function public.${rpc}(p_input jsonb`), `Missing public RPC ${rpc}.`);
}
assert(sql.includes("grant execute on function public.stockos_create_category") || sql.match(/grant execute[\s\S]*stockos_create_category/), "Missing grant for taxonomy RPCs.");

// 5. Rename propagation and restrict-delete semantics.
assert(/update stockos_private\.products set category = v_name/.test(sql) || (sql.includes("set category = v_name")), "Category rename must propagate to active products in the same transaction.");
assert(/update stockos_private\.products set supplier = v_name/.test(sql) || (sql.includes("set supplier = v_name")), "Supplier rename must propagate to active products in the same transaction.");
assert(/archived_at is null/.test(sql), "Propagation and usage checks must target active products only.");
assert(/TAXONOMY_IN_USE/.test(sql), "Delete must fail closed with TAXONOMY_IN_USE when products still reference the master row.");

// 6. Zod contract schemas validate taxonomy inputs.
const schema = await import("../src/features/settings/schemas/taxonomy-rpc.schema.ts");
const longName = "x".repeat(121);
for (const [name, bad] of [
  ["CreateCategoryInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "" }],
  ["CreateCategoryInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: longName }],
  ["CreateCategoryInputSchema", { requestId: "not-a-uuid", name: "Komputer & ATK" }],
  ["CreateSupplierInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "" }],
  ["DeleteCategoryInputSchema", {}],
  ["DeleteCategoryInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", id: "zzz" }],
  ["UpdateSupplierInputSchema", { requestId: "3f2f9f3e-6e1a-42c7-9a51-1d0c03a92b7f", id: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7d", name: "", phone: "0812" }],
]) {
  const parse = schema[name].safeParse(bad);
  if (parse.success) throw new Error(`${name} accepted invalid input: ${JSON.stringify(bad)}`);
}
for (const [name, good] of [
  ["CreateCategoryInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "Komputer & ATK" }],
  ["CreateSupplierInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "Toko Grosir Makmur", phone: "0812-3456-7890", notes: "Sembako grosir, pengiriman Senin" }],
  ["CreateSupplierInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "Toko Grosir Makmur" }],
  ["DeleteCategoryInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", id: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7d" }],
  ["CreateSupplierInputSchema", { requestId: "3f2b9f3e-6e1a-42c7-9a51-1d0c03a92b7f", name: "Toko Grosir Makmur", phone: null }],
]) {
  const parse = schema[name].safeParse(good);
  if (!parse.success) throw new Error(`${name} rejected valid input: ${JSON.stringify(good)} — ${parse.error?.issues.map(i => i.path.join(".")).join()}`);
}

// 7. Error code contract.
const { ProductErrorCodeSchema } = await import("../src/features/products/schemas/product-rpc.schema.ts");
for (const code of ["TAXONOMY_EXISTS", "TAXONOMY_IN_USE"]) {
  if (!ProductErrorCodeSchema.safeParse(code).success) throw new Error(`ProductErrorCodeSchema missing ${code}.`);
}

// 8. PLU-9 SKU fallback for unrecognized/custom categories (issue #11 story 16).
const { getCategoryPluPrefix } = await import("../src/features/products/sku.ts");
for (const custom of ["Komputer & ATK", "Kantong Belanja", "Secangkir Cerita"]) {
  if (getCategoryPluPrefix(custom) !== 9) throw new Error(`Custom category ${custom} must use PLU prefix 9.`);
}

// 9. Server actions expose the taxonomy surface (source scan: action modules import next/cache, which never loads under plain node).
const actions = fs.readFileSync(new URL("../src/features/settings/actions.ts", import.meta.url), "utf8");
for (const action of ["listCategoriesAction", "createCategoryAction", "updateCategoryAction", "deleteCategoryAction",
  "listSuppliersAction", "createSupplierAction", "updateSupplierAction", "deleteSupplierAction"]) {
  if (!actions.includes(`export async function ${action}`)) throw new Error(`Missing server action ${action}.`);
}

console.log("taxonomy checks PASS.");
