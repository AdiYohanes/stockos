import { z } from "zod";

export const ValuationReportInputSchema = z.strictObject({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
});
export type ValuationReportInput = z.infer<typeof ValuationReportInputSchema>;

export const CategoryValuationDtoSchema = z.strictObject({
  categoryName: z.string(),
  itemCount: z.number().int().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  totalCost: z.string(),
  totalRetailValue: z.string(),
  grossMargin: z.string(),
  marginPercent: z.string(),
  ratioPercent: z.string(),
});
export type CategoryValuationDto = z.infer<typeof CategoryValuationDtoSchema>;

export const TotalValuationDtoSchema = z.strictObject({
  totalSKUs: z.number().int().nonnegative(),
  totalUnits: z.number().int().nonnegative(),
  totalCost: z.string(),
  totalValuation: z.string(),
  grossMargin: z.string(),
  marginPercent: z.string(),
  asOf: z.string(),
});
export type TotalValuationDto = z.infer<typeof TotalValuationDtoSchema>;

export const ValuationReportDtoSchema = z.strictObject({
  total: TotalValuationDtoSchema,
  categories: z.array(CategoryValuationDtoSchema),
});
export type ValuationReportDto = z.infer<typeof ValuationReportDtoSchema>;

export const MovementReportInputSchema = z.strictObject({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().trim().max(120).optional(),
  productId: z.string().uuid().optional(),
});
export type MovementReportInput = z.infer<typeof MovementReportInputSchema>;

export const MovementSummaryDtoSchema = z.strictObject({
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string(),
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

export const MovementReportDtoSchema = z.strictObject({
  summary: MovementSummaryDtoSchema,
  items: z.array(MovementItemDtoSchema),
  trends: z.array(MovementTrendPointDtoSchema),
});
export type MovementReportDto = z.infer<typeof MovementReportDtoSchema>;

export const LowStockReportInputSchema = z.strictObject({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
});
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
  sellingPrice: z.string(),
  inventoryCostValue: z.string(),
  averagePurchaseCost: z.string().nullable(),
});
export type LowStockItemDto = z.infer<typeof LowStockItemDtoSchema>;

export const LowStockReportDtoSchema = z.strictObject({
  summary: LowStockSummaryDtoSchema,
  items: z.array(LowStockItemDtoSchema),
});
export type LowStockReportDto = z.infer<typeof LowStockReportDtoSchema>;

export const ExportReportInputSchema = z.strictObject({
  kind: z.enum(["valuation", "movements", "low_stock"]),
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
