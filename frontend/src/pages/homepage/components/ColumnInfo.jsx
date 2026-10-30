import { useId, useState } from "react";
import { CircleAlert } from "lucide-react";

export default function ColumnInfo({ title, description }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();

  return (
    <div className="relative h-6 w-6 shrink-0">
      <button
        type="button"
        aria-label={`About ${title}`}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="grid h-full w-full place-items-center rounded-md text-slate-600 transition-colors hover:bg-white/70 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
      >
        <CircleAlert size={16} />
      </button>

      {open && (
        <div
          id={tipId}
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg bg-slate-900 p-2.5 text-[10px] leading-relaxed text-white shadow-lg"
        >
          <p className="mb-0.5 font-semibold">{title}</p>
          {description}
        </div>
      )}
    </div>
  );
}