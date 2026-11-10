/**
 * Shared types for the authentication feature.
 */

export type OwnerUser = { id: string; name: string; email: string };
export type OwnerAuthResult =
  | { ok: true; state: "verification" | "login" | "authenticated" }
  | { ok: false; code: string; traceId?: string };
