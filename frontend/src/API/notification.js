import { api } from "./api";

export const getNotifications = () => api("/notifications");

// pass a list of ids, or nothing to mark everything as read
export const markNotificationsRead = (ids) =>
  api("/notifications/read", { method: "POST", body: ids ? { ids } : {} });