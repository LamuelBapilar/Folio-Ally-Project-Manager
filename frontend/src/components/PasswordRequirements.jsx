import { Check } from "lucide-react";
import { PASSWORD_RULES } from "../utils/passwordRules";

export default function PasswordRequirements({ password }) {
  return (
    <ul aria-label="Password requirements" className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
      {PASSWORD_RULES.map(({ label, test }) => {
        const met = test(password);

        return (
          <li
            key={label}
            className={`flex items-center gap-1.5 text-[11px] ${
              met ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                met ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"
              }`}
            >
              {met && <Check size={9} />}
            </span>
            {label}
            <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}