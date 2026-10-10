"use server";

import { revalidatePath } from "next/cache";
import {
  ArchiveProductInputSchema, CreateProductInputSchema, ReactivateProductInputSchema,
  StockInInputSchema, StockOutInputSchema, UpdateProductInputSchema,
  type ProductMutationResult,
} from "./schemas/product-rpc.schema";
import {
  authorizeProducts, getProduct, getProductHistory, getProductMetrics, getTextSuggestions,
  listProducts, productMutation,
} from "./server";

export async function createProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_create_product", CreateProductInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}
export async function updateProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_update_product", UpdateProductInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}
export async function archiveProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_archive_product", ArchiveProductInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}
export async function reactivateProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_reactivate_product", ReactivateProductInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}
export async function stockInAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_in", StockInInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}
export async function stockOutAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_out", StockOutInputSchema, input);
  if (result.ok) revalidatePath("/products");
  return result;
}

export async function listProductsAction(input: unknown = {}) {
  return listProducts(input, true);
}
export async function getProductAction(input: unknown) {
  return getProduct(input, true);
}
export async function getProductHistoryAction(input: unknown) {
  return getProductHistory(input, true);
}
export async function getTextSuggestionsAction(input: unknown) {
  return getTextSuggestions(input, true);
}
export async function getProductMetricsAction(input: unknown = {}) {
  return getProductMetrics(input, true);
}
