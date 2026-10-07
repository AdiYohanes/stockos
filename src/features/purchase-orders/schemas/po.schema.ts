import { z } from "zod";

export const POStatusSchema = z.enum([
  "DRAFT",
  "ISSUED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);
export type POStatus = z.infer<typeof POStatusSchema>;

export const POLineItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  orderedQuantity: z.number().int().positive("Quantity must be greater than 0"),
  receivedQuantity: z.number().int().nonnegative().default(0),
  unitCost: z.number().nonnegative("Unit cost cannot be negative"),
});
export type POLineItem = z.infer<typeof POLineItemSchema>;

export const POReceiptItemSchema = z.object({
  sku: z.string(),
  productName: z.string(),
  quantityReceived: z.number().int().positive(),
});
export type POReceiptItem = z.infer<typeof POReceiptItemSchema>;

export const POReceiptLogSchema = z.object({
  id: z.string(),
  poId: z.string(),
  receivedAt: z.string(),
  warehouseId: z.string(),
  warehouseName: z.string(),
  items: z.array(POReceiptItemSchema),
  notes: z.string().optional(),
});
export type POReceiptLog = z.infer<typeof POReceiptLogSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string(),
  poNumber: z.string().min(1),
  supplierId: z.string().min(1, "Supplier is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierTier: z.string(),
  destinationWarehouseId: z.string().min(1, "Warehouse is required"),
  destinationWarehouseName: z.string().min(1, "Warehouse name is required"),
  status: POStatusSchema,
  orderDate: z.string(),
  expectedDeliveryDate: z.string().min(1, "Expected delivery date is required"),
  totalCost: z.number().nonnegative(),
  lineItems: z.array(POLineItemSchema).min(1, "At least one item is required"),
  receipts: z.array(POReceiptLogSchema).default([]),
  notes: z.string().optional(),
});
// ponytail: inferred type equals former interface PurchaseOrder, upgrade when backend DTO differs
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const POLineItemInputSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  orderedQuantity: z.number().int().positive("Must be at least 1"),
  unitCost: z.number().nonnegative("Cost cannot be negative"),
});
export type POLineItemInput = z.infer<typeof POLineItemInputSchema>;

export const CreatePOFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  destinationWarehouseId: z.string().min(1, "Destination warehouse is required"),
  expectedDeliveryDate: z.string().min(1, "Expected delivery date is required"),
  notes: z.string().optional(),
  lineItems: z.array(POLineItemInputSchema).min(1, "At least one line item is required"),
});
export type CreatePOFormData = z.infer<typeof CreatePOFormSchema>;
