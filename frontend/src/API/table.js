import { api } from "./api";

export const getBoards = () => api("/boards");

export const getBoard = (id) => api(`/boards/${id}`);

export const createBoard = (name) =>
  api("/boards", { method: "POST", body: { name } });

export const updateBoard = (id, data) =>
  api(`/boards/${id}`, { method: "PATCH", body: data });

export const deleteBoard = (id) => api(`/boards/${id}`, { method: "DELETE" });