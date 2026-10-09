import { z } from "zod";

export const ProductStatusSchema = z.enum([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "draft",
]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductCategorySchema = z.enum([
  "Electronics",
  "Mechanical",
  "Structural",
  "Motors",
  "Power",
  "Consumables",
  "Cables & Adapters",
  "3D Printing",
  "Fasteners",
  "Tools",
  "Sensors",
]);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductMovementLogSchema = z.object({
  id: z.string(),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number(),
  reference: z.string(),
  timestamp: z.string(),
  performedBy: z.string(),
  note: z.string().optional(),
});
export type ProductMovementLog = z.infer<typeof ProductMovementLogSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  currentStock: z.number().int().nonnegative("Current stock cannot be negative"),
  minStock: z.number().int().nonnegative("Min threshold cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  status: ProductStatusSchema,
  barcode: z.string().optional(),
  supplier: z.string().min(1, "Supplier is required"),
  cartons: z.number().int().nonnegative().optional(),
  totalPurchasePrice: z.number().nonnegative().optional(),
  unitPurchasePrice: z.number().nonnegative().optional(),
  description: z.string().optional(),
  lastRestocked: z.string().optional(),
  createdAt: z.string(),
  movementLogs: z.array(ProductMovementLogSchema).optional(),
});
// ponytail: inferred type equals former interface Product, upgrade when backend DTO differs
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  initialStock: z.number().int().nonnegative("Initial stock cannot be negative"),
  minStock: z.number().int().nonnegative("Min threshold cannot be negative"),
  supplier: z.string().min(1, "Supplier is required"),
  cartons: z.number().int().nonnegative().optional(),
  totalPurchasePrice: z.number().nonnegative().optional(),
  unitPurchasePrice: z.number().nonnegative().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const EditProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  minStock: z.number().int().nonnegative("Min threshold cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  supplier: z.string().min(1, "Supplier is required"),
  barcode: z.string().optional(),
  description: z.string().optional(),
});
export type EditProductInput = z.infer<typeof EditProductInputSchema>;
