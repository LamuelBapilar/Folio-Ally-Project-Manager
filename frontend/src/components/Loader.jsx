import { useId } from "react";
import { useTheme } from "../hooks/useTheme";

/**
 * Two loading indicators with the Folio look:
 *   <LoadingScreen />  the full page, shown while the app checks who you are
 *   <InlineLoader />   a small one, for a part of the page that is still loading
 *
 * Both are built on <AnimatedMark />: the Folio logo whose three white bars draw
 * themselves one after another. The animation itself lives in index.css
 * (.folio-draw-x, .folio-draw-y, .folio-slide) and switches off when the device
 * asks for reduced motion.
 */

// The Folio mark, with its three bars drawing themselves.
export function AnimatedMark({ size = 64 }) {
  // The gradient needs its own id, and React's ids contain characters SVG doesn't like.
  const gradient = `folio-load-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b84ff" />
          <stop offset="1" stopColor="#5a52e6" />
        </linearGradient>
      </defs>

      {/* The page shape, and its folded corner */}
      <path
        d="M16 2h26l20 20v26a14 14 0 0 1-14 14H16A14 14 0 0 1 2 48V16A14 14 0 0 1 16 2z"
        fill={`url(#${gradient})`}
      />
      <path d="M42 2l20 20H50a8 8 0 0 1-8-8V2z" fill="#fff" fillOpacity=".3" />

      {/* The three bars of the "F". animationDelay staggers them: stem, top bar, middle bar. */}
      <rect
        className="folio-draw-y"
        x="17"
        y="20"
        width="9"
        height="28"
        rx="3"
        fill="#fff"
        style={{ animationDelay: "0ms" }}
      />
      <rect
        className="folio-draw-x"
        x="17"
        y="20"
        width="24"
        height="9"
        rx="3"
        fill="#fff"
        style={{ animationDelay: "180ms" }}
      />
      <rect
        className="folio-draw-x"
        x="17"
        y="34"
        width="17"
        height="8"
        rx="3"
        fill="#fff"
        fillOpacity=".85"
        style={{ animationDelay: "360ms" }}
      />
    </svg>
  );
}

// The full-page version, shown while the app is checking who you are.
export default function LoadingScreen({ message = "Loading your workspace" }) {
  // This screen shows BEFORE the app mounts, so it applies the saved theme itself
  // (otherwise dark-mode users would see a white flash first).
  const { resolved } = useTheme();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`dot-grid grid min-h-dvh place-items-center bg-canvas text-slate-900 ${
        resolved === "dark" ? "dark" : ""
      }`}
    >
      {/* Waits a moment before appearing, so a fast load never flashes. */}
      <div
        className="flex flex-col items-center motion-safe:animate-board-in"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <div className="relative grid h-24 w-24 place-items-center">
          {/* Two soft rings that pulse outward. Hidden when motion is reduced. */}
          <span
            aria-hidden="true"
            className="absolute inset-3 hidden rounded-[1.1rem] bg-brand/25 motion-safe:block motion-safe:animate-ping"
            style={{ animationDuration: "1.8s" }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-3 hidden rounded-[1.1rem] bg-brand/20 motion-safe:block motion-safe:animate-ping"
            style={{ animationDuration: "1.8s", animationDelay: "0.9s" }}
          />

          <div className="relative motion-safe:animate-float" style={{ animationDuration: "3.2s" }}>
            <AnimatedMark size={64} />
          </div>
        </div>

        <p className="mt-2 text-2xl font-medium text-brand">Folio</p>

        {/* A purple bar that slides across a lavender track */}
        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-brand-soft">
          <div className="folio-slide h-full w-2/5 rounded-full bg-brand" />
        </div>

        <p className="mt-3 text-xs text-slate-500">{message}</p>
      </div>
    </div>
  );
}

// The small version, for a part of the page that is still loading.
// It sits inside the app, so it follows the app's theme automatically.
export function InlineLoader({ message = "Loading", className = "" }) {
  return (
    <div role="status" aria-live="polite" className={`grid flex-1 place-items-center py-10 ${className}`}>
      <div
        className="flex flex-col items-center motion-safe:animate-board-in"
        style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
      >
        <AnimatedMark size={40} />
        <p className="mt-3 text-xs text-slate-500">{message}</p>
      </div>
    </div>
  );
}