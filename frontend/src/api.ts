// Simple typed API helper used across the frontend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  token?: string | null;
  body?: any;
  skipAuth?: boolean;
};

export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", token = null, body = null, skipAuth = false } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Automatically get token from localStorage if not provided and auth is not skipped
  let authToken = token;
  if (!authToken && !skipAuth) {
    authToken = localStorage.getItem("token");
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized - clear auth and redirect to login
  if (res.status === 401 && !skipAuth) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }

  // Try to parse JSON (some endpoints may respond with empty)
  let data;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error || data?.message || res.statusText || "Unknown error";
    throw new Error(message);
  }

  return data as T;
}

export default api;
