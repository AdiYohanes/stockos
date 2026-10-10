import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable().optional();
const quantity = z.number().int().min(0).max(1_000_000_000);
const positiveQuantity = quantity.min(1);
const money = z.string().regex(/^[0-9]{1,13}$/).refine((value) => /^[0-9]{1,13}$/.test(value) && BigInt(value) <= BigInt("1000000000000"));
const revision = z.string().regex(/^[0-9]{1,19}$/).refine((value) => /^[0-9]{1,19}$/.test(value) && BigInt(value) <= BigInt("9223372036854775807"));
const decimal = z.string().max(40).regex(/^[0-9]+(?:\.[0-9]{1,6})?$/);
const signedDecimal = z.string().max(41).regex(/^-?[0-9]+(?:\.[0-9]{1,6})?$/);
const sku = text(64).toUpperCase().pipe(z.string().regex(/^[A-Z0-9_./-]{3,64}$/));
const timestamp = z.iso.datetime();
const archive = z.enum(["active", "archived", "all"]);
const stockStatus = z.enum(["in_stock", "low_stock", "out_of_stock"]);
const eventKind = z.enum(["opening", "receipt", "sold", "opname", "cost_adjustment"]);
const metadata = {
  sku, name: text(120), category: text(120), unit: text(30), sellingPrice: money,
  minStock: quantity, supplier: nullableText(120), shelfLocation: nullableText(80),
  barcode: nullableText(64), description: nullableText(2000),
};

function checkCartons(value: { cartonCount?: number; unitsPerCarton?: number }, units: number, ctx: z.RefinementCtx) {
  if (value.cartonCount === undefined && value.unitsPerCarton === undefined) return;
  if (value.cartonCount === undefined || value.unitsPerCarton === undefined || value.cartonCount * value.unitsPerCarton !== units) {
    ctx.addIssue({ code: "custom", path: ["cartonCount"], message: "Carton quantities must match base-unit quantity." });
  }
}

export const CreateProductInputSchema = z.strictObject({
  requestId: z.uuid(), ...metadata, openingQuantity: quantity.optional(), purchaseTotal: money.optional(),
  cartonCount: positiveQuantity.optional(), unitsPerCarton: positiveQuantity.optional(),
}).superRefine((value, ctx) => {
  const units = value.openingQuantity ?? 0;
  if ((units > 0 && value.purchaseTotal === undefined) || (units === 0 && value.purchaseTotal !== undefined && !/^0+$/.test(value.purchaseTotal))) {
    ctx.addIssue({ code: "custom", path: ["purchaseTotal"], message: "Purchase total required for opening stock; zero stock requires zero cost." });
  }
  checkCartons(value, units, ctx);
});
export const UpdateProductInputSchema = z.strictObject({
  requestId: z.uuid(), productId: z.uuid(), expectedMetadataVersion: revision,
  patch: z.strictObject(metadata).partial().refine((value) => Object.values(value).some((field) => field !== undefined), "Provide a metadata change."),
});
export const ReactivateProductInputSchema = z.strictObject({
  requestId: z.uuid(), productId: z.uuid(), expectedMetadataVersion: revision,
});
export const ArchiveProductInputSchema = ReactivateProductInputSchema.extend({ expectedStockVersion: revision });
export const StockOutInputSchema = z.strictObject({
  requestId: z.uuid(), productId: z.uuid(), quantity: positiveQuantity,
  reference: nullableText(120), note: nullableText(1000),
});
export const StockInInputSchema = StockOutInputSchema.extend({
  purchaseTotal: money, cartonCount: positiveQuantity.optional(), unitsPerCarton: positiveQuantity.optional(),
}).superRefine((value, ctx) => checkCartons(value, value.quantity, ctx));
export const ListProductsInputSchema = z.strictObject({
  search: z.string().trim().max(120).optional(), category: nullableText(120),
  health: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).optional(), archive: archive.optional(),
  sort: z.enum(["name", "sku", "currentStock", "sellingPrice", "createdAt"]).optional(),
  direction: z.enum(["asc", "desc"]).optional(), page: positiveQuantity.optional(), pageSize: positiveQuantity.max(100).optional(),
});
export const GetProductInputSchema = z.strictObject({ id: z.uuid() });
export const ProductHistoryInputSchema = z.strictObject({
  productId: z.uuid(), kind: eventKind.optional(), startDate: z.iso.date().optional(), endDate: z.iso.date().optional(),
  page: positiveQuantity.optional(), pageSize: positiveQuantity.max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.startDate === undefined && value.endDate === undefined) return;
  const days = value.startDate && value.endDate ? (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86_400_000 : 0;
  if (days <= 0 || days > 366) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Provide a date range of 1 to 366 days." });
});
export const TextSuggestionsInputSchema = z.strictObject({ kind: z.enum(["category", "supplier"]), prefix: z.string().trim().max(120).optional() });
export const ProductMetricsInputSchema = z.strictObject({ archive: archive.optional() });

export const ProductDtoSchema = z.strictObject({
  id: z.uuid(), sku: z.string().regex(/^[A-Z0-9_./-]{3,64}$/), name: text(120), category: text(120), unit: text(30),
  supplier: text(120).nullable(), shelfLocation: text(80).nullable(), barcode: text(64).nullable(), description: text(2000).nullable(),
  sellingPrice: money, minStock: quantity, currentStock: quantity, inventoryCostValue: decimal,
  averagePurchaseCost: decimal.nullable(), potentialSellingValue: decimal, potentialGrossProfit: signedDecimal,
  stockStatus, archivedAt: timestamp.nullable(), metadataVersion: revision, stockVersion: revision,
  createdAt: timestamp, updatedAt: timestamp,
});
export const InventoryEventDtoSchema = z.strictObject({
  id: z.uuid(), productId: z.uuid(), kind: eventKind, stockVersion: revision,
  quantityBefore: quantity, quantityAfter: quantity, quantityDelta: z.number().int().min(-1_000_000_000).max(1_000_000_000),
  costBefore: decimal, costAfter: decimal, costDelta: signedDecimal, purchaseTotal: decimal.nullable(),
  countedQuantity: quantity.nullable(), cartonCount: positiveQuantity.nullable(), unitsPerCarton: positiveQuantity.nullable(),
  reference: text(120).nullable(), note: text(1000).nullable(), correctionOfEventId: z.uuid().nullable(),
  skuSnapshot: text(64), nameSnapshot: text(120), unitSnapshot: text(30), supplierSnapshot: text(120).nullable(),
  sellingPriceSnapshot: money, actorDisplay: text(120), recordedAt: timestamp,
});
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const pagination = { total: count, page: positiveQuantity, pageSize: positiveQuantity.max(100) };
export const ProductsPageSchema = z.strictObject({ items: z.array(ProductDtoSchema).max(100), ...pagination });
export const ProductHistoryPageSchema = z.strictObject({ items: z.array(InventoryEventDtoSchema).max(100), ...pagination });
export const ProductMetricsSchema = z.strictObject({ totalProducts: count, inStockCount: count, lowStockCount: count, outOfStockCount: count, totalValuation: decimal });
export const TextSuggestionsSchema = z.array(text(120)).max(30);
export const ProductMutationDataSchema = z.strictObject({ product: ProductDtoSchema, eventId: z.uuid().nullable(), administrativeEventId: z.uuid().nullable() });
export const ProductErrorCodeSchema = z.enum([
  "VALIDATION_ERROR", "UNAUTHENTICATED", "EMAIL_UNVERIFIED", "FORBIDDEN", "NOT_FOUND", "SKU_EXISTS",
  "PRODUCT_ARCHIVED", "PRODUCT_HAS_STOCK", "IDENTITY_LOCKED", "INSUFFICIENT_STOCK", "VERSION_CONFLICT",
  "REQUEST_ID_CONFLICT", "LIMIT_EXCEEDED", "INTERNAL_ERROR",
]);
export const ProductRpcFailureSchema = z.strictObject({
  ok: z.literal(false), code: ProductErrorCodeSchema, message: z.string(), traceId: z.uuid().optional(),
});
export const ProductMutationSuccessSchema = z.strictObject({
  ok: z.literal(true), requestId: z.uuid(), replayed: z.boolean(), data: ProductMutationDataSchema,
});

export type ProductDto = z.infer<typeof ProductDtoSchema>;
export type InventoryEventDto = z.infer<typeof InventoryEventDtoSchema>;
export type ProductsPage = z.infer<typeof ProductsPageSchema>;
export type ProductHistoryPage = z.infer<typeof ProductHistoryPageSchema>;
export type ProductMetrics = z.infer<typeof ProductMetricsSchema>;
export type ProductErrorCode = z.infer<typeof ProductErrorCodeSchema>;
export type ProductFailure = { ok: false; code: ProductErrorCode; message: string; fieldErrors?: Record<string, string[]>; traceId: string };
export type ProductReadResult<T> = { ok: true; data: T } | ProductFailure;
export type ProductMutationResult = z.infer<typeof ProductMutationSuccessSchema> | ProductFailure;
export type CreateProductInput = z.input<typeof CreateProductInputSchema>;
export type UpdateProductInput = z.input<typeof UpdateProductInputSchema>;
export type ArchiveProductInput = z.input<typeof ArchiveProductInputSchema>;
export type ReactivateProductInput = z.input<typeof ReactivateProductInputSchema>;
export type StockInInput = z.input<typeof StockInInputSchema>;
export type StockOutInput = z.input<typeof StockOutInputSchema>;
export type ListProductsInput = z.input<typeof ListProductsInputSchema>;
export type ProductHistoryInput = z.input<typeof ProductHistoryInputSchema>;
export type TextSuggestionsInput = z.input<typeof TextSuggestionsInputSchema>;
export type ProductMetricsInput = z.input<typeof ProductMetricsInputSchema>;
