import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

/**
 * The "Appearance" tab of the account window: pick Light, Dark, or System.
 * The choice is saved in this browser (see hooks/useTheme.js), so it applies at once.
 */

// One entry per radio card. To add a theme, add it here and in useTheme.js / index.css.
const CHOICES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

// The previews use plain hex colors on purpose. If they used theme colors, the "Light" card
// would look dark whenever dark mode is on, and it would not show what you're choosing.
const PALETTES = {
  light: { page: "#f4f4fd", card: "#ffffff", line: "#e8e6ff", accent: "#6c63ff" },
  dark: { page: "#101018", card: "#1b1b2d", line: "#24214a", accent: "#7a72ff" },
};

// A tiny drawing of the app: a purple bar, and a card with two lines of text.
function MiniScreen({ palette }) {
  return (
    <div className="h-full p-2" style={{ background: palette.page }}>
      <div className="h-2 w-8 rounded" style={{ background: palette.accent }} />
      <div className="mt-2 space-y-1 rounded-md p-1.5" style={{ background: palette.card }}>
        <div className="h-1.5 w-full rounded" style={{ background: palette.line }} />
        <div className="h-1.5 w-2/3 rounded" style={{ background: palette.line }} />
      </div>
    </div>
  );
}

function Preview({ value }) {
  // "System" shows half light, half dark.
  if (value === "system") {
    return (
      <div className="grid h-full grid-cols-2">
        <MiniScreen palette={PALETTES.light} />
        <MiniScreen palette={PALETTES.dark} />
      </div>
    );
  }

  return <MiniScreen palette={PALETTES[value]} />;
}

export default function AppearanceTab() {
  const { preference, resolved, setPreference } = useTheme();

  return (
    <div className="space-y-5">
      <div className="pr-8">
        <h3 className="text-base font-bold">Appearance</h3>
        <p className="mt-0.5 text-xs text-slate-500">Choose how Folio looks on this device.</p>
      </div>

      {/* Real radio inputs: the browser gives us arrow-key navigation and screen reader
          support for free. The input is visually hidden, and the card next to it is styled
          with Tailwind's `peer-checked:` and `peer-focus-visible:`. */}
      <fieldset>
        <legend className="sr-only">Theme</legend>

        <div className="grid gap-3 sm:grid-cols-3">
          {CHOICES.map(({ value, label, icon: Icon }) => (
            <label key={value} className="block cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={preference === value}
                onChange={() => setPreference(value)}
                className="peer sr-only"
              />

              <span className="block overflow-hidden rounded-xl border-2 border-brand-muted/40 bg-surface transition-colors hover:border-brand-muted peer-checked:border-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand">
                <span className="block h-20">
                  <Preview value={value} />
                </span>

                <span className="flex items-center gap-2 px-3 py-2 text-xs font-semibold">
                  <Icon size={14} className="text-brand" />
                  {label}
                  {preference === value && <Check size={13} className="ml-auto text-brand" />}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-[11px] leading-relaxed text-slate-500">
        {preference === "system"
          ? `Following your device: it is currently ${resolved}. `
          : ""}
        This is saved on this device only. The home, login, and sign-up pages always stay light.
      </p>
    </div>
  );
}