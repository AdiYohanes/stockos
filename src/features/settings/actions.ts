"use server";

import { revalidatePath } from "next/cache";
import { getShopSettings, updateShopSettings } from "./server";
import {
  createCategory, createSupplier, deleteCategory, deleteSupplier, listCategories, listSuppliers, updateCategory, updateSupplier,
  type CategoryListResult, type SupplierListResult,
} from "./taxonomy-server";
import type { SettingsMutationResult, ShopSettingsReadResult } from "./schemas/settings-rpc.schema";

export async function getShopSettingsAction(): Promise<ShopSettingsReadResult> {
  return getShopSettings({}, true);
}

export async function updateShopSettingsAction(input: unknown): Promise<SettingsMutationResult> {
  const result = await updateShopSettings(input);
  if (result.ok) {
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/inventory");
    revalidatePath("/reports");
  }
  return result;
}

function revalidateTaxonomy() {
  revalidatePath("/settings");
  revalidatePath("/products");
  revalidatePath("/inventory");
}

export async function listCategoriesAction(input: unknown = {}): Promise<CategoryListResult> {
  return listCategories(input, true);
}
export async function listSuppliersAction(input: unknown = {}): Promise<SupplierListResult> {
  return listSuppliers(input, true);
}

export async function createCategoryAction(input: unknown) {
  const result = await createCategory(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
export async function updateCategoryAction(input: unknown) {
  const result = await updateCategory(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
export async function deleteCategoryAction(input: unknown) {
  const result = await deleteCategory(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
export async function createSupplierAction(input: unknown) {
  const result = await createSupplier(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
export async function updateSupplierAction(input: unknown) {
  const result = await updateSupplier(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
export async function deleteSupplierAction(input: unknown) {
  const result = await deleteSupplier(input);
  if (result.ok) revalidateTaxonomy();
  return result;
}
