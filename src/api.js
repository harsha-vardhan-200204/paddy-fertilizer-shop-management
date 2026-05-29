const rawApiUrl = import.meta.env.VITE_API_URL || "";
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}/api${normalizedPath}`;
}

async function parseError(res, fallback) {
  const data = await res.json().catch(() => ({}));
  return new Error(data.message || fallback);
}

export async function login(credentials) {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: String(credentials.username || "").trim(),
      password: String(credentials.password || "").trim()
    })
  });

  if (!res.ok) {
    throw await parseError(res, "Login failed. Check that the API server is running.");
  }

  return res.json();
}

export function createApi(token, onUnauthorized) {
  async function request(path, options = {}) {
    const res = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    if (res.status === 401) onUnauthorized?.();

    if (!res.ok) {
      throw await parseError(res, "Request failed");
    }

    if (res.status === 204) return null;
    return res.json();
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" })
  };
}
