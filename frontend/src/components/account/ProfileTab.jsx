import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { updateProfile } from "../../API/account";
import { parseError } from "../../API/api";
import { monthYear } from "../../utils/time";
import Field from "../Field";

export default function ProfileTab({ user, onUserChange }) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const next = name.trim();
  const changed = next !== "" && next !== user.name;
  const since = monthYear(user.created_at);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!changed) return;

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const updated = await updateProfile(next);

      // the header, the menu, and every board see the new name right away
      onUserChange(updated);
      setName(updated.name);
      setSaved(true);
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.fields.name ?? parsed.form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="pr-8">
        <h3 className="text-base font-bold">Profile</h3>
        <p className="mt-0.5 text-xs text-slate-500">How you appear in Folio.</p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-brand-muted/40 bg-white p-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#8b84ff,#5a52e6)] text-xl font-semibold text-white">
          {user.name?.charAt(0).toUpperCase()}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user.name}</p>
          <p className="truncate text-xs text-slate-600">{user.email}</p>
          {since && <p className="mt-0.5 text-[11px] text-slate-500">Member since {since}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field
          label="Full name"
          id="profile-name"
          autoComplete="name"
          maxLength={255}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
            setError("");
          }}
          error={error}
          required
        />

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span role="status" className="flex items-center gap-1 text-xs text-emerald-700">
              <Check size={13} />
              Saved
            </span>
          )}

          <button
            disabled={!changed || saving}
            className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <div>
        <p className="mb-1 text-xs font-medium text-slate-700">Email address</p>

        <div className="flex items-center gap-2 rounded-lg border border-brand-muted/50 bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
          <Lock size={13} className="shrink-0 text-slate-400" />
          <span className="min-w-0 truncate">{user.email}</span>
        </div>

        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Your email can't be changed yet. Board invitations and shared notes are tied to
          it, and Folio can't verify a new address for now.
        </p>
      </div>
    </div>
  );
}