"use server";

import { revalidatePath } from "next/cache";
import {
  authorizeProducts,
  productMutation,
} from "@/features/products/server";
import {
  StockInInputSchema,
  StockOutInputSchema,
  type ProductMutationResult,
} from "@/features/products/schemas/product-rpc.schema";
import {
  RecordOpnameInputSchema,
  AdjustCostInputSchema,
} from "./schemas/inventory-rpc.schema";
import {
  listInventoryStock,
  listInventoryEvents,
  getInventoryProduct,
  getInventoryMetrics,
} from "./server";

function revalidateAll() {
  revalidatePath("/inventory");
  revalidatePath("/products");
}

export async function recordOpnameAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_opname", RecordOpnameInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function adjustInventoryCostAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_adjust_inventory_cost", AdjustCostInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function inventoryStockInAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_in", StockInInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function inventoryStockOutAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_out", StockOutInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}

export async function listInventoryStockAction(input: unknown = {}) {
  return listInventoryStock(input, true);
}

export async function listInventoryEventsAction(input: unknown = {}) {
  return listInventoryEvents(input, true);
}

export async function getInventoryProductAction(input: unknown) {
  return getInventoryProduct(input, true);
}

export async function getInventoryMetricsAction(input: unknown = {}) {
  return getInventoryMetrics(input, true);
}
