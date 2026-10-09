"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createProvisioningClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { OwnerLoginSchema, OwnerPasswordSchema, OwnerResendSchema, OwnerSetupSchema } from "./schemas";
import { revokeSession, throttleAuth, validSetupCode } from "./server";
import type { OwnerAuthResult } from "./types";

const failure = (code: string): OwnerAuthResult => ({ ok: false, code });
const success = (state: "verification" | "login" | "authenticated"): OwnerAuthResult => ({ ok: true, state });

export async function registerOwner(input: unknown): Promise<OwnerAuthResult> {
  const parsed = OwnerSetupSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    if (!await throttleAuth("setup")) return failure("RATE_LIMITED");
    if (!validSetupCode(parsed.data.setupCode)) return failure("FORBIDDEN");
    const admin = createProvisioningClient();
    const { email, name, shopName, timezone } = parsed.data;
    const claim = await admin.rpc("stockos_claim_owner", { p_email: email, p_name: name, p_shop: shopName, p_timezone: timezone });
    if (claim.error) throw new Error("Owner claim failed");
    if (claim.data.state === "closed") return failure("SETUP_CLOSED");
    if (claim.data.state === "pending") return failure("SETUP_PENDING");
    if (claim.data.state === "claimed") {
      const invite = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: new URL("/auth/confirm", process.env.STOCKOS_APP_URL!).href,
        data: { stockos_attempt_id: claim.data.attemptId },
      });
      // ponytail: ambiguous provider failures retain claim; operator reconciliation precedes any release.
      if (invite.error) return failure("SETUP_PENDING");
    }
    const bound = await admin.rpc("stockos_reconcile_owner", { p_attempt: claim.data.attemptId });
    if (bound.error || !bound.data) return failure("SETUP_PENDING");
    return success("verification");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}

export async function resendOwnerConfirmation(input: unknown): Promise<OwnerAuthResult> {
  const parsed = OwnerResendSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    if (!await throttleAuth("resend")) return failure("RATE_LIMITED");
    if (!validSetupCode(parsed.data.setupCode)) return success("verification");
    const admin = createProvisioningClient();
    const pending = await admin.rpc("stockos_pending_owner", { p_email: parsed.data.email });
    if (pending.error) throw new Error("Pending owner lookup failed");
    if (pending.data) {
      const invite = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
        redirectTo: new URL("/auth/confirm", process.env.STOCKOS_APP_URL!).href,
      });
      if (invite.error) throw new Error("Invitation resend failed");
    }
    return success("verification");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}

export async function signIn(input: unknown): Promise<OwnerAuthResult> {
  const parsed = OwnerLoginSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    if (!await throttleAuth("login")) return failure("RATE_LIMITED");
    const client = await createSessionClient(true);
    const login = await client.auth.signInWithPassword(parsed.data);
    if (login.error) return failure("UNAUTHENTICATED");
    const verified = await client.auth.getUser();
    const owner = await client.rpc("stockos_owner_session");
    if (verified.error || !verified.data.user?.email_confirmed_at || owner.error) {
      await client.auth.signOut({ scope: "local" });
      return failure("UNAUTHENTICATED");
    }
    revalidatePath("/", "layout");
    return success("authenticated");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}

export async function completeOwnerPassword(input: unknown): Promise<OwnerAuthResult> {
  const parsed = OwnerPasswordSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    const client = await createSessionClient(true);
    const verified = await client.auth.getUser();
    const invitation = await client.rpc("stockos_owner_invitation");
    if (verified.error || invitation.error) return failure("UNAUTHENTICATED");
    const updated = await client.auth.updateUser({ password: parsed.data.password });
    if (updated.error) return failure("VALIDATION_ERROR");
    await revokeSession(client);
    revalidatePath("/", "layout");
    return success("login");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}

export async function signOut(): Promise<OwnerAuthResult> {
  try {
    const client = await createSessionClient(true);
    await revokeSession(client);
    revalidatePath("/", "layout");
    return success("login");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}
