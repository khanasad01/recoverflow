export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "support" | "viewer" | string;
  is_active: boolean;
}

export const AUTH_TOKEN_KEY = "recoverflow_access_token";
export const AUTH_USER_KEY = "recoverflow_auth_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && (token.startsWith("mock_") || token.startsWith("demo_"))) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
  return token;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
