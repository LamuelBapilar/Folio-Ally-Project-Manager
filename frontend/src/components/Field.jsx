import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Field({ label, id, error, hint, type = "text", ...props }) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
            isPassword ? "pr-9" : ""
          } ${error ? "border-red-400" : "border-brand-muted/50"}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg text-slate-500 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
          >
            {shown ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}