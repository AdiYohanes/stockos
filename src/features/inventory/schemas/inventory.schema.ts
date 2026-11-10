import { z } from "zod";

export const MovementTypeSchema = z.enum(["in", "out"]);
export type MovementTypeAction = z.infer<typeof MovementTypeSchema>;

export const AdjustmentReasonSchema = z.enum([
  "cycle_count",
  "damaged_goods",
  "expired",
  "theft_loss",
  "supplier_return",
  "correction",
]);
export type AdjustmentReasonType = z.infer<typeof AdjustmentReasonSchema>;

export const RecordMovementInputSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  type: MovementTypeSchema,
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  reference: z.string().trim().min(1, "Reference is required"),
  note: z.string().optional(),
});
export const RecordMovementSchema = RecordMovementInputSchema;
export type RecordMovementInput = z.infer<typeof RecordMovementInputSchema>;

export const AdjustStockInputSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  newStock: z.number().int("New stock must be an integer").nonnegative("New stock must be non-negative"),
  reason: AdjustmentReasonSchema,
  reference: z.string().trim().min(1, "Reference is required"),
  note: z.string().optional(),
});
export const AdjustStockSchema = AdjustStockInputSchema;
export type AdjustStockInput = z.infer<typeof AdjustStockInputSchema>;
