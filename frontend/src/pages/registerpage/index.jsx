import { useState } from "react";
import { Link } from "react-router-dom";
import { parseError } from "../../API/api";
import { register } from "../../API/login";
import AuthLayout, { SubmitButton } from "../../components/AuthLayout";
import Field from "../../components/Field";
import { useCountdown } from "../../hooks/useCountdown";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
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

    // the confirm field is only a typo check: Laravel never sees it
    if (form.password !== form.confirm) {
      setErrors({ fields: { confirm: "Passwords do not match." }, form: "" });
      return;
    }

    setErrors({ fields: {}, form: "" });
    setLoading(true);

    try {
      const user = await register(form.name, form.email, form.password);
      onRegister(user);
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
      title="Create your account"
      subtitle="Start organizing your work with Folio."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-dark hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {formError}
          </div>
        )}

        <Field
          label="Name"
          id="name"
          autoComplete="name"
          autoFocus
          placeholder="Your name"
          value={form.name}
          onChange={set("name")}
          error={errors.fields.name}
          required
        />

        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
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
          autoComplete="new-password"
          placeholder="Create a password"
          hint="At least 8 characters, with upper and lower case letters and a number."
          value={form.password}
          onChange={set("password")}
          error={errors.fields.password}
          required
        />

        <Field
          label="Confirm password"
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.fields.confirm}
          required
        />

        <SubmitButton loading={loading} loadingText="Creating account..." wait={remaining}>
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  );
}