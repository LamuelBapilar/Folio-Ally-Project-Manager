import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES } from "../../../utils/categories";

const STATUSES = [
  { value: "backlog", label: "BackLog" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const input =
  "w-full rounded-lg border border-brand-muted/50 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand";

const label = "mb-1 block text-xs font-medium";

export default function StoryModal({
  story,
  defaultStatus = "backlog",
  people = [],
  onSave,
  onClose,
}) {
  const editing = !!story;

  const [form, setForm] = useState({
    title: story?.title ?? "",
    description: story?.description ?? "",
    status: story?.status ?? defaultStatus,
    priority: story?.priority ?? "",
    category: story?.category ?? "",
    assigned_to: story?.assigned_to ? String(story.assigned_to) : "",
    progress: story?.progress ?? 0,
    due_date: story?.due_date?.slice(0, 10) ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // finished stories are always 100%
  function setStatus(e) {
    const status = e.target.value;
    setForm((f) => ({
      ...f,
      status,
      progress: status === "done" ? 100 : f.progress,
    }));
  }

  // keep the current assignee in the list even if the people list has not loaded
  const options =
    story?.assignee && !people.some((p) => p.id === story.assigned_to)
      ? [...people, story.assignee]
      : people;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority || null,
        category: form.category || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        progress: Number(form.progress),
        due_date: form.due_date || null,
      });
      onClose();
    } catch (err) {
      setError(err.errors?.assigned_to?.[0] ?? err.errors?.category?.[0] ?? err.message);
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-3 rounded-2xl bg-canvas p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">{editing ? "Edit story" : "Add story"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-900">
            <X size={14} />
          </button>
        </div>

        <div>
          <label htmlFor="title" className={label}>Title</label>
          <input id="title" autoFocus required value={form.title} onChange={set("title")} className={input} />
        </div>

        <div>
          <label htmlFor="description" className={label}>Description</label>
          <textarea id="description" rows={3} value={form.description} onChange={set("description")} className={input} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="status" className={label}>Column</label>
            <select id="status" value={form.status} onChange={setStatus} className={input}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className={label}>Priority</label>
            <select id="priority" value={form.priority} onChange={set("priority")} className={input}>
              <option value="">Undefined</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {editing && form.status !== story.status && (
          <p className="-mt-1 text-[10px] text-slate-500">
            The card will move to the end of the new column.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label htmlFor="category" className={label}>Category</label>
            <select id="category" value={form.category} onChange={set("category")} className={input}>
              <option value="">Undefined</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assigned_to" className={label}>Assigned to</label>
            <select id="assigned_to" value={form.assigned_to} onChange={set("assigned_to")} className={input}>
              <option value="">Unassigned</option>
              {options.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-0.5 flex items-center justify-between">
            <label htmlFor="progress" className="text-xs font-medium">Progress</label>
            <span className="text-xs font-semibold text-brand">{form.progress}%</span>
          </div>
          <input
            id="progress"
            type="range"
            min="0"
            max="100"
            step="5"
            value={form.progress}
            onChange={set("progress")}
            style={{ "--fill": `${form.progress}%` }}
            className="progress-slider"
          />
        </div>

        <div>
          <label htmlFor="due_date" className={label}>Due date</label>
          <input id="due_date" type="date" value={form.due_date} onChange={set("due_date")} className={input} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          disabled={saving}
          className="w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add story"}
        </button>
      </form>
    </div>
  );
}