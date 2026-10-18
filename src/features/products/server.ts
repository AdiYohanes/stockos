import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { OwnerSchema } from "@/features/auth/schemas";
import {
  GetProductInputSchema, ListProductsInputSchema, ProductDtoSchema, ProductHistoryInputSchema,
  ProductHistoryPageSchema, ProductMetricsInputSchema, ProductMetricsSchema,
  ProductMutationSuccessSchema, ProductRpcFailureSchema, ProductsPageSchema,
  TextSuggestionsInputSchema, TextSuggestionsSchema,
  type ProductErrorCode, type ProductFailure, type ProductMutationResult, type ProductReadResult,
} from "./schemas/product-rpc.schema";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;
const messages: Record<ProductErrorCode, string> = {
  VALIDATION_ERROR: "Check the submitted fields.",
  UNAUTHENTICATED: "Sign in again. Your unsaved changes are preserved.",
  EMAIL_UNVERIFIED: "Verify your email before accessing products.",
  FORBIDDEN: "This account or session cannot access products.",
  NOT_FOUND: "Product not found.", SKU_EXISTS: "This SKU is already in use, including archived products.",
  PRODUCT_ARCHIVED: "Reactivate this product before editing or recording stock.",
  PRODUCT_HAS_STOCK: "Only products with zero stock can be archived.",
  IDENTITY_LOCKED: "SKU and unit cannot change after stock history exists.",
  INSUFFICIENT_STOCK: "Sold quantity exceeds available stock.",
  VERSION_CONFLICT: "Product changed. Review current data before submitting again.",
  REQUEST_ID_CONFLICT: "This request ID was already used for a different submission.",
  LIMIT_EXCEEDED: "This change exceeds the supported stock or cost limit.",
  INTERNAL_ERROR: "Request could not be confirmed. Retry with the same request ID.",
};

export function productFailure(code: ProductErrorCode, fieldErrors?: Record<string, string[]>, traceId: string = randomUUID()): ProductFailure {
  return { ok: false, code, message: messages[code], traceId, ...(fieldErrors ? { fieldErrors } : {}) };
}

function transportFailure(error: { message: string; code?: string }): ProductFailure {
  // Only explicit native authorization failures are auth failures; outages remain retryable infrastructure errors.
  if (error.code === "42501" && error.message === "UNAUTHENTICATED") return productFailure("UNAUTHENTICATED");
  if (error.code === "42501" && error.message === "EMAIL_UNVERIFIED") return productFailure("EMAIL_UNVERIFIED");
  if (error.code === "42501" && error.message === "FORBIDDEN") return productFailure("FORBIDDEN");
  return productFailure("INTERNAL_ERROR");
}

export async function authorizeProducts(writable = false): Promise<{ ok: true; client: SessionClient } | ProductFailure> {
  try {
    const client = await createSessionClient(writable);
    const verified = await client.auth.getUser();
    if (verified.error) {
      const error = verified.error;
      const invalidSession = error.name === "AuthSessionMissingError" || error.status === 401 ||
        ["session_not_found", "user_not_found", "bad_jwt", "refresh_token_not_found", "refresh_token_already_used"].includes(error.code ?? "");
      return productFailure(invalidSession ? "UNAUTHENTICATED" : "INTERNAL_ERROR");
    }
    if (!verified.data.user) return productFailure("UNAUTHENTICATED");
    if (!verified.data.user.email_confirmed_at) return productFailure("EMAIL_UNVERIFIED");
    const owner = await client.rpc("stockos_owner_session");
    if (owner.error) return transportFailure(owner.error);
    const parsed = OwnerSchema.safeParse(owner.data);
    if (!parsed.success || parsed.data.id !== verified.data.user.id || parsed.data.email !== verified.data.user.email) {
      return productFailure("FORBIDDEN");
    }
    return { ok: true, client };
  } catch {
    return productFailure("INTERNAL_ERROR");
  }
}

function validationFailure(error: z.ZodError): ProductFailure {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || "form";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return productFailure("VALIDATION_ERROR", fieldErrors);
}

function rpcFailure(data: unknown): ProductFailure | null {
  const parsed = ProductRpcFailureSchema.safeParse(data);
  return parsed.success ? productFailure(parsed.data.code, undefined, parsed.data.traceId) : null;
}

export async function productRead<Input, Output>(rpc: string, schema: z.ZodType<Input>, output: z.ZodType<Output>, input: unknown, writable: boolean): Promise<ProductReadResult<Output>> {
  const authorization = await authorizeProducts(writable);
  if (!authorization.ok) return authorization;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const result = await authorization.client.rpc(rpc, { p_input: parsed.data });
    if (result.error) return transportFailure(result.error);
    const failure = rpcFailure(result.data);
    if (failure) return failure;
    const response = z.strictObject({ ok: z.literal(true), data: output }).safeParse(result.data);
    return response.success ? response.data : productFailure("INTERNAL_ERROR");
  } catch {
    return productFailure("INTERNAL_ERROR");
  }
}

// The signed client was independently authorized by the invoking action before input validation.
export async function productMutation<Input>(client: SessionClient, rpc: "stockos_create_product" | "stockos_update_product" | "stockos_archive_product" | "stockos_reactivate_product" | "stockos_record_stock_in" | "stockos_record_stock_out" | "stockos_record_opname" | "stockos_adjust_inventory_cost", schema: z.ZodType<Input>, input: unknown): Promise<ProductMutationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const result = await client.rpc(rpc, { p_input: parsed.data });
    if (result.error) return transportFailure(result.error);
    const failure = rpcFailure(result.data);
    if (failure) return failure;
    const response = ProductMutationSuccessSchema.safeParse(result.data);
    return response.success ? response.data : productFailure("INTERNAL_ERROR");
  } catch {
    return productFailure("INTERNAL_ERROR");
  }
}

export async function listProducts(input: unknown = {}, writable = false) {
  return productRead("stockos_list_products", ListProductsInputSchema, ProductsPageSchema, input, writable);
}
export async function getProduct(input: unknown, writable = false) {
  return productRead("stockos_get_product", GetProductInputSchema, ProductDtoSchema, input, writable);
}
export async function getProductHistory(input: unknown, writable = false) {
  return productRead("stockos_list_inventory_events", ProductHistoryInputSchema, ProductHistoryPageSchema, input, writable);
}
export async function getTextSuggestions(input: unknown, writable = false) {
  return productRead("stockos_text_suggestions", TextSuggestionsInputSchema, TextSuggestionsSchema, input, writable);
}
export async function getProductMetrics(input: unknown = {}, writable = false) {
  return productRead("stockos_product_metrics", ProductMetricsInputSchema, ProductMetricsSchema, input, writable);
}
