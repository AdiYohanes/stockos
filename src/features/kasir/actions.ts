"use server";

import { revalidatePath } from "next/cache";
import { StockOutInputSchema } from "@/features/products/schemas/product-rpc.schema";
import { authorizeProducts, productMutation } from "@/features/products/server";
import { formatKasirReference, formatKasirAuditNote } from "./tally";
import type { CloseDailyRegisterResult } from "./types";

export interface CloseDailyRegisterServerInput {
  items: Array<{
    productId: string;
    name?: string;
    quantity: number;
  }>;
  expectedRevenue: number;
  actualCash?: number | null;
  note?: string | null;
}

export async function closeDailyRegisterAction(
  input: CloseDailyRegisterServerInput
): Promise<CloseDailyRegisterResult> {
  const authorization = await authorizeProducts(true);
  if (!authorization.ok) {
    return {
      ok: false,
      totalProductsDeducted: 0,
      totalUnitsDeducted: 0,
      expectedRevenue: input.expectedRevenue,
      reference: "",
      error: authorization.message,
    };
  }

  const validItems = input.items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    return {
      ok: false,
      totalProductsDeducted: 0,
      totalUnitsDeducted: 0,
      expectedRevenue: input.expectedRevenue,
      reference: "",
      error: "Tidak ada produk dengan jumlah laku lebih dari nol.",
    };
  }

  const now = new Date();
  const reference = formatKasirReference(now);
  const auditNote = formatKasirAuditNote(now, input.expectedRevenue, input.actualCash, input.note);

  let totalProductsDeducted = 0;
  let totalUnitsDeducted = 0;

  for (const item of validItems) {
    const mutation = await productMutation(
      authorization.client,
      "stockos_record_stock_out",
      StockOutInputSchema,
      {
        requestId: crypto.randomUUID(),
        productId: item.productId,
        quantity: item.quantity,
        reference,
        note: auditNote,
      }
    );

    if (!mutation.ok) {
      return {
        ok: false,
        totalProductsDeducted,
        totalUnitsDeducted,
        expectedRevenue: input.expectedRevenue,
        reference,
        error: `Gagal memotong stok untuk ${item.name || item.productId}: ${mutation.message}`,
      };
    }

    totalProductsDeducted += 1;
    totalUnitsDeducted += item.quantity;
  }

  // Revalidate cached paths across the app
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/reports");
  revalidatePath("/kasir");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return {
    ok: true,
    totalProductsDeducted,
    totalUnitsDeducted,
    expectedRevenue: input.expectedRevenue,
    reference,
  };
}
