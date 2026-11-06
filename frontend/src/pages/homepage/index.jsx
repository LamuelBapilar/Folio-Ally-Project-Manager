import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AccountModal from "../../components/account/AccountModal";
import { InlineLoader } from "../../components/Loader";
import ProfileMenu from "../../components/ProfileMenu";
import Sidebar from "../../components/Sidebar";
import { useTheme } from "../../hooks/useTheme";
import Board from "./components/Board";
import BoardMenu from "./components/BoardMenu";
import BoardSwitcher from "./components/BoardSwitcher";
import CreateBoardModal from "./components/CreateBoardModal";
import DeleteBoardModal from "./components/DeleteBoardModal";
import InvitationModal from "./components/InvitationModal";
import NotificationBell from "./components/NotificationBell";
import ReceivedNoteModal from "./components/ReceivedNoteModal";
import RenameBoardModal from "./components/RenameBoardModal";
import { useBoards } from "./useBoards";

// The notes editor is big, so it is only downloaded the first time you open Notes.
const NotesPage = lazy(() => import("../notespage"));

/**
 * The signed-in app shell. It serves BOTH "/" (boards) and "/notespage".
 *
 * What lives here:    the layout (sidebar, header, main area) and which window is open.
 * What lives elsewhere:
 *   - board data and switching  -> ./useBoards.js
 *   - the board screen          -> ./components/Board.jsx
 *   - the notes screen          -> ../notespage/index.jsx
 *
 * Props (from App.jsx):
 *   user          the signed-in person
 *   onLogout      signs out
 *   onUserChange  lets the account window update the name everywhere
 */
export default function Home({ user, onLogout, onUserChange }) {
  const navigate = useNavigate();
  const inNotes = useLocation().pathname === "/notespage";

  // "dark" or "light". Putting the `dark` class on the root <div> below is what turns
  // dark mode on for everything inside it, including every window. See index.css.
  const { resolved: theme } = useTheme();

  const {
    boards,
    board,
    error,
    leaving,
    dismissError,
    openBoard,
    refreshBoards,
    addBoard,
    renameBoard,
    removeBoard,
  } = useBoards();

  // Which window is open. Each one is null (closed) or holds what it needs.
  const [reviewingId, setReviewingId] = useState(null); // a board invitation being reviewed
  const [reviewingShareId, setReviewingShareId] = useState(null); // a shared note being reviewed
  const [boardModal, setBoardModal] = useState(null); // "create" | "rename" | "delete" | null
  const [accountOpen, setAccountOpen] = useState(false);

  // The browser tab shows where you are.
  useEffect(() => {
    document.title = inNotes ? "Notes · Folio" : board ? `${board.name} · Folio` : "Folio";

    // When leaving the app (for example on sign out), put the default title back.
    return () => {
      document.title = "Folio: kanban and notes";
    };
  }, [inNotes, board?.name]);

  // Only the owner can rename or delete a board.
  const isOwner = board && board.user_id === user.id;

  return (
    <div
      className={`flex h-dvh bg-canvas text-slate-900 ${theme === "dark" ? "dark" : ""}`}
    >
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
        {/* Header: the page title on the left, notifications and profile on the right */}
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
              // On the Notes page no board counts as "current", so clicking a board
              // notification always switches back to Boards.
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

        {/* Main area: either the notes screen or the open board */}
        <main className="flex min-h-0 flex-1 flex-col px-6 pb-5">
          {error && (
            <p className="mb-2 flex items-center gap-2 text-sm text-red-600">
              {error}
              <button type="button" onClick={dismissError} className="text-xs font-semibold underline">
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
                // `leaving` fades the board out while the next one loads.
                <div
                  className={`min-h-0 flex-1 transition-opacity duration-150 motion-reduce:transition-none ${
                    leaving ? "opacity-0" : ""
                  }`}
                >
                  {/* key={board.id} gives each board a fresh state (filters, search...) */}
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

      {/* ---------- Windows. Each one renders only while it is open. ---------- */}

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
        <CreateBoardModal onCreate={addBoard} onClose={() => setBoardModal(null)} />
      )}

      {boardModal === "rename" && board && (
        <RenameBoardModal board={board} onSave={renameBoard} onClose={() => setBoardModal(null)} />
      )}

      {boardModal === "delete" && board && (
        <DeleteBoardModal board={board} onConfirm={removeBoard} onClose={() => setBoardModal(null)} />
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