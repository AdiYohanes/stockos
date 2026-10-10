import { z } from "zod";
import type { ProductReadResult } from "@/features/products/schemas/product-rpc.schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const quantity = z.number().int().min(0).max(1_000_000_000);
const money = z.string().regex(/^-?[0-9]+(\.[0-9]{1,6})?$/);
const timestamp = z.iso.datetime();

export const GetDashboardInputSchema = z.strictObject({}).default({});

export const DashboardMetricDtoSchema = z.strictObject({
  totalProducts: z.number().int().min(0),
  inStockCount: z.number().int().min(0),
  lowStockCount: z.number().int().min(0),
  outOfStockCount: z.number().int().min(0),
  potentialSellingValue: money,
  potentialGrossProfit: money,
  totalCostValue: money,
});

export const HealthDistributionDtoSchema = z.strictObject({
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  value: money,
});

export const InventoryHealthDtoSchema = z.strictObject({
  totalProducts: z.number().int().min(0),
  healthScore: z.number().int().min(0).max(100),
  healthy: HealthDistributionDtoSchema,
  lowStock: HealthDistributionDtoSchema,
  outOfStock: HealthDistributionDtoSchema,
});

export const AttentionItemDtoSchema = z.strictObject({
  id: z.string().uuid(),
  sku: text(64),
  name: text(120),
  category: text(120),
  currentStock: quantity,
  minStock: quantity,
  unit: text(30),
  status: z.enum(["out_of_stock", "low_stock"]),
  lastRestocked: timestamp.nullable(),
});

export const RecentEventDtoSchema = z.strictObject({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productSku: text(64),
  productName: text(120),
  kind: text(30),
  quantityDelta: z.number().int(),
  reference: text(120),
  recordedAt: timestamp,
});

export const MovementItemDtoSchema = z.strictObject({
  period: text(30),
  stockIn: z.number().int().min(0),
  stockOut: z.number().int().min(0),
});

export const MovementDataDtoSchema = z.strictObject({
  timeframe: z.enum(["7d", "30d"]),
  totalIn: z.number().int().min(0),
  totalOut: z.number().int().min(0),
  netChange: z.number().int(),
  data: z.array(MovementItemDtoSchema),
});

export const DashboardMovementsDtoSchema = z.strictObject({
  days7: MovementDataDtoSchema,
  days30: MovementDataDtoSchema,
});

export const DashboardDtoSchema = z.strictObject({
  metrics: DashboardMetricDtoSchema,
  health: InventoryHealthDtoSchema,
  attentionItems: z.array(AttentionItemDtoSchema),
  recentEvents: z.array(RecentEventDtoSchema),
  movements: DashboardMovementsDtoSchema,
  asOf: timestamp,
});

export type GetDashboardInput = z.infer<typeof GetDashboardInputSchema>;
export type DashboardMetricDto = z.infer<typeof DashboardMetricDtoSchema>;
export type InventoryHealthDto = z.infer<typeof InventoryHealthDtoSchema>;
export type AttentionItemDto = z.infer<typeof AttentionItemDtoSchema>;
export type RecentEventDto = z.infer<typeof RecentEventDtoSchema>;
export type MovementItemDto = z.infer<typeof MovementItemDtoSchema>;
export type MovementDataDto = z.infer<typeof MovementDataDtoSchema>;
export type DashboardMovementsDto = z.infer<typeof DashboardMovementsDtoSchema>;
export type DashboardDto = z.infer<typeof DashboardDtoSchema>;
export type DashboardReadResult = ProductReadResult<DashboardDto>;
