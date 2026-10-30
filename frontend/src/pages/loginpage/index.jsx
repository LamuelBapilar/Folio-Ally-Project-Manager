import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { parseError } from "../../API/api";
import { login } from "../../API/login";
import AuthLayout, { SubmitButton } from "../../components/AuthLayout";
import Field from "../../components/Field";
import { useCountdown } from "../../hooks/useCountdown";

export default function Login({ onLogin }) {
  const location = useLocation();
  const expired = location.state?.expired;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ fields: {}, form: "" });
  const [loading, setLoading] = useState(false);
  const { remaining, start } = useCountdown();

  // the "too many attempts" box goes away on its own when the wait is over
  const limitOver = !!errors.retryAfter && remaining === 0;
  const formError = limitOver ? "" : errors.form;

  // update one field, and clear its error as soon as the person starts fixing it
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [key]: undefined } }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (remaining > 0) return;

    setErrors({ fields: {}, form: "" });
    setLoading(true);

    try {
      const user = await login(form.email, form.password);
      onLogin(user);
    } catch (err) {
      const parsed = parseError(err);
      setErrors(parsed);
      if (parsed.retryAfter) start(parsed.retryAfter);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New to Folio?{" "}
          <Link to="/register" className="font-semibold text-brand-dark hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {expired && !formError && (
          <div
            role="status"
            className="rounded-lg border border-brand-muted/50 bg-brand-soft px-3 py-2 text-xs text-slate-700"
          >
            Your session expired. Please log in again.
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {formError}
          </div>
        )}

        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="name@example.com"
          value={form.email}
          onChange={set("email")}
          error={errors.fields.email}
          required
        />

        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={set("password")}
          error={errors.fields.password}
          required
        />

        <SubmitButton loading={loading} loadingText="Logging in..." wait={remaining}>
          Log in
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}