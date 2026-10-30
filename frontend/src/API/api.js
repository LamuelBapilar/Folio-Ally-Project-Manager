const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// silent: skip the "session expired" handling (used when logging out)
export async function api(path, { method = "GET", body, silent = false } = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API}/api${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    // a saved token that no longer works (expired or revoked): end the session
    if (response.status === 401 && token && !silent) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-expired"));
    }

    const error = new Error(data?.message ?? "Request failed");
    error.status = response.status;
    error.errors = data?.errors;
    error.retryAfter = data?.retry_after;
    throw error;
  }

  return data;
}

export function parseError(err) {
  // too many requests
  if (err.status === 429) {
    return {
      fields: {},
      form: "Too many attempts. Please wait a moment and try again.",
      retryAfter: err.retryAfter ?? 60,
    };
  }

  // Laravel validation errors: { email: ["..."], password: ["..."] }
  if (err.errors) {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([key, messages]) => [key, messages[0]])
    );
    return { fields, form: "" };
  }

  // Laravel answered, but with an error like 401
  if (err.status) {
    return { fields: {}, form: err.message };
  }

  // No answer at all
  return { fields: {}, form: "Cannot reach the server. Is Laravel running?" };
}