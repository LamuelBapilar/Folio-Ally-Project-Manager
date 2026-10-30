import { api } from "./api";

function saveSession(data) {
  localStorage.setItem("token", data.token);
  return data.user;
}

export async function register(name, email, password) {
  const data = await api("/register", {
    method: "POST",
    body: { name, email, password },
  });

  return saveSession(data);
}

export async function login(email, password) {
  const data = await api("/login", {
    method: "POST",
    body: { email, password },
  });

  return saveSession(data);
}

export async function logout() {
  try {
    // silent: an already-expired token must not announce "session expired" on the way out
    await api("/logout", { method: "POST", silent: true });
  } catch {
    // the token may already be invalid, we still clear it below
  } finally {
    localStorage.removeItem("token");
  }
}

export function getUser() {
  return api("/user");
}