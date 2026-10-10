"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createProvisioningClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { OwnerLoginSchema, OwnerPasswordSchema, OwnerRecoverySchema, OwnerResendSchema, OwnerSetupSchema } from "./schemas";
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

export async function requestPasswordReset(input: unknown): Promise<OwnerAuthResult> {
  const parsed = OwnerRecoverySchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    if (!await throttleAuth("recovery")) return failure("RATE_LIMITED");
    const admin = createProvisioningClient();
    const owner = await admin.rpc("stockos_recovery_owner_email", { p_email: parsed.data.email });
    if (owner.error) throw new Error("Recovery lookup unavailable");
    const healthy = await fetch(new URL("/auth/v1/health", process.env.SUPABASE_URL!), {
      headers: { apikey: process.env.SUPABASE_ANON_KEY! }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!healthy.ok) throw new Error("Recovery provider unavailable");
    const client = await createSessionClient();
    // Unknown/unbound addresses use the same transport without emailing another account.
    // Delivery errors occur only for matching accounts, so cannot change acknowledgement.
    // Shared infrastructure health above remains retryable; acknowledgement never proves delivery.
    await client.auth.resetPasswordForEmail(owner.data || `${randomUUID()}@example.invalid`, {
      redirectTo: new URL("/auth/confirm", process.env.STOCKOS_APP_URL!).href,
    }).catch(() => undefined);
    return success("verification");
  } catch {
    return { ok: false, code: "INTERNAL_ERROR", traceId: randomUUID() };
  }
}

async function completePassword(input: unknown, purpose: "invite" | "recovery"): Promise<OwnerAuthResult> {
  const parsed = OwnerPasswordSchema.safeParse(input);
  if (!parsed.success) return failure("VALIDATION_ERROR");
  try {
    const client = await createSessionClient(true);
    const verified = await client.auth.getUser();
    if (verified.error || !verified.data.user?.email_confirmed_at) return failure(purpose === "recovery" ? "RECOVERY_INCOMPLETE" : "UNAUTHENTICATED");
    const begun = await client.rpc("stockos_begin_password_completion", { p_purpose: purpose });
    if (begun.error) return failure(purpose === "recovery" ? "RECOVERY_INCOMPLETE" : "UNAUTHENTICATED");
    if (begun.data === "updating") return failure("RECOVERY_INCOMPLETE");
    if (begun.data !== "claimed" && begun.data !== "password_updated") return failure("UNAUTHENTICATED");
    if (begun.data === "claimed") {
      const session = await client.auth.getSession();
      if (session.error || !session.data.session) return failure("RECOVERY_INCOMPLETE");
      // getUser and the owner RPC verified this credential before its session identifier is read.
      const sessionId: unknown = JSON.parse(Buffer.from(session.data.session.access_token.split(".")[1], "base64url").toString("utf8")).session_id;
      if (typeof sessionId !== "string") return failure("RECOVERY_INCOMPLETE");
      const updated = await client.auth.updateUser({ password: parsed.data.password });
      const admin = createProvisioningClient();
      if (updated.error) {
        const rejected = updated.error.code === "same_password" || updated.error.code === "weak_password";
        if (rejected) {
          const released = await admin.rpc("stockos_finish_password_completion", {
            p_user: verified.data.user.id, p_session: sessionId, p_purpose: purpose, p_updated: false,
          });
          if (!released.error) return failure("VALIDATION_ERROR");
        }
        // ponytail: ambiguous provider writes require a fresh link; automatic reconciliation needs a business-access fence.
        return failure("RECOVERY_INCOMPLETE");
      }
      const marked = await admin.rpc("stockos_finish_password_completion", {
        p_user: verified.data.user.id, p_session: sessionId, p_purpose: purpose, p_updated: true,
      });
      if (marked.error) return failure("RECOVERY_INCOMPLETE");
    }
    try {
      await revokeSession(client, purpose === "recovery" ? "global" : "local");
    } catch {
      return failure("REVOCATION_FAILED");
    }
    revalidatePath("/", "layout");
    return success("login");
  } catch {
    return { ok: false, code: "RECOVERY_INCOMPLETE", traceId: randomUUID() };
  }
}

export async function completeOwnerPassword(input: unknown): Promise<OwnerAuthResult> {
  return completePassword(input, "invite");
}

export async function resetPassword(input: unknown): Promise<OwnerAuthResult> {
  return completePassword(input, "recovery");
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
