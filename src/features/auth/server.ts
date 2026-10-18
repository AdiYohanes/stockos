import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createProvisioningClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { OwnerSchema } from "./schemas";

export async function revokeSession(client: Awaited<ReturnType<typeof createSessionClient>>, scope: "local" | "global" = "local") {
  const session = await client.auth.getSession();
  if (session.error) throw new Error("Session unavailable");
  if (session.data.session) {
    const result = await client.auth.admin.signOut(session.data.session.access_token, scope);
    if (result.error) throw new Error("Session revocation failed");
  }
  // Provider revocation succeeded before SDK removes cookies; failed revocation keeps retry credentials.
  const cleared = await client.auth.signOut({ scope: "local" });
  if (cleared.error) throw new Error("Session cleanup failed");
}

export async function throttleAuth(bucket: "setup" | "resend" | "login" | "recovery") {
  const result = await createProvisioningClient().rpc("stockos_auth_throttle", {
    p_bucket: bucket, p_limit: bucket === "login" ? 30 : 10, p_seconds: 300,
  });
  if (result.error) throw new Error("Auth throttle unavailable");
  return result.data === true;
}

export function validSetupCode(value: string) {
  const expected = process.env.STOCKOS_SETUP_SECRET;
  if (!expected || expected.length < 32) throw new Error("Setup secret unavailable");
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(value), digest(expected));
}

export async function getOwnerSession() {
  const client = await createSessionClient();
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.email_confirmed_at) return null;
  const result = await client.rpc("stockos_owner_session");
  if (result.error) return null;
  return OwnerSchema.parse(result.data);
}

export async function verifyPasswordPurpose(token: string, purpose: "invite" | "recovery") {
  const client = await createSessionClient(true);
  try {
    const verified = await client.auth.verifyOtp({ token_hash: token, type: purpose });
    if (verified.error || !verified.data.session) return false;
    const user = await client.auth.getUser();
    if (!user.error && user.data.user?.email_confirmed_at) {
      const sessionId: unknown = JSON.parse(Buffer.from(verified.data.session.access_token.split(".")[1], "base64url").toString("utf8")).session_id;
      const registered = typeof sessionId === "string" ? await createProvisioningClient().rpc("stockos_register_password_purpose", {
        p_user: user.data.user.id, p_session: sessionId, p_purpose: purpose,
      }) : null;
      if (registered && !registered.error && registered.data === true) return true;
    }
  } catch {
    // Failed verification never grants completion or business access.
  }
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return false;
}

export async function getOwnerRecovery() {
  const client = await createSessionClient();
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.email_confirmed_at) return null;
  const result = await client.rpc("stockos_owner_recovery");
  if (result.error) return null;
  return OwnerSchema.parse(result.data);
}

export async function getOwnerInvitation() {
  const client = await createSessionClient();
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.email_confirmed_at) return null;
  const result = await client.rpc("stockos_owner_invitation");
  if (result.error) return null;
  return OwnerSchema.parse(result.data);
}
