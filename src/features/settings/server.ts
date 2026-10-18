import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { authorizeProducts, productRead } from "@/features/products/server";
import {
  GetShopSettingsInputSchema,
  ShopSettingsDtoSchema,
  UpdateShopSettingsInputSchema,
  SettingsMutationSuccessSchema,
  type SettingsMutationResult,
  type ShopSettingsReadResult,
} from "./schemas/settings-rpc.schema";
import {
  ProductRpcFailureSchema,
  type ProductErrorCode,
  type ProductFailure,
} from "@/features/products/schemas/product-rpc.schema";

const settingsMessages: Record<ProductErrorCode, string> = {
  VALIDATION_ERROR: "Periksa kembali data pengaturan yang dimasukkan.",
  UNAUTHENTICATED: "Sesi telah berakhir. Silakan masuk kembali.",
  EMAIL_UNVERIFIED: "Email pemilik belum diverifikasi.",
  FORBIDDEN: "Akun ini tidak memiliki hak akses mengubah pengaturan.",
  NOT_FOUND: "Data pengaturan toko tidak ditemukan.",
  SKU_EXISTS: "SKU sudah digunakan.",
  PRODUCT_ARCHIVED: "Produk diarsipkan.",
  PRODUCT_HAS_STOCK: "Produk masih memiliki stok.",
  IDENTITY_LOCKED: "Identitas terkunci.",
  INSUFFICIENT_STOCK: "Stok tidak mencukupi.",
  VERSION_CONFLICT: "Pengaturan telah diperbarui oleh sesi lain. Muat ulang dan periksa data terbaru sebelum menyimpan.",
  REQUEST_ID_CONFLICT: "ID permintaan telah digunakan untuk payload yang berbeda.",
  LIMIT_EXCEEDED: "Batas data terlampaui.",
  INTERNAL_ERROR: "Permintaan gagal dikonfirmasi. Coba lagi dengan ID permintaan yang sama.",
};

export function settingsFailure(
  code: ProductErrorCode,
  fieldErrors?: Record<string, string[]>,
  traceId: string = randomUUID()
): ProductFailure {
  return {
    ok: false,
    code,
    message: settingsMessages[code] || "Terjadi kesalahan.",
    traceId,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

function validationFailure(error: z.ZodError): ProductFailure {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || "form";
    (fieldErrors[field] ??= []).push(issue.message);
  }
  return settingsFailure("VALIDATION_ERROR", fieldErrors);
}

function transportFailure(error: { message: string; code?: string }): ProductFailure {
  if (error.code === "42501" && error.message === "UNAUTHENTICATED") return settingsFailure("UNAUTHENTICATED");
  if (error.code === "42501" && error.message === "EMAIL_UNVERIFIED") return settingsFailure("EMAIL_UNVERIFIED");
  if (error.code === "42501" && error.message === "FORBIDDEN") return settingsFailure("FORBIDDEN");
  return settingsFailure("INTERNAL_ERROR");
}

function rpcFailure(data: unknown): ProductFailure | null {
  const parsed = ProductRpcFailureSchema.safeParse(data);
  return parsed.success ? settingsFailure(parsed.data.code, undefined, parsed.data.traceId) : null;
}

export async function getShopSettings(
  input: unknown = {},
  writable = false
): Promise<ShopSettingsReadResult> {
  return productRead(
    "stockos_get_shop_settings",
    GetShopSettingsInputSchema,
    ShopSettingsDtoSchema,
    input,
    writable
  );
}

export async function updateShopSettings(input: unknown): Promise<SettingsMutationResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) return authorization;

  const parsed = UpdateShopSettingsInputSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const result = await authorization.client.rpc("stockos_update_shop_settings", {
      p_input: parsed.data,
    });
    if (result.error) return transportFailure(result.error);
    const failure = rpcFailure(result.data);
    if (failure) return failure;
    const response = SettingsMutationSuccessSchema.safeParse(result.data);
    return response.success ? response.data : settingsFailure("INTERNAL_ERROR");
  } catch {
    return settingsFailure("INTERNAL_ERROR");
  }
}
