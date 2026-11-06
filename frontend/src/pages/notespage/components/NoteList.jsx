import { Folder, Pin, Plus, Search, StickyNote, X } from "lucide-react";
import {
  DEFAULT_NOTE_FILTERS,
  SORT_OPTIONS,
  describeRange,
  isFiltering,
} from "../../../utils/noteFilters";
import { timeAgo } from "../../../utils/time";
import NoteFilterMenu from "./NoteFilterMenu";
import NoteMenu from "./NoteMenu";

function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-soft py-0.5 pl-2.5 pr-1.5 text-[10px] font-semibold text-brand">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="grid h-3.5 w-3.5 place-items-center rounded-full hover:bg-brand/20"
      >
        <X size={10} />
      </button>
    </span>
  );
}

export default function NoteList({
  title,
  notes,
  loading,
  hasMore,
  query,
  onQuery,
  filters,
  onFilters,
  showFolder,
  creating,
  onOpen,
  onNew,
  onPin,
  onShare,
  onDownload,
  onDelete,
}) {
  const filterActive = isFiltering(filters);
  const narrowed = filterActive || query.trim().length > 0;
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  function clearAll() {
    onQuery("");
    onFilters(DEFAULT_NOTE_FILTERS);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{title}</h2>
          <p className="text-[11px] text-slate-500">
            {notes.length}
            {hasMore ? "+" : ""} {notes.length === 1 ? "note" : "notes"}
          </p>
        </div>

        <button
          type="button"
          onClick={onNew}
          disabled={creating}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
        >
          <Plus size={13} />
          New note
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 px-5 pt-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-brand-muted/50 bg-surface px-2.5 py-1.5 text-slate-500 focus-within:ring-2 focus-within:ring-brand">
          <Search size={14} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search titles and text"
            aria-label="Search notes"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              aria-label="Clear search"
              className="shrink-0 text-slate-400 hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </label>

        <NoteFilterMenu value={filters} onChange={onFilters} />
      </div>

      {filterActive && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-5 pt-2.5">
          {filters.pinned && (
            <Chip label="Pinned" onRemove={() => onFilters({ ...filters, pinned: false })} />
          )}
          {filters.range !== "any" && (
            <Chip
              label={describeRange(filters)}
              onRemove={() => onFilters({ ...filters, range: "any", from: "", to: "" })}
            />
          )}
          {filters.sort !== "updated" && (
            <Chip
              label={`Sort: ${sortLabel}`}
              onRemove={() => onFilters({ ...filters, sort: "updated" })}
            />
          )}
          <button
            type="button"
            onClick={() => onFilters(DEFAULT_NOTE_FILTERS)}
            className="px-1 text-[10px] font-semibold text-brand hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:var(--color-brand-muted)_transparent] [scrollbar-width:thin]">
        {loading && <p className="px-2 py-6 text-center text-xs text-slate-500">Loading notes...</p>}

        {!loading && notes.length === 0 && (
          <div className="mx-auto max-w-xs px-2 py-12 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
              <StickyNote size={18} />
            </span>

            {narrowed ? (
              <>
                <p className="mt-3 text-sm font-semibold">No notes match</p>
                <p className="mt-1 text-xs text-slate-500">
                  Try a different word, or clear the search and filters.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-3 rounded-lg border border-brand-muted/50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft"
                >
                  Clear search and filters
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm font-semibold">No notes here yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Write down ideas, meeting notes, and checklists.
                </p>
                <button
                  type="button"
                  onClick={onNew}
                  disabled={creating}
                  className="mt-3 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Create a note
                </button>
              </>
            )}
          </div>
        )}

        {notes.length > 0 && (
          <ul className="space-y-1">
            {notes.map((note) => (
              <li key={note.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onOpen(note.id)}
                  className="block w-full rounded-xl border border-transparent px-3.5 py-3 pr-16 text-left transition-colors hover:border-brand-muted/50 hover:bg-brand-soft/40 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span className="block truncate text-[13px] font-semibold">
                    {note.title || "Untitled"}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-slate-500">
                    {note.preview || "No additional text"}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
                    {showFolder && note.folder && (
                      <span className="flex max-w-32 items-center gap-1 rounded bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">
                        <Folder size={10} className="shrink-0" />
                        <span className="truncate">{note.folder.name}</span>
                      </span>
                    )}
                    {note.shared_from && (
                      <span className="max-w-32 truncate rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
                        Shared by {note.shared_from}
                      </span>
                    )}
                    <span>Edited {timeAgo(note.updated_at)}</span>
                  </span>
                </button>

                <div className="absolute right-2 top-2.5 flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onPin(note)}
                    aria-pressed={note.is_pinned}
                    aria-label={note.is_pinned ? "Unpin note" : "Pin note"}
                    title={note.is_pinned ? "Unpin note" : "Pin note"}
                    className={`grid h-6 w-6 place-items-center rounded-md transition-opacity hover:bg-surface hover:text-brand focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand ${
                      note.is_pinned
                        ? "text-brand"
                        : "text-slate-400 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                    }`}
                  >
                    <Pin size={13} fill={note.is_pinned ? "currentColor" : "none"} />
                  </button>

                  <NoteMenu
                    onOpen={() => onOpen(note.id)}
                    onShare={() => onShare(note)}
                    onDownload={() => onDownload(note)}
                    onDelete={() => onDelete(note)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <p className="px-2 pt-3 text-center text-[11px] text-slate-500">
            Showing the newest 100. Search or filter to find older notes.
          </p>
        )}
      </div>
    </div>
  );
}