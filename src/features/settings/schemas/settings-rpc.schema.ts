import { z } from "zod";
import type { ProductFailure, ProductReadResult } from "@/features/products/schemas/product-rpc.schema";

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => text(max).nullable().optional();
const quantity = z.number().int().min(0).max(1_000_000_000);
const revision = z.string().regex(/^[0-9]{1,19}$/).refine((value) => /^[0-9]{1,19}$/.test(value) && BigInt(value) <= BigInt("9223372036854775807"));
const revisionInput = z.union([
  revision,
  z.number().int().positive().transform((val) => String(val)),
]);
const timestamp = z.iso.datetime();
export const timezoneEnum = z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]);

export const ShopSettingsDtoSchema = z.strictObject({
  name: text(120),
  ownerName: text(120),
  address: text(500).nullable(),
  phone: text(40).nullable(),
  timezone: timezoneEnum,
  defaultUnit: text(30),
  defaultMinStock: quantity,
  version: revision,
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const GetShopSettingsInputSchema = z.strictObject({});

export const UpdateShopSettingsInputSchema = z.strictObject({
  requestId: z.uuid(),
  expectedVersion: revisionInput,
  name: text(120),
  ownerName: text(120),
  address: nullableText(500),
  phone: nullableText(40),
  timezone: timezoneEnum,
  defaultUnit: text(30),
  defaultMinStock: quantity,
});

export const SettingsMutationDataSchema = z.strictObject({
  settings: ShopSettingsDtoSchema,
  administrativeEventId: z.uuid().nullable(),
});

export const SettingsMutationSuccessSchema = z.strictObject({
  ok: z.literal(true),
  requestId: z.uuid(),
  replayed: z.boolean(),
  data: SettingsMutationDataSchema,
});

export type ShopSettingsDto = z.infer<typeof ShopSettingsDtoSchema>;
export type UpdateShopSettingsInput = z.infer<typeof UpdateShopSettingsInputSchema>;
export type SettingsMutationSuccess = z.infer<typeof SettingsMutationSuccessSchema>;
export type SettingsMutationResult = SettingsMutationSuccess | ProductFailure;
export type ShopSettingsReadResult = ProductReadResult<ShopSettingsDto>;
