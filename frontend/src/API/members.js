import { api } from "./api";

// on a board
export const getMembers = (boardId) => api(`/boards/${boardId}/members`);

export const inviteUser = (boardId, email) =>
  api(`/boards/${boardId}/invitations`, { method: "POST", body: { email } });

export const cancelInvite = (boardId, invitationId) =>
  api(`/boards/${boardId}/invitations/${invitationId}`, { method: "DELETE" });

export const removeMember = (boardId, userId) =>
  api(`/boards/${boardId}/members/${userId}`, { method: "DELETE" });

// an invitation sent to me
export const getInvitation = (id) => api(`/invitations/${id}`);

export const acceptInvitation = (id) =>
  api(`/invitations/${id}/accept`, { method: "POST" });

export const declineInvitation = (id) =>
  api(`/invitations/${id}/decline`, { method: "POST" });