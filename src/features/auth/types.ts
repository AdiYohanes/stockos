/**
 * Shared types for the authentication feature.
 */

export type AuthFormStatus = "idle" | "loading" | "error" | "success";

export interface AuthFormState {
  status: AuthFormStatus;
  message?: string;
}

export type OwnerUser = { id: string; name: string; email: string };
export type OwnerAuthResult =
  | { ok: true; state: "verification" | "login" | "authenticated" }
  | { ok: false; code: string; traceId?: string };
