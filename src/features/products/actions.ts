"use server";

import { revalidatePath } from "next/cache";
import {
  ArchiveProductInputSchema, CreateProductInputSchema, ReactivateProductInputSchema,
  StockInInputSchema, StockOutInputSchema, UpdateProductInputSchema,
  type ProductMutationResult,
} from "./schemas/product-rpc.schema";
import {
  authorizeProducts, getProduct, getProductHistory, getProductMetrics, getTextSuggestions,
  listProducts, productMutation, productFailure,
} from "./server";
import { uploadProductPhoto, removeUnreferencedPhotos } from "./photo-storage";

function revalidateAll() {
  revalidatePath("/products");
  revalidatePath("/inventory");
}

export async function createProductAction(input: unknown, files?: FormData): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const parsed = CreateProductInputSchema.safeParse(input);
  if (!parsed.success) return productMutation(authorization.client, "stockos_create_product", CreateProductInputSchema, input);
  const upload = await uploadProductPhoto(parsed.data.photo, files);
  if (upload) return productFailure(upload === "validation" ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
  const result = await productMutation(authorization.client, "stockos_create_product", CreateProductInputSchema, parsed.data);
  if (result.ok) revalidateAll();
  else if (parsed.data.photo)
    await removeUnreferencedPhotos([parsed.data.photo.display.hash, parsed.data.photo.thumb.hash], authorization.client);
  return result;
}
export async function updateProductAction(input: unknown, files?: FormData): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const parsed = UpdateProductInputSchema.safeParse(input);
  if (!parsed.success) return productMutation(authorization.client, "stockos_update_product", UpdateProductInputSchema, input);
  const previous = parsed.data.patch.photo !== undefined ? await getProduct({ id: parsed.data.productId }, true) : null;
  if (previous && !previous.ok) return previous;
  const upload = await uploadProductPhoto(parsed.data.patch.photo, files);
  if (upload) return productFailure(upload === "validation" ? "VALIDATION_ERROR" : "INTERNAL_ERROR");
  const result = await productMutation(authorization.client, "stockos_update_product", UpdateProductInputSchema, parsed.data);
  if (result.ok) {
    revalidateAll();
    const old = previous?.ok ? previous.data.photo : null;
    if (old) await removeUnreferencedPhotos([old.display.hash, old.thumb.hash], authorization.client);
  } else if (parsed.data.patch.photo) {
    // A rejected mutation would leave the freshly uploaded objects unreferenced forever.
    await removeUnreferencedPhotos([parsed.data.patch.photo.display.hash, parsed.data.patch.photo.thumb.hash], authorization.client);
  }
  return result;
}
export async function archiveProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_archive_product", ArchiveProductInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}
export async function reactivateProductAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_reactivate_product", ReactivateProductInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}
export async function stockInAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_in", StockInInputSchema, input);
  if (result.ok) revalidateAll();
  return result;
}
export async function stockOutAction(input: unknown): Promise<ProductMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  const result = await productMutation(authorization.client, "stockos_record_stock_out", StockOutInputSchema, input);
  if (result.ok) revalidateAll();
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
