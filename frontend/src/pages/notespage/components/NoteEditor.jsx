import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, getSchema, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Folder,
  Inbox,
  Loader2,
  Pin,
  Share2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { deleteNote, updateNote } from "../../../API/notes";
import { prepareDocument } from "../../../utils/noteDocument";
import { downloadTextFile, fileNameFor, noteToText } from "../../../utils/noteText";
import { timeAgo } from "../../../utils/time";
import ConfirmModal from "../../homepage/components/ConfirmModal";
import EditorToolbar from "./EditorToolbar";
import MenuButton, { MenuItem } from "./MenuButton";

const SAVE_DELAY_MS = 1000; // saves this long after you stop typing

// created once, so the editor does not rebuild on every render
const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
  }),
  TextStyleKit,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TaskList,
  TaskItem.configure({ nested: true }),
];

// what the editor accepts: used to check saved notes before opening them
const schema = getSchema(extensions);

const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const headerButton =
  "grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand";

function SaveStatus({ status, onRetry }) {
  return (
    <span aria-live="polite" className="flex items-center gap-1 text-[11px] text-slate-500">
      {status === "saving" && (
        <>
          <Loader2 size={12} className="animate-spin" /> Saving...
        </>
      )}
      {status === "saved" && (
        <>
          <Check size={12} className="text-low" /> Saved
        </>
      )}
      {status === "unsaved" && "Unsaved changes"}
      {status === "error" && (
        <>
          <TriangleAlert size={12} className="text-red-500" />
          <span className="text-red-600">Couldn't save</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold text-brand hover:underline"
          >
            Retry
          </button>
        </>
      )}
    </span>
  );
}

export default function NoteEditor({
  note,
  folders,
  backLabel,
  onBack,
  onDeleted,
  onShare,
  registerFlush,
}) {
  // checked once, when the note is opened
  const [prepared] = useState(() => prepareDocument(note.content, schema));
  const [showNotice, setShowNotice] = useState(prepared.repaired);

  const [title, setTitle] = useState(note.title);
  const [meta, setMeta] = useState({
    folder: note.folder,
    is_pinned: note.is_pinned,
    updated_at: note.updated_at,
  });
  const [status, setStatus] = useState("saved");
  const [saveError, setSaveError] = useState("");
  const [actionError, setActionError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titleRef = useRef(note.title);
  const docRef = useRef(null);
  const dirtyRef = useRef({ title: false, content: false });
  const timerRef = useRef(null);
  const inflightRef = useRef(null);

  // sends whatever has changed. Returns true when everything is saved.
  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);

    // wait for a save that is already running, so changes go out in order
    while (inflightRef.current) await inflightRef.current;

    const dirty = dirtyRef.current;
    if (!dirty.title && !dirty.content) return true;

    const payload = {};
    if (dirty.title) payload.title = titleRef.current;
    if (dirty.content) payload.content = docRef.current;
    dirtyRef.current = { title: false, content: false };

    setStatus("saving");
    setSaveError("");

    const request = updateNote(note.id, payload);
    inflightRef.current = request.then(
      () => {},
      () => {}
    );

    try {
      const saved = await request;

      setMeta((m) => ({ ...m, updated_at: saved.updated_at }));

      // more typing may have happened while this save was running
      const more = dirtyRef.current.title || dirtyRef.current.content;
      setStatus(more ? "unsaved" : "saved");
      return true;
    } catch (err) {
      // keep the unsent changes, so the next attempt (or Retry) sends them
      dirtyRef.current = {
        title: dirtyRef.current.title || "title" in payload,
        content: dirtyRef.current.content || "content" in payload,
      };
      setSaveError(err.errors?.content?.[0] ?? err.errors?.title?.[0] ?? err.message);
      setStatus("error");
      return false;
    } finally {
      inflightRef.current = null;
    }
  }, [note.id]);

  const markDirty = useCallback(
    (part) => {
      dirtyRef.current[part] = true;
      setStatus("unsaved");

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), SAVE_DELAY_MS);
    },
    [flush]
  );

  const editor = useEditor({
    extensions,
    content: prepared.doc ?? "",
    editorProps: {
      attributes: {
        class: "note-prose focus:outline-none",
        "aria-label": "Note content",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: e }) => {
      docRef.current = e.getJSON();
      markDirty("content");
    },
  });

  const { empty, words } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      empty: e ? e.isEmpty : true,
      words: e ? countWords(e.getText()) : 0,
    }),
  });

  // let the page save this note before it navigates away, and save once more on the way out
  useEffect(() => {
    registerFlush(flush);

    return () => {
      registerFlush(null);
      flush();
    };
  }, [flush, registerFlush]);

  // switching to another tab or window also saves
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();

    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  function onTitleChange(e) {
    const value = e.target.value;

    setTitle(value);
    titleRef.current = value;
    markDirty("title");
  }

  function onTitleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      editor?.chain().focus("start").run();
    }
  }

  async function togglePin() {
    const next = !meta.is_pinned;

    setMeta((m) => ({ ...m, is_pinned: next }));
    setActionError("");

    try {
      await updateNote(note.id, { is_pinned: next });
    } catch (err) {
      setMeta((m) => ({ ...m, is_pinned: !next }));
      setActionError(err.message);
    }
  }

  async function moveTo(folder) {
    setActionError("");

    try {
      await updateNote(note.id, { folder_id: folder ? folder.id : null });
      setMeta((m) => ({ ...m, folder: folder ? { id: folder.id, name: folder.name } : null }));
    } catch (err) {
      setActionError(err.message);
    }
  }

  // the shared copy is the SAVED note, so everything is saved first
  async function share() {
    setActionError("");

    if ((await flush()) === false) {
      setActionError("Your latest changes couldn't be saved yet. Fix that, then share.");
      return;
    }

    onShare({ id: note.id, title: titleRef.current });
  }

  // downloads exactly what is on the screen, saved or not
  function download() {
    const name = titleRef.current;
    downloadTextFile(fileNameFor(name), noteToText(name, editor.getJSON()));
  }

  async function remove() {
    // nothing left to save for a note that is about to be deleted
    clearTimeout(timerRef.current);
    dirtyRef.current = { title: false, content: false };
    while (inflightRef.current) await inflightRef.current;

    await deleteNote(note.id);
    onDeleted();
  }

  if (!editor) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <ArrowLeft size={14} />
          {backLabel}
        </button>

        <MenuButton
          label="Move to folder"
          panelClassName="w-48"
          buttonClassName="flex max-w-44 items-center gap-1.5 rounded-lg border border-brand-muted/50 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
          trigger={
            <>
              {meta.folder ? <Folder size={13} /> : <Inbox size={13} />}
              <span className="truncate">{meta.folder?.name ?? "Unfiled"}</span>
              <ChevronDown size={12} className="shrink-0" />
            </>
          }
        >
          {(close) => (
            <div className="max-h-60 overflow-y-auto p-1">
              <MenuItem
                active={!meta.folder}
                onClick={() => {
                  moveTo(null);
                  close();
                }}
              >
                Unfiled
              </MenuItem>
              {folders.map((f) => (
                <MenuItem
                  key={f.id}
                  active={meta.folder?.id === f.id}
                  onClick={() => {
                    moveTo(f);
                    close();
                  }}
                >
                  {f.name}
                </MenuItem>
              ))}
            </div>
          )}
        </MenuButton>

        {note.shared_from && (
          <span className="max-w-40 truncate rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
            Shared by {note.shared_from}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <SaveStatus status={status} onRetry={flush} />

          <button
            type="button"
            onClick={share}
            aria-label="Share note"
            title="Share note"
            className={`${headerButton} text-slate-500 hover:text-brand`}
          >
            <Share2 size={14} />
          </button>

          <button
            type="button"
            onClick={download}
            aria-label="Download as text"
            title="Download as text"
            className={`${headerButton} text-slate-500 hover:text-brand`}
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            onClick={togglePin}
            aria-pressed={meta.is_pinned}
            aria-label={meta.is_pinned ? "Unpin note" : "Pin note"}
            title={meta.is_pinned ? "Unpin note" : "Pin note"}
            className={`${headerButton} ${meta.is_pinned ? "text-brand" : "text-slate-500"}`}
          >
            <Pin size={14} fill={meta.is_pinned ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete note"
            title="Delete note"
            className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={onTitleChange}
        onKeyDown={onTitleKeyDown}
        maxLength={255}
        placeholder="Untitled"
        aria-label="Note title"
        className="shrink-0 bg-transparent px-5 pb-3 pt-3 text-xl font-bold placeholder:text-slate-300 focus:outline-none"
      />

      {showNotice && (
        <div
          role="status"
          className="mx-5 mb-2 flex shrink-0 items-start gap-2 rounded-lg border border-medium/40 bg-medium/10 px-3 py-2 text-xs text-slate-700"
        >
          <TriangleAlert size={14} className="mt-0.5 shrink-0 text-medium" />
          <p className="min-w-0 flex-1">
            {prepared.doc
              ? "Part of this note couldn't be read, so it was repaired for display. Some spaces or formatting may be missing. Your saved copy doesn't change until you edit this note."
              : "This note's saved content couldn't be read, so it is shown empty. Your saved copy doesn't change until you edit this note."}
          </p>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            className="shrink-0 font-semibold text-brand hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {saveError && status === "error" && (
        <p role="alert" className="shrink-0 px-5 pb-2 text-xs text-red-600">
          {saveError}
        </p>
      )}
      {actionError && (
        <p role="alert" className="shrink-0 px-5 pb-2 text-xs text-red-600">
          {actionError}
        </p>
      )}

      <EditorToolbar editor={editor} />

      <div
        className="relative min-h-0 flex-1 cursor-text overflow-y-auto px-5 py-4"
        onClick={(e) => {
          // a click on the empty space under the text puts the cursor at the end
          if (e.target === e.currentTarget) editor.chain().focus("end").run();
        }}
      >
        {empty && (
          <p className="pointer-events-none absolute left-5 top-4 text-sm text-slate-400">
            Start writing...
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-brand-soft px-5 py-2 text-[11px] text-slate-500">
        <span>
          {words} {words === 1 ? "word" : "words"}
        </span>
        <span>Edited {timeAgo(meta.updated_at)}</span>
      </div>

      {confirmingDelete && (
        <ConfirmModal
          danger
          title="Delete this note?"
          confirmLabel="Delete note"
          busyLabel="Deleting..."
          onConfirm={remove}
          onClose={() => setConfirmingDelete(false)}
        >
          <span className="font-semibold">{title.trim() || "Untitled"}</span> will be
          permanently deleted, and anything you shared that hasn't been answered is
          cancelled. This can't be undone.
        </ConfirmModal>
      )}
    </div>
  );
}