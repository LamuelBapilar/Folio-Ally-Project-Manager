import { api } from "./api";

export const updateProfile = (name) =>
  api("/account/profile", { method: "PATCH", body: { name } });

export const changePassword = (current_password, password) =>
  api("/account/password", { method: "PUT", body: { current_password, password } });

export const getSessions = () => api("/account/sessions");

export const revokeSession = (id) => api(`/account/sessions/${id}`, { method: "DELETE" });

export const revokeOtherSessions = () => api("/account/sessions", { method: "DELETE" });

export const deleteAccount = (password) =>
  api("/account", { method: "DELETE", body: { password } });