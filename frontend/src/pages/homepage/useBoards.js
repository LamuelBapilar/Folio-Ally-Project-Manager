import { useEffect, useRef, useState } from "react";
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from "../../API/table";

/**
 * Everything about WHICH board you are looking at:
 *   - the list of your boards, and the one that is open
 *   - loading them, switching between them with a fade, and keeping them in step
 *     when you create, rename, or delete one
 *
 * Splitting this out of the page keeps the page about layout, and makes this logic easy to find.
 *
 * Usage:  const { boards, board, openBoard, ... } = useBoards();
 */

const FADE_OUT_MS = 150; // how long the old board fades out before the new one appears

export function useBoards() {
  const [boards, setBoards] = useState([]); // the list for the sidebar and the dropdown
  const [board, setBoard] = useState(null); // the open board, WITH its stories
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false); // true while the old board fades out
  const started = useRef(false);

  // First load: fetch the boards and open the first one.
  useEffect(() => {
    // In development React runs effects twice. Without this guard, a brand-new account
    // would get TWO default boards created.
    if (started.current) return;
    started.current = true;

    async function load() {
      try {
        let list = await getBoards();

        // A new account has no boards yet: create a first one.
        if (list.length === 0) list = [await createBoard("My Board")];

        setBoards(list);
        setBoard(await getBoard(list[0].id));
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  // Fades the current board out while `load()` fetches the next one, then swaps them.
  // `load` is a function that returns the next board (with its stories).
  async function swapBoard(load) {
    if (leaving) return; // ignore clicks while a swap is already running

    setError("");
    setLeaving(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      // Wait for BOTH the data and the fade, so the swap never happens mid-fade.
      const [next] = await Promise.all([
        load(),
        new Promise((resolve) => setTimeout(resolve, reduced ? 0 : FADE_OUT_MS)),
      ]);
      setBoard(next);
    } catch (err) {
      if (err.status === 404) {
        // The board is gone, or you were removed from it.
        setError("That board is no longer available to you.");

        // The list on screen may be out of date, so reload it.
        try {
          setBoards(await getBoards());
        } catch {
          // Keep the old list: it's better than an empty one.
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLeaving(false);
    }
  }

  // Opens a board by id.
  const openBoard = (id) => swapBoard(() => getBoard(id));

  // Reloads the list, then opens one board (or the first if `openId` is missing).
  // Used after accepting an invitation, leaving a board, or deleting one.
  const refreshBoards = (openId) =>
    swapBoard(async () => {
      let list = await getBoards();
      if (list.length === 0) list = [await createBoard("My Board")];
      setBoards(list);

      const target = list.find((b) => b.id === openId) ?? list[0];
      return getBoard(target.id);
    });

  // The functions below are used by modal windows. They do NOT catch errors:
  // the window shows the error itself, so it must see the failure.

  async function addBoard(name) {
    const created = await createBoard(name);
    setBoards((list) => [created, ...list]);

    // Not awaited: the window closes right away while the board fades to the new one.
    swapBoard(() => getBoard(created.id));
  }

  async function renameBoard(name) {
    const updated = await updateBoard(board.id, { name });

    // Only the name changes: the board keeps its stories.
    setBoard((b) => ({ ...b, name: updated.name }));
    setBoards((list) => list.map((b) => (b.id === updated.id ? { ...b, name: updated.name } : b)));
  }

  async function removeBoard() {
    await deleteBoard(board.id);

    // Reminders about this board were deleted on the server: refresh the bell.
    window.dispatchEvent(new Event("notifications-changed"));

    await refreshBoards();
  }

  return {
    boards,
    board,
    error,
    leaving,
    dismissError: () => setError(""),
    openBoard,
    refreshBoards,
    addBoard,
    renameBoard,
    removeBoard,
  };
}