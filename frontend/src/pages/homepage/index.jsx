import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createBoard, deleteBoard, getBoard, getBoards, updateBoard } from "../../API/table";
import AccountModal from "../../components/account/AccountModal";
import { InlineLoader } from "../../components/Loader";
import ProfileMenu from "../../components/ProfileMenu";
import Sidebar from "../../components/Sidebar";
import Board from "./components/Board";
import BoardMenu from "./components/BoardMenu";
import BoardSwitcher from "./components/BoardSwitcher";
import CreateBoardModal from "./components/CreateBoardModal";
import DeleteBoardModal from "./components/DeleteBoardModal";
import InvitationModal from "./components/InvitationModal";
import NotificationBell from "./components/NotificationBell";
import ReceivedNoteModal from "./components/ReceivedNoteModal";
import RenameBoardModal from "./components/RenameBoardModal";

// the notes editor is only downloaded when you open Notes
const NotesPage = lazy(() => import("../notespage"));

const FADE_OUT_MS = 150;

export default function Home({ user, onLogout, onUserChange }) {
  const navigate = useNavigate();
  const inNotes = useLocation().pathname === "/notespage";

  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [reviewingId, setReviewingId] = useState(null); // the invitation being reviewed
  const [reviewingShareId, setReviewingShareId] = useState(null); // the shared note being reviewed
  const [boardModal, setBoardModal] = useState(null); // "create", "rename", "delete", or null
  const [accountOpen, setAccountOpen] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development, and this guard
    // stops two default boards from being created
    if (started.current) return;
    started.current = true;

    async function load() {
      try {
        let list = await getBoards();
        if (list.length === 0) list = [await createBoard("My Board")];
        setBoards(list);
        setBoard(await getBoard(list[0].id));
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  // the browser tab says where you are
  useEffect(() => {
    document.title = inNotes ? "Notes · Folio" : board ? `${board.name} · Folio` : "Folio";

    return () => {
      document.title = "Folio: kanban and notes";
    };
  }, [inNotes, board?.name]);

  // fade the current board out while the next one loads, then swap
  async function swapBoard(load) {
    if (leaving) return;

    setError("");
    setLeaving(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      const [next] = await Promise.all([
        load(),
        new Promise((resolve) => setTimeout(resolve, reduced ? 0 : FADE_OUT_MS)),
      ]);
      setBoard(next);
    } catch (err) {
      if (err.status === 404) {
        setError("That board is no longer available to you.");

        // the list may be out of date, so reload it
        try {
          setBoards(await getBoards());
        } catch {
          // keep the old list
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLeaving(false);
    }
  }

  function openBoard(id) {
    return swapBoard(() => getBoard(id));
  }

  // reload the list of boards and open one of them (after accepting an invite, leaving, or deleting a board)
  function refreshBoards(openId) {
    return swapBoard(async () => {
      let list = await getBoards();
      if (list.length === 0) list = [await createBoard("My Board")];
      setBoards(list);

      const target = list.find((b) => b.id === openId) ?? list[0];
      return getBoard(target.id);
    });
  }

  // the modals catch these errors and show them, so there is no try/catch here
  async function handleCreateBoard(name) {
    const created = await createBoard(name);
    setBoards((list) => [created, ...list]);

    // not awaited: the window closes right away while the board fades to the new one
    swapBoard(() => getBoard(created.id));
  }

  async function handleRename(name) {
    const updated = await updateBoard(board.id, { name });

    // the board keeps its stories: only the name changes
    setBoard((b) => ({ ...b, name: updated.name }));
    setBoards((list) =>
      list.map((b) => (b.id === updated.id ? { ...b, name: updated.name } : b))
    );
  }

  async function handleDeleteBoard() {
    await deleteBoard(board.id);

    // everyone's reminders for it were deleted too
    window.dispatchEvent(new Event("notifications-changed"));

    await refreshBoards();
  }

  const isOwner = board && board.user_id === user.id;

  return (
    <div className="flex h-dvh bg-canvas text-slate-900">
      <Sidebar
        boards={boards}
        currentBoardId={board?.id}
        onSelectBoard={(id) => {
          navigate("/");
          if (id !== board?.id) openBoard(id);
        }}
        onNewBoard={() => {
          navigate("/");
          setBoardModal("create");
        }}
      />

      <div className="dot-grid flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 px-6">
          <div className="flex min-w-0 items-center gap-3">
            {inNotes ? (
              <h1 className="text-lg font-bold">Notes</h1>
            ) : (
              board && (
                <div className="flex min-w-0 items-center gap-1">
                  <BoardSwitcher boards={boards} current={board} onSelect={openBoard} />
                  {isOwner && (
                    <BoardMenu
                      onRename={() => setBoardModal("rename")}
                      onDelete={() => setBoardModal("delete")}
                    />
                  )}
                </div>
              )
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3 text-brand">
            <NotificationBell
              // on the Notes page every board notification must switch pages, so no board counts as "current"
              currentBoardId={inNotes ? null : board?.id}
              onOpenBoard={(id) => {
                navigate("/");
                return openBoard(id);
              }}
              onReview={setReviewingId}
              onReviewShare={setReviewingShareId}
            />
            <ProfileMenu
              user={user}
              onLogout={onLogout}
              onManage={() => setAccountOpen(true)}
            />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-6 pb-5">
          {error && (
            <p className="mb-2 flex items-center gap-2 text-sm text-red-600">
              {error}
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-semibold underline"
              >
                Dismiss
              </button>
            </p>
          )}

          {inNotes ? (
            <Suspense fallback={<InlineLoader message="Opening your notes" />}>
              <NotesPage />
            </Suspense>
          ) : (
            <>
              {!board && !error && <InlineLoader message="Loading your board" />}

              {board && (
                <div
                  className={`min-h-0 flex-1 transition-opacity duration-150 motion-reduce:transition-none ${
                    leaving ? "opacity-0" : ""
                  }`}
                >
                  <Board
                    key={board.id}
                    board={board}
                    user={user}
                    onNewBoard={() => setBoardModal("create")}
                    onLeave={() => refreshBoards()}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {reviewingId && (
        <InvitationModal
          id={reviewingId}
          onClose={() => setReviewingId(null)}
          onAccepted={(boardId) => {
            navigate("/");
            refreshBoards(boardId);
          }}
        />
      )}

      {reviewingShareId && (
        <ReceivedNoteModal
          id={reviewingShareId}
          onClose={() => setReviewingShareId(null)}
          onViewNotes={() => navigate("/notespage")}
        />
      )}

      {boardModal === "create" && (
        <CreateBoardModal
          onCreate={handleCreateBoard}
          onClose={() => setBoardModal(null)}
        />
      )}

      {boardModal === "rename" && board && (
        <RenameBoardModal
          board={board}
          onSave={handleRename}
          onClose={() => setBoardModal(null)}
        />
      )}

      {boardModal === "delete" && board && (
        <DeleteBoardModal
          board={board}
          onConfirm={handleDeleteBoard}
          onClose={() => setBoardModal(null)}
        />
      )}

      {accountOpen && (
        <AccountModal
          user={user}
          onUserChange={onUserChange}
          onLogout={onLogout}
          onClose={() => setAccountOpen(false)}
        />
      )}
    </div>
  );
}