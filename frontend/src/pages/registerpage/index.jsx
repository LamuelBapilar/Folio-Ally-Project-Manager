import { useState } from "react";
import { Link } from "react-router-dom";
import { parseError } from "../../API/api";
import { register } from "../../API/login";
import AuthLayout, { SubmitButton } from "../../components/AuthLayout";
import Field from "../../components/Field";
import PasswordRequirements from "../../components/PasswordRequirements";
import { useCountdown } from "../../hooks/useCountdown";
import { passwordIsValid } from "../../utils/passwordRules";

/**
 * The sign-up page. Checks run in two places:
 *   1. here, in the browser, so mistakes are caught instantly (password rules, matching passwords)
 *   2. on the server, which is the one that really decides (for example "email already taken")
 *
 * Props:
 *   onRegister(user)  called with the new user after a successful sign-up
 */
export default function Register({ onRegister }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  // errors.fields holds a message per field ({ email: "..." }); errors.form holds a general one.
  const [errors, setErrors] = useState({ fields: {}, form: "" });
  const [loading, setLoading] = useState(false);

  // If the server says "too many attempts", this counts the wait down.
  const { remaining, start } = useCountdown();

  // The "too many attempts" box goes away on its own when the wait is over.
  const limitOver = !!errors.retryAfter && remaining === 0;
  const formError = limitOver ? "" : errors.form;

  // Makes a change handler for one field, and clears that field's error as soon as
  // the person starts fixing it.
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, fields: { ...prev.fields, [key]: undefined } }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (remaining > 0) return; // still waiting after "too many attempts"

    if (!passwordIsValid(form.password)) {
      setErrors({
        fields: { password: "Your password doesn't meet all the requirements yet." },
        form: "",
      });
      return;
    }

    // The confirm field is only a typo check: the server never sees it.
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
          maxLength={255}
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

        {/* The checklist sits right under the password field and ticks as you type. */}
        <div>
          <Field
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            placeholder="Create a password"
            value={form.password}
            onChange={set("password")}
            error={errors.fields.password}
            required
          />
          <PasswordRequirements password={form.password} />
        </div>

        <Field
          label="Confirm password"
          id="confirm"
          type="password"
          autoComplete="new-password"
          maxLength={72}
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