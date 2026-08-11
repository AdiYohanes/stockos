import type { MockAuthState, MockCredentials, MockUser } from "./types";

/**
 * Expected mock credentials for frontend development.
 * Kept isolated for easy replacement when real auth is integrated.
 */
export const MOCK_CREDENTIALS: MockCredentials = {
  email: "demo@stockos.com",
  password: "demo123",
};

/**
 * Mock user returned when authentication succeeds.
 */
export const MOCK_USER: MockUser = {
  id: "usr_mock_01",
  name: "Demo User",
  email: "demo@stockos.com",
  role: "admin",
};

/**
 * Name of the development auth cookie used to simulate session state.
 */
export const AUTH_COOKIE_NAME = "stockos_mock_auth";

/**
 * Returns the current mock authentication state.
 *
 * Checks the mock auth cookie on the server (via next/headers) or in the browser.
 * NOTE: Strictly for frontend development. Replace with real session validation later.
 */
export async function getMockAuthState(): Promise<MockAuthState> {
  if (typeof window === "undefined") {
    // Server-side: read cookies via next/headers
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

      if (authCookie?.value === "true") {
        return {
          isAuthenticated: true,
          user: MOCK_USER,
        };
      }
    } catch {
      // Fallback if accessed outside request context
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    return {
      isAuthenticated: false,
      user: null,
    };
  }

  // Client-side fallback
  const isAuth = document.cookie.includes(`${AUTH_COOKIE_NAME}=true`);
  return {
    isAuthenticated: isAuth,
    user: isAuth ? MOCK_USER : null,
  };
}

/**
 * Client helper to validate mock credentials and set the dev auth cookie.
 */
export function loginMockUser(credentials: MockCredentials): {
  success: boolean;
  message?: string;
} {
  const isEmailValid =
    credentials.email.trim().toLowerCase() === MOCK_CREDENTIALS.email.toLowerCase();
  const isPasswordValid = credentials.password === MOCK_CREDENTIALS.password;

  if (isEmailValid && isPasswordValid) {
    if (typeof document !== "undefined") {
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=86400; SameSite=Lax`;
    }
    return { success: true };
  }

  return {
    success: false,
    message: "Invalid email or password",
  };
}

/**
 * Client helper to clear the dev auth cookie.
 */
export function logoutMockUser(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}
