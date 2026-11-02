import { Folder, FolderPlus, Inbox, Pencil, StickyNote, Trash2 } from "lucide-react";

function Item({ icon: Icon, label, count, active, onClick, actions }) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-2.5 pr-2 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
          active
            ? "bg-brand-soft font-semibold text-brand"
            : "text-slate-700 hover:bg-brand-soft/60"
        }`}
      >
        <Icon size={14} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span
          className={`shrink-0 text-[10px] ${active ? "text-brand" : "text-slate-500"} ${
            actions ? "group-focus-within:opacity-0 group-hover:opacity-0" : ""
          }`}
        >
          {count}
        </span>
      </button>

      {actions && (
        <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {actions}
        </div>
      )}
    </li>
  );
}

function IconButton({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-5 w-5 place-items-center rounded text-slate-500 transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-white hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

export default function FolderList({
  folders,
  totals,
  view,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}) {
  return (
    <aside className="flex max-h-48 w-full shrink-0 flex-col rounded-2xl border border-brand-muted/40 bg-white md:max-h-none md:w-56">
      <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
        <h2 className="text-sm font-bold">Notes</h2>

        <button
          type="button"
          onClick={onCreate}
          aria-label="New folder"
          title="New folder"
          className="grid h-6 w-6 place-items-center rounded-md text-slate-600 transition-colors hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2 [scrollbar-color:var(--color-brand-muted)_transparent] [scrollbar-width:thin]">
        <Item
          icon={StickyNote}
          label="All notes"
          count={totals.all}
          active={view === "all"}
          onClick={() => onSelect("all")}
        />
        <Item
          icon={Inbox}
          label="Unfiled"
          count={totals.unfiled}
          active={view === "unfiled"}
          onClick={() => onSelect("unfiled")}
        />

        <li>
          <p className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Folders
          </p>
        </li>

        {folders.length === 0 && (
          <li className="px-2.5 py-1 text-[11px] leading-relaxed text-slate-500">
            Use the folder button above to organize your notes.
          </li>
        )}

        {folders.map((folder) => (
          <Item
            key={folder.id}
            icon={Folder}
            label={folder.name}
            count={folder.notes_count}
            active={view === folder.id}
            onClick={() => onSelect(folder.id)}
            actions={
              <>
                <IconButton label={`Rename ${folder.name}`} onClick={() => onRename(folder)}>
                  <Pencil size={11} />
                </IconButton>
                <IconButton label={`Delete ${folder.name}`} danger onClick={() => onDelete(folder)}>
                  <Trash2 size={11} />
                </IconButton>
              </>
            }
          />
        ))}
      </ul>
    </aside>
  );
}