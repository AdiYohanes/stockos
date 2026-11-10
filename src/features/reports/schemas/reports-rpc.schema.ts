import { z } from "zod";

const filters = { search: z.string().trim().max(120).optional(), category: z.string().trim().min(1).max(120).optional() };
const pagination = { page: z.number().int().min(1).max(1_000_000_000).default(1), pageSize: z.number().int().min(1).max(100).default(25) };
const money = z.string().regex(/^-?\d+(?:\.\d{1,6})?$/);
const timezone = z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]);
function reportInput<T extends z.ZodRawShape>(shape: T) {
  return z.discriminatedUnion("mode", [
    z.strictObject({ ...shape, mode: z.literal("screen"), ...pagination }),
    z.strictObject({ ...shape, mode: z.literal("summary") }),
    z.strictObject({ ...shape, mode: z.literal("export") }),
  ]);
}

export const ValuationReportInputSchema = reportInput(filters);
export type ValuationReportInput = z.infer<typeof ValuationReportInputSchema>;

export const CategoryValuationDtoSchema = z.strictObject({
  categoryName: z.string(),
  itemCount: z.number().int().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  totalCost: money,
  totalRetailValue: money,
  grossMargin: money,
  marginPercent: z.string(),
  ratioPercent: z.string(),
});
export type CategoryValuationDto = z.infer<typeof CategoryValuationDtoSchema>;

export const TotalValuationDtoSchema = z.strictObject({
  totalSKUs: z.number().int().nonnegative(),
  totalUnits: z.number().int().nonnegative(),
  totalCost: money,
  totalValuation: money,
  grossMargin: money,
  marginPercent: z.string(),
  asOf: z.string(),
});
export type TotalValuationDto = z.infer<typeof TotalValuationDtoSchema>;

export const ValuationReportDtoSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("screen"), total: TotalValuationDtoSchema, categories: z.array(CategoryValuationDtoSchema).max(100), count: z.number().int().nonnegative(), ...pagination }),
  z.strictObject({ mode: z.literal("summary"), total: TotalValuationDtoSchema }),
  z.strictObject({ mode: z.literal("export"), total: TotalValuationDtoSchema, categories: z.array(CategoryValuationDtoSchema).max(10_000), count: z.number().int().nonnegative() }),
]);
export type ValuationReportDto = z.infer<typeof ValuationReportDtoSchema>;

export const MovementReportInputSchema = reportInput({
  ...filters,
  expectedTimezone: timezone,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().trim().max(120).optional(),
  productId: z.string().uuid().optional(),
});
export type MovementReportInput = z.infer<typeof MovementReportInputSchema>;

export const MovementSummaryDtoSchema = z.strictObject({
  startDate: z.string(),
  endDate: z.string(),
  timezone,
  totalOpeningQty: z.number().int().nonnegative(),
  totalStockInQty: z.number().int().nonnegative(),
  totalStockOutQty: z.number().int().nonnegative(),
  totalOpnameDelta: z.number().int(),
  totalOpnameCount: z.number().int().nonnegative(),
  totalCostAdjustmentCount: z.number().int().nonnegative(),
  distinctProductsCount: z.number().int().nonnegative(),
  totalEventsCount: z.number().int().nonnegative(),
});
export type MovementSummaryDto = z.infer<typeof MovementSummaryDtoSchema>;

export const MovementItemDtoSchema = z.strictObject({
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  currentStock: z.number().int().nonnegative(),
  openingQty: z.number().int().nonnegative(),
  stockInQty: z.number().int().nonnegative(),
  stockOutQty: z.number().int().nonnegative(),
  opnameDelta: z.number().int(),
  opnameCount: z.number().int().nonnegative(),
  costAdjustmentCount: z.number().int().nonnegative(),
  lastMovementDate: z.string().nullable(),
});
export type MovementItemDto = z.infer<typeof MovementItemDtoSchema>;

export const MovementTrendPointDtoSchema = z.strictObject({
  date: z.string(),
  stockIn: z.number().int().nonnegative(),
  stockOut: z.number().int().nonnegative(),
  netFlow: z.number().int(),
});
export type MovementTrendPointDto = z.infer<typeof MovementTrendPointDtoSchema>;

export const MovementReportDtoSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("screen"), summary: MovementSummaryDtoSchema, items: z.array(MovementItemDtoSchema).max(100), trends: z.array(MovementTrendPointDtoSchema).max(366), count: z.number().int().nonnegative(), ...pagination }),
  z.strictObject({ mode: z.literal("summary"), summary: MovementSummaryDtoSchema }),
  z.strictObject({ mode: z.literal("export"), summary: MovementSummaryDtoSchema, items: z.array(MovementItemDtoSchema).max(10_000), count: z.number().int().nonnegative() }),
]);
export type MovementReportDto = z.infer<typeof MovementReportDtoSchema>;

export const LowStockReportInputSchema = reportInput(filters);
export type LowStockReportInput = z.infer<typeof LowStockReportInputSchema>;

export const LowStockSummaryDtoSchema = z.strictObject({
  totalAlerts: z.number().int().nonnegative(),
  outOfStockCount: z.number().int().nonnegative(),
  lowStockCount: z.number().int().nonnegative(),
  totalDeficit: z.number().int().nonnegative(),
});
export type LowStockSummaryDto = z.infer<typeof LowStockSummaryDtoSchema>;

export const LowStockItemDtoSchema = z.strictObject({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  supplier: z.string().nullable(),
  shelfLocation: z.string().nullable(),
  currentStock: z.number().int().nonnegative(),
  minStock: z.number().int().nonnegative(),
  stockStatus: z.enum(["out_of_stock", "low_stock"]),
  deficit: z.number().int().nonnegative(),
  sellingPrice: money,
  inventoryCostValue: money,
  averagePurchaseCost: money.nullable(),
});
export type LowStockItemDto = z.infer<typeof LowStockItemDtoSchema>;

export const LowStockReportDtoSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("screen"), summary: LowStockSummaryDtoSchema, items: z.array(LowStockItemDtoSchema).max(100), count: z.number().int().nonnegative(), ...pagination }),
  z.strictObject({ mode: z.literal("summary"), summary: LowStockSummaryDtoSchema }),
  z.strictObject({ mode: z.literal("export"), summary: LowStockSummaryDtoSchema, items: z.array(LowStockItemDtoSchema).max(10_000), count: z.number().int().nonnegative() }),
]);
export type LowStockReportDto = z.infer<typeof LowStockReportDtoSchema>;

export const ExportReportInputSchema = z.strictObject({
  kind: z.enum(["valuation", "movements", "low_stock"]),
  timeframe: z.enum(["7d", "30d", "90d", "12m"]).optional(),
  expectedTimezone: timezone.optional(),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type ExportReportInput = z.infer<typeof ExportReportInputSchema>;

export const ExportReportResultSchema = z.strictObject({
  filename: z.string(),
  content: z.string(),
  mimeType: z.literal("text/csv;charset=utf-8"),
  rowCount: z.number().int().nonnegative(),
});
export type ExportReportResult = z.infer<typeof ExportReportResultSchema>;
