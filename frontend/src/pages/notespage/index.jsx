import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createFolder,
  createNote,
  deleteFolder,
  deleteNote,
  getFolders,
  getNote,
  getNotes,
  renameFolder,
  updateNote,
} from "../../API/notes";
import { useDebounced } from "../../hooks/useDebounced";
import { DEFAULT_NOTE_FILTERS, rangeParams } from "../../utils/noteFilters";
import { downloadTextFile, fileNameFor, noteToText } from "../../utils/noteText";
import ConfirmModal from "../homepage/components/ConfirmModal";
import FolderList from "./components/FolderList";
import FolderModal from "./components/FolderModal";
import NoteEditor from "./components/NoteEditor";
import NoteList from "./components/NoteList";
import ShareNoteModal from "./components/ShareNoteModal";

export default function NotesPage() {
  const [folders, setFolders] = useState([]);
  const [totals, setTotals] = useState({ all: 0, unfiled: 0 });
  const [view, setView] = useState("all"); // "all", "unfiled", or a folder id

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_NOTE_FILTERS);
  const [notes, setNotes] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true); // only for the very first load
  const [error, setError] = useState("");

  const [open, setOpen] = useState(null); // the note being edited, or null
  const [busy, setBusy] = useState(false); // opening or creating a note
  const [folderModal, setFolderModal] = useState(null); // null, {} to create, { folder } to rename
  const [confirmFolder, setConfirmFolder] = useState(null);
  const [confirmNote, setConfirmNote] = useState(null); // the note waiting to be deleted
  const [sharing, setSharing] = useState(null); // the note being shared: { id, title }

  const debouncedQuery = useDebounced(query.trim(), 300);
  const requestId = useRef(0);
  const flushRef = useRef(null);

  const registerFlush = useCallback((fn) => {
    flushRef.current = fn;
  }, []);

  const params = useMemo(
    () => ({
      folder: view === "all" ? undefined : view === "unfiled" ? "unfiled" : view,
      q: debouncedQuery,
      pinned: filters.pinned,
      sort: filters.sort,
      ...rangeParams(filters),
    }),
    [view, debouncedQuery, filters]
  );

  const loadNotes = useCallback(async () => {
    // an older answer that arrives late must not replace a newer one
    const id = ++requestId.current;

    try {
      const result = await getNotes(params);
      if (id !== requestId.current) return;

      setNotes(result.data);
      setHasMore(result.has_more);
      setError("");
    } catch (err) {
      if (id === requestId.current) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [params]);

  const loadFolders = useCallback(async () => {
    try {
      const data = await getFolders();
      setFolders(data.folders);
      setTotals(data.totals);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refresh = useCallback(
    () => Promise.all([loadNotes(), loadFolders()]),
    [loadNotes, loadFolders]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // a shared note was just saved to this account
  useEffect(() => {
    window.addEventListener("notes-changed", refresh);
    return () => window.removeEventListener("notes-changed", refresh);
  }, [refresh]);

  const currentFolder = typeof view === "number" ? folders.find((f) => f.id === view) : null;
  const title =
    view === "all" ? "All notes" : view === "unfiled" ? "Unfiled" : currentFolder?.name ?? "Folder";

  // saves the open note, then returns to the list. Stays put if the save failed.
  async function closeNote() {
    if ((await flushRef.current?.()) === false) return false;

    setOpen(null);
    refresh();
    return true;
  }

  async function selectView(next) {
    if (open && !(await closeNote())) return;
    setView(next);
  }

  async function openNote(id) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      setOpen(await getNote(id));
    } catch (err) {
      setError(err.status === 404 ? "That note no longer exists." : err.message);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function newNote() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      // a new note lands in the folder you are looking at
      setOpen(await createNote({ folder_id: typeof view === "number" ? view : null }));
      loadFolders();
    } catch (err) {
      setError(err.errors?.title?.[0] ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePin(note) {
    const next = !note.is_pinned;

    setNotes((list) => list.map((n) => (n.id === note.id ? { ...n, is_pinned: next } : n)));

    try {
      await updateNote(note.id, { is_pinned: next });
    } catch (err) {
      setError(err.message);
    }

    // pinned notes move to the top
    loadNotes();
  }

  // the list only holds a preview, so the whole note is fetched first
  async function downloadNote(note) {
    setError("");

    try {
      const full = await getNote(note.id);
      downloadTextFile(fileNameFor(full.title), noteToText(full.title, full.content));
    } catch (err) {
      setError(err.status === 404 ? "That note no longer exists." : err.message);
    }
  }

  // the confirmation window shows any error, so there is no try/catch here
  async function removeNote() {
    try {
      await deleteNote(confirmNote.id);
    } catch (err) {
      // already gone (deleted somewhere else): just refresh the list
      if (err.status !== 404) throw err;
    }

    await refresh();
  }

  // the folder windows catch these errors and show them, so there is no try/catch here
  async function saveFolder(name) {
    if (folderModal.folder) {
      await renameFolder(folderModal.folder.id, name);
    } else {
      await createFolder(name);
    }

    await refresh();
  }

  async function askRename(folder) {
    if (open && !(await closeNote())) return;
    setFolderModal({ folder });
  }

  async function askDelete(folder) {
    if (open && !(await closeNote())) return;
    setConfirmFolder(folder);
  }

  async function removeFolder() {
    await deleteFolder(confirmFolder.id);

    if (view === confirmFolder.id) setView("all");
    await refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <FolderList
        folders={folders}
        totals={totals}
        view={view}
        onSelect={selectView}
        onCreate={() => setFolderModal({})}
        onRename={askRename}
        onDelete={askDelete}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-muted/40 bg-surface">
        {error && (
          <p
            role="alert"
            className="flex shrink-0 items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
          >
            {error}
            <button
              type="button"
              onClick={() => {
                setError("");
                refresh();
              }}
              className="font-semibold underline"
            >
              Try again
            </button>
          </p>
        )}

        {open ? (
          <NoteEditor
            key={open.id}
            note={open}
            folders={folders}
            backLabel={title}
            registerFlush={registerFlush}
            onBack={closeNote}
            onShare={setSharing}
            onDeleted={() => {
              setOpen(null);
              refresh();
            }}
          />
        ) : (
          <NoteList
            title={title}
            notes={notes}
            loading={loading}
            hasMore={hasMore}
            query={query}
            onQuery={setQuery}
            filters={filters}
            onFilters={setFilters}
            showFolder={view === "all"}
            creating={busy}
            onOpen={openNote}
            onNew={newNote}
            onPin={togglePin}
            onShare={(note) => setSharing({ id: note.id, title: note.title })}
            onDownload={downloadNote}
            onDelete={setConfirmNote}
          />
        )}
      </section>

      {folderModal && (
        <FolderModal
          folder={folderModal.folder}
          onSave={saveFolder}
          onClose={() => setFolderModal(null)}
        />
      )}

      {confirmFolder && (
        <ConfirmModal
          danger
          title={`Delete ${confirmFolder.name}?`}
          confirmLabel="Delete folder"
          busyLabel="Deleting..."
          onConfirm={removeFolder}
          onClose={() => setConfirmFolder(null)}
        >
          The folder is deleted, but its {confirmFolder.notes_count}{" "}
          {confirmFolder.notes_count === 1 ? "note is" : "notes are"} kept and move to
          Unfiled.
        </ConfirmModal>
      )}

      {confirmNote && (
        <ConfirmModal
          danger
          title="Delete this note?"
          confirmLabel="Delete note"
          busyLabel="Deleting..."
          onConfirm={removeNote}
          onClose={() => setConfirmNote(null)}
        >
          <span className="font-semibold">{confirmNote.title || "Untitled"}</span> will be
          permanently deleted, and anything you shared that hasn't been answered is
          cancelled. This can't be undone.
        </ConfirmModal>
      )}

      {sharing && <ShareNoteModal note={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}