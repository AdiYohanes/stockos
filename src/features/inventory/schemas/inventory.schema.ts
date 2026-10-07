import { z } from "zod";

const MovementTypeSchema = z.enum(["in", "out"]);

const AdjustmentReasonSchema = z.enum([
  "cycle_count",
  "damaged_goods",
  "expired",
  "theft_loss",
  "supplier_return",
  "correction",
]);

export const RecordMovementSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  type: MovementTypeSchema,
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  reference: z.string().trim().min(1, "Reference is required"),
  note: z.string().optional(),
});

export const AdjustStockSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  newStock: z.number().int("New stock must be an integer").nonnegative("New stock must be non-negative"),
  reason: AdjustmentReasonSchema,
  reference: z.string().trim().min(1, "Reference is required"),
  note: z.string().optional(),
});
