import { useCallback, useEffect, useState } from "react";
import { Check, Monitor, Smartphone } from "lucide-react";
import {
  changePassword,
  getSessions,
  revokeOtherSessions,
  revokeSession,
} from "../../API/account";
import { parseError } from "../../API/api";
import { describeDevice } from "../../utils/device";
import { passwordIsValid } from "../../utils/passwordRules";
import { shortDate, timeAgo } from "../../utils/time";
import ConfirmModal from "../../pages/homepage/components/ConfirmModal";
import Field from "../Field";
import PasswordRequirements from "../PasswordRequirements";
import DeleteAccountModal from "./DeleteAccountModal";

const EMPTY = { current: "", next: "", confirm: "" };

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-brand-muted/40 bg-white p-4">
      <h4 className="text-sm font-bold">{title}</h4>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PasswordSection({ onChanged }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({ fields: {}, form: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [key]: undefined } }));
  };

  function cancel() {
    setOpen(false);
    setForm(EMPTY);
    setErrors({ fields: {}, form: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!passwordIsValid(form.next)) {
      setErrors({
        fields: { next: "Your new password doesn't meet all the requirements yet." },
        form: "",
      });
      return;
    }

    if (form.next !== form.confirm) {
      setErrors({ fields: { confirm: "Passwords do not match." }, form: "" });
      return;
    }

    setSaving(true);
    setErrors({ fields: {}, form: "" });

    try {
      await changePassword(form.current, form.next);

      setForm(EMPTY);
      setOpen(false);
      setNotice("Password updated. Your other devices were signed out.");
      onChanged();
    } catch (err) {
      const parsed = parseError(err);

      // the server names these fields differently from the form
      setErrors({
        fields: { current: parsed.fields.current_password, next: parsed.fields.password },
        form: parsed.form,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Password" description="Use a strong password you don't use anywhere else.">
      {notice && !open && (
        <p role="status" className="mb-3 flex items-center gap-1.5 text-xs text-emerald-700">
          <Check size={13} />
          {notice}
        </p>
      )}

      {!open ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm tracking-widest text-slate-500">••••••••</span>

          <button
            type="button"
            onClick={() => {
              setNotice("");
              setOpen(true);
            }}
            className="rounded-lg border border-brand-muted/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-soft"
          >
            Change password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {errors.form && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {errors.form}
            </div>
          )}

          <Field
            label="Current password"
            id="current-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            maxLength={255}
            value={form.current}
            onChange={set("current")}
            error={errors.fields.current}
            required
          />

          <div>
            <Field
              label="New password"
              id="new-password"
              type="password"
              autoComplete="new-password"
              maxLength={72}
              value={form.next}
              onChange={set("next")}
              error={errors.fields.next}
              required
            />
            <PasswordRequirements password={form.next} />
          </div>

          <Field
            label="Confirm new password"
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={form.confirm}
            onChange={set("confirm")}
            error={errors.fields.confirm}
            required
          />

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-lg border border-brand-muted/50 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-soft disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update password"}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

function SessionsSection({ version }) {
  const [sessions, setSessions] = useState(null); // null = not loaded yet
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getSessions();
      setSessions(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // reloads when the password changes, because that signs the other devices out
  useEffect(() => {
    load();
  }, [load, version]);

  async function revoke(session) {
    setBusyId(session.id);
    setError("");

    try {
      await revokeSession(session.id);
      await load();
    } catch (err) {
      setError(err.errors?.session?.[0] ?? err.message);
    } finally {
      setBusyId(null);
    }
  }

  const others = sessions?.filter((s) => !s.current).length ?? 0;

  return (
    <Section
      title="Devices"
      description="Where you're logged in. Sign out of any you don't recognize."
    >
      {error && (
        <p role="alert" className="mb-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {sessions === null && !error && <p className="py-2 text-xs text-slate-500">Loading...</p>}

      {sessions && (
        <ul className="divide-y divide-brand-soft">
          {sessions.map((session) => {
            const device = describeDevice(session.user_agent);
            const Icon = device.mobile ? Smartphone : Monitor;

            return (
              <li key={session.id} className="flex items-center gap-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon size={15} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-xs font-semibold">{device.label}</span>
                    {session.current && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                        This device
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Active {timeAgo(session.last_used_at ?? session.created_at)} · Signed in{" "}
                    {shortDate(session.created_at)}
                  </span>
                </span>

                {!session.current && (
                  <button
                    type="button"
                    onClick={() => revoke(session)}
                    disabled={busyId === session.id}
                    className="shrink-0 rounded-lg border border-brand-muted/50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-brand-soft disabled:opacity-50"
                  >
                    {busyId === session.id ? "Signing out..." : "Sign out"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {others > 0 && (
        <button
          type="button"
          onClick={() => setConfirmAll(true)}
          className="mt-3 rounded-lg border border-brand-muted/50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-soft"
        >
          Sign out of all other devices
        </button>
      )}

      {confirmAll && (
        <ConfirmModal
          title="Sign out of other devices?"
          confirmLabel="Sign out others"
          busyLabel="Signing out..."
          onConfirm={async () => {
            await revokeOtherSessions();
            await load();
          }}
          onClose={() => setConfirmAll(false)}
        >
          Every device except this one will need to log in again.
        </ConfirmModal>
      )}
    </Section>
  );
}

export default function SecurityTab({ onLogout }) {
  const [version, setVersion] = useState(0);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="space-y-4">
      <div className="pr-8">
        <h3 className="text-base font-bold">Security</h3>
        <p className="mt-0.5 text-xs text-slate-500">Keep your account safe.</p>
      </div>

      <PasswordSection onChanged={() => setVersion((v) => v + 1)} />

      <SessionsSection version={version} />

      <section className="rounded-xl border border-red-200 bg-white p-4">
        <h4 className="text-sm font-bold text-red-700">Delete account</h4>
        <p className="mt-0.5 text-xs text-slate-500">
          Permanently delete your account and everything in it.
        </p>

        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="mt-3 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Delete account
        </button>
      </section>

      {deleting && <DeleteAccountModal onDeleted={onLogout} onClose={() => setDeleting(false)} />}
    </div>
  );
}