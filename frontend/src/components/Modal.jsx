import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * <Modal> is the shell every window in Folio should use. It handles the parts that are
 * easy to forget and boring to copy:
 *   - the dim backdrop (the themed `bg-scrim` color, so dark mode works)
 *   - clicking the backdrop, or pressing Escape, closes the window
 *   - with several windows stacked, Escape only closes the top one
 *   - keyboard focus moves into the window, and goes back to the button that opened it
 *   - the accessibility attributes screen readers need
 *
 * Usage:
 *   <Modal labelledBy="my-title" onClose={close}>
 *     <form className="space-y-4 p-5">
 *       <ModalHeader icon={Pencil} title="My window" titleId="my-title" onClose={close} />
 *       ...your content...
 *     </form>
 *   </Modal>
 *
 * Props:
 *   labelledBy   id of the element that holds the title (needed for screen readers)
 *   describedBy  optional id of the element that holds the message
 *   onClose      called when the person dismisses the window
 *   dismissible  set to false while saving, so the window can't be closed mid-request
 *   size         "sm" | "md" | "lg"  (maximum width)
 *   role         "dialog" normally, "alertdialog" for destructive questions
 *   className    extra classes for the panel (the panel has NO padding: add it to your content)
 */

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-3xl" };

export default function Modal({
  labelledBy,
  describedBy,
  onClose,
  dismissible = true,
  size = "sm",
  role = "dialog",
  className = "",
  children,
}) {
  const panelRef = useRef(null);

  // The element that had focus BEFORE the window opened (usually the button you clicked).
  // We read it during the very first render: by the time effects run, an input with
  // `autoFocus` inside the window has already taken the focus, and we would remember
  // the wrong element.
  const [opener] = useState(() => document.activeElement);

  // Focus: move it into the window when it opens, and give it back when it closes.
  useEffect(() => {
    const panel = panelRef.current;

    // Don't steal focus from an input that already has `autoFocus`.
    if (panel && !panel.contains(document.activeElement)) panel.focus();

    return () => {
      // The opener may be gone (for example, a card that was just deleted).
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  // Escape closes the window, but only if it is the top-most one.
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape" || !dismissible) return;

      // Every open window marks itself aria-modal. The last one in the page is on top.
      const open = document.querySelectorAll('[aria-modal="true"]');
      if (open[open.length - 1] !== panelRef.current) return;

      onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismissible, onClose]);

  return (
    // The backdrop. Clicking it (but not the panel) closes the window.
    <div
      onClick={dismissible ? onClose : undefined}
      className="fixed inset-0 z-50 grid place-items-center bg-scrim p-4"
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        // Stop clicks inside the panel from reaching the backdrop.
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${SIZES[size]} rounded-2xl bg-canvas shadow-xl focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// Tailwind only keeps class names it can read in full, so these are written out, not built.
const ICON_TONES = {
  brand: "bg-brand-soft text-brand",
  danger: "bg-red-100 text-red-600",
};

/**
 * The standard window header: a round icon, the title, and a close button, in one row.
 * `subtitle` is optional small text under the title (for example a board name).
 */
export function ModalHeader({
  icon: Icon,
  tone = "brand",
  title,
  titleId,
  subtitle,
  onClose,
  closeDisabled = false,
}) {
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${ICON_TONES[tone]}`}
        >
          <Icon size={16} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h2 id={titleId} className="break-words text-base font-bold leading-snug">
          {title}
        </h2>
        {subtitle && <p className="truncate text-[11px] text-slate-500">{subtitle}</p>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close"
          className="shrink-0 self-start text-slate-500 hover:text-slate-900 disabled:opacity-40"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}