import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createProvisioningClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { OwnerSchema } from "./schemas";

export async function revokeSession(client: Awaited<ReturnType<typeof createSessionClient>>) {
  const session = await client.auth.getSession();
  if (session.error) throw new Error("Session unavailable");
  if (session.data.session) {
    const result = await client.auth.admin.signOut(session.data.session.access_token, "local");
    if (result.error) throw new Error("Session revocation failed");
  }
  // Provider revocation succeeded before SDK removes cookies; failed revocation keeps retry credentials.
  await client.auth.signOut({ scope: "local" });
}

export async function throttleAuth(bucket: "setup" | "resend" | "login") {
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

export async function getOwnerInvitation() {
  const client = await createSessionClient();
  const verified = await client.auth.getUser();
  if (verified.error || !verified.data.user?.email_confirmed_at) return null;
  const result = await client.rpc("stockos_owner_invitation");
  if (result.error) return null;
  return OwnerSchema.parse(result.data);
}
