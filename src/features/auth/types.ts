/**
 * Shared types for the authentication feature.
 */

export type AuthFormStatus = "idle" | "loading" | "error" | "success";

export interface AuthFormState {
  status: AuthFormStatus;
  message?: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface MockCredentials {
  email: string;
  password: string;
}

export interface MockAuthState {
  isAuthenticated: boolean;
  user: MockUser | null;
}
