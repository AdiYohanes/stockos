import { z } from "zod";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = z.string().min(12).max(128);
export const OwnerSetupSchema = z.strictObject({
  setupCode: z.string().min(1).max(256),
  name: z.string().trim().min(1).max(120),
  email,
  shopName: z.string().trim().min(1).max(120),
  timezone: z.enum(["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"]),
});
export const OwnerResendSchema = OwnerSetupSchema.pick({ email: true, setupCode: true });
export const OwnerLoginSchema = z.strictObject({ email, password: z.string().min(1).max(128) });
export const OwnerRecoverySchema = z.strictObject({ email });
export const OwnerPasswordSchema = z.strictObject({ password, confirmPassword: password })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
export const OwnerSchema = z.strictObject({ id: z.uuid(), name: z.string(), email: z.email() });
