import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DeleteProductInputSchema, ProductRpcFailureSchema } from "../src/features/products/schemas/product-rpc.schema.ts";

const input = {
  requestId: randomUUID(), productId: randomUUID(),
  expectedMetadataVersion: "1", expectedStockVersion: "0",
};
assert.deepEqual(DeleteProductInputSchema.parse(input), input);
for (const field of Object.keys(input)) {
  const incomplete = { ...input };
  delete incomplete[field];
  assert.equal(DeleteProductInputSchema.safeParse(incomplete).success, false, `${field} is required`);
}
for (const invalid of [
  { ...input, productId: "not-a-uuid" },
  { ...input, expectedStockVersion: "-1" },
  { ...input, expectedMetadataVersion: "9223372036854775808" },
  { ...input, force: true },
  { ...input, deleteHistory: true },
]) assert.equal(DeleteProductInputSchema.safeParse(invalid).success, false);
assert.equal(ProductRpcFailureSchema.parse({ ok: false, code: "PRODUCT_HAS_HISTORY", message: "PRODUCT_HAS_HISTORY" }).code, "PRODUCT_HAS_HISTORY");
console.log("Product deletion boundary checks PASS (offline schemas only; no database/browser proof)");
