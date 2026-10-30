import { api } from "./api";

// tells the notification bell to refresh after any change to stories
const changed = (result) => {
  window.dispatchEvent(new Event("stories-changed"));
  return result;
};

export const addStory = (boardId, data) =>
  api(`/boards/${boardId}/stories`, { method: "POST", body: data }).then(changed);

export const updateStory = (id, data) =>
  api(`/stories/${id}`, { method: "PATCH", body: data }).then(changed);

export const deleteStory = (id) =>
  api(`/stories/${id}`, { method: "DELETE" }).then(changed);

export const reorderStories = (boardId, stories) =>
  api(`/boards/${boardId}/stories/reorder`, {
    method: "PUT",
    body: { stories },
  }).then(changed);