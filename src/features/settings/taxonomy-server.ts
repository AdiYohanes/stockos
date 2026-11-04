import "server-only";
import { z } from "zod";
import {
  ListTaxonomyInputSchema, CreateCategoryInputSchema,
  UpdateCategoryInputSchema, DeleteCategoryInputSchema, CreateSupplierInputSchema,
  DeleteSupplierInputSchema, TaxonomyMutationSuccessSchema,
  CategoryDtoSchema, SupplierDtoSchema,
  type CategoryDto, type SupplierDto, type TaxonomyMutationSuccess,
} from "./schemas/taxonomy-rpc.schema";
import {
  authorizeProducts, productRead, type SessionClientType,
} from "@/features/products/server";
import { settingsFailure, settingsValidationFailure, settingsTransportFailure, settingsRpcFailure } from "./server";
import type { ProductFailure, ProductReadResult } from "@/features/products/schemas/product-rpc.schema";

export type CategoryListResult = ProductReadResult<CategoryDto[]>;
export type SupplierListResult = ProductReadResult<SupplierDto[]>;

type TaxonomyMutationResult = TaxonomyMutationSuccess | ProductFailure;

// Mirrors productMutation in products/server.ts: caller already authorized the session client.
async function taxonomyMutation(client: SessionClientType, rpc: string, schema: z.ZodType, input: unknown): Promise<TaxonomyMutationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return settingsValidationFailure(parsed.error);
  try {
    const result = await client.rpc(rpc, { p_input: parsed.data });
    if (result.error) return settingsTransportFailure(result.error);
    const failure = settingsRpcFailure(result.data);
    if (failure) return failure;
    const response = TaxonomyMutationSuccessSchema.safeParse(result.data);
    return response.success ? response.data : settingsFailure("INTERNAL_ERROR");
  } catch {
    return settingsFailure("INTERNAL_ERROR");
  }
}

async function authorizedMutation(rpc: string, schema: z.ZodType, input: unknown): Promise<TaxonomyMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;
  return taxonomyMutation(authorization.client, rpc, schema, input);
}

export async function listCategories(input: unknown = {}, writable = false): Promise<CategoryListResult> {
  return productRead("stockos_list_categories", ListTaxonomyInputSchema, z.array(CategoryDtoSchema), input, writable);
}
export async function listSuppliers(input: unknown = {}, writable = false): Promise<SupplierListResult> {
  return productRead("stockos_list_suppliers", ListTaxonomyInputSchema, z.array(SupplierDtoSchema), input, writable);
}

export async function createCategory(input: unknown) {
  return authorizedMutation("stockos_create_category", CreateCategoryInputSchema, input);
}
export async function updateCategory(input: unknown) {
  return authorizedMutation("stockos_update_category", UpdateCategoryInputSchema, input);
}
export async function deleteCategory(input: unknown) {
  return authorizedMutation("stockos_delete_category", DeleteCategoryInputSchema, input);
}
export async function createSupplier(input: unknown) {
  return authorizedMutation("stockos_create_supplier", CreateSupplierInputSchema, input);
}
export async function updateSupplier(input: unknown) {
  return authorizedMutation("stockos_update_supplier", CreateSupplierInputSchema.extend({ id: z.uuid() }), input);
}
export async function deleteSupplier(input: unknown) {
  return authorizedMutation("stockos_delete_supplier", DeleteSupplierInputSchema, input);
}
