import { api } from "./api";

// folders
export const getFolders = () => api("/note-folders");

export const createFolder = (name) =>
  api("/note-folders", { method: "POST", body: { name } });

export const renameFolder = (id, name) =>
  api(`/note-folders/${id}`, { method: "PATCH", body: { name } });

export const deleteFolder = (id) => api(`/note-folders/${id}`, { method: "DELETE" });

// notes
export function getNotes(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    query.set(key, value === true ? "1" : String(value));
  });

  const qs = query.toString();
  return api(`/notes${qs ? `?${qs}` : ""}`);
}

export const getNote = (id) => api(`/notes/${id}`);

export const createNote = (data = {}) => api("/notes", { method: "POST", body: data });

export const updateNote = (id, data) =>
  api(`/notes/${id}`, { method: "PATCH", body: data });

export const deleteNote = (id) => api(`/notes/${id}`, { method: "DELETE" });