import { z } from "zod";
import type { ProductFailure } from "@/features/products/schemas/product-rpc.schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const timestamp = z.iso.datetime({ offset: true });

export const CategoryDtoSchema = z.strictObject({
  id: z.uuid(), name: text(120), productCount: z.number().int().nonnegative(),
  createdAt: timestamp, updatedAt: timestamp,
});
export const SupplierDtoSchema = z.strictObject({
  id: z.uuid(), name: text(120), phone: text(40).nullable(), notes: text(500).nullable(),
  productCount: z.number().int().nonnegative(),
  createdAt: timestamp, updatedAt: timestamp,
});

export const CreateCategoryInputSchema = z.strictObject({ requestId: z.uuid(), name: text(120) });
export const UpdateCategoryInputSchema = z.strictObject({ requestId: z.uuid(), id: z.uuid(), name: text(120) });
export const DeleteCategoryInputSchema = z.strictObject({ requestId: z.uuid(), id: z.uuid() });
export const ListTaxonomyInputSchema = z.strictObject({});

export const CreateSupplierInputSchema = z.strictObject({
  requestId: z.uuid(), name: text(120), phone: text(40).nullable().optional(), notes: text(500).nullable().optional(),
});
export const UpdateSupplierInputSchema = CreateSupplierInputSchema.extend({ id: z.uuid() });
export const DeleteSupplierInputSchema = DeleteCategoryInputSchema;

export const TaxonomyMutationSuccessSchema = z.strictObject({
  ok: z.literal(true), requestId: z.uuid(), replayed: z.boolean(),
  data: z.strictObject({ category: CategoryDtoSchema.nullable().optional(), supplier: SupplierDtoSchema.nullable().optional(), administrativeEventId: z.uuid() }),
});

export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
export type SupplierDto = z.infer<typeof SupplierDtoSchema>;
export type TaxonomyMutationSuccess = z.infer<typeof TaxonomyMutationSuccessSchema>;
export type TaxonomyMutationResult = TaxonomyMutationSuccess | ProductFailure;
export type TaxonomyErrorCode = ProductFailure["code"];
