import { z } from "zod";
import {
  ProductDtoSchema,
  InventoryEventDtoSchema,
  ProductsPageSchema,
  ProductHistoryPageSchema,
  ProductMetricsSchema,
  StockInInputSchema,
  StockOutInputSchema,
  ListProductsInputSchema,
  GetProductInputSchema,
  type ProductDto,
  type InventoryEventDto,
  type ProductErrorCode,
  type ProductFailure,
  type ProductMutationResult,
  type ProductReadResult,
} from "@/features/products/schemas/product-rpc.schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable().optional();
const quantity = z.number().int().min(0).max(1_000_000_000);
const positiveQuantity = quantity.min(1);
const money = z.string().regex(/^[0-9]{1,13}$/).refine((value) => /^[0-9]{1,13}$/.test(value) && BigInt(value) <= BigInt("1000000000000"));
const revision = z.string().regex(/^[0-9]{1,19}$/).refine((value) => /^[0-9]{1,19}$/.test(value) && BigInt(value) <= BigInt("9223372036854775807"));
const eventKind = z.enum(["opening", "receipt", "sold", "opname", "cost_adjustment"]);

export const RecordOpnameInputSchema = z.strictObject({
  requestId: z.uuid(),
  productId: z.uuid(),
  expectedStockVersion: revision,
  countedQuantity: quantity,
  foundPurchaseTotal: money.optional(),
  note: nullableText(1000),
  correctionOfEventId: z.uuid().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.correctionOfEventId && !value.note) {
    ctx.addIssue({ code: "custom", path: ["note"], message: "Explanation is required for linked corrections." });
  }
});

export const AdjustCostInputSchema = z.strictObject({
  requestId: z.uuid(),
  productId: z.uuid(),
  expectedStockVersion: revision,
  replacementTotalCost: money,
  reason: text(1000),
  correctionOfEventId: z.uuid().optional().nullable(),
});

export const ListInventoryEventsInputSchema = z.strictObject({
  productId: z.uuid().optional(),
  kind: eventKind.optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  page: positiveQuantity.optional(),
  pageSize: positiveQuantity.max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.startDate === undefined && value.endDate === undefined) return;
  const days = value.startDate && value.endDate ? (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86_400_000 : 0;
  if (days <= 0 || days > 366) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Provide a date range of 1 to 366 days." });
});

export const InventoryEventsPageSchema = ProductHistoryPageSchema;
export type InventoryEventsPage = z.infer<typeof InventoryEventsPageSchema>;

export {
  ProductDtoSchema,
  InventoryEventDtoSchema,
  ProductsPageSchema,
  ProductHistoryPageSchema,
  ProductMetricsSchema,
  StockInInputSchema,
  StockOutInputSchema,
  ListProductsInputSchema,
  GetProductInputSchema,
  type ProductDto,
  type InventoryEventDto,
  type ProductErrorCode,
  type ProductFailure,
  type ProductMutationResult,
  type ProductReadResult,
};
