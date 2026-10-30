import { useEffect, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Clock,
  GripVertical,
  Layers,
  ListChecks,
  RotateCcw,
  SlidersHorizontal,
  Star,
  StickyNote,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

// Real feedback goes here. Delete the sample entries and add yours.
// Each entry: name, handle (optional), quote, rating (1 to 5), avatar (optional image URL)
// Entries with sample: true show a "Sample" badge. Remove that line for real ones.
// An empty list hides the whole section and its nav link.
const TESTIMONIALS = [
  {
    name: "John Michael",
    handle: "@johnmichael",
    quote: "Replace this with a real quote from someone who used Folio.",
    rating: 5,
    sample: true,
  },
  {
    name: "Rebecca lane",
    handle: "@R_lane",
    quote: "Short and specific works best, like what changed in their day.",
    rating: 5,
    sample: true,
  },
  {
    name: "Ray Fuentes",
    handle: "@FuentesRay",
    quote: "Ask for permission before using anyone's name or photo.",
    rating: 4,
    sample: true,
  },
];

const NAV = [
  ["Features", "features"],
  ["How it works", "how"],
  ["Try it", "demo"],
  ...(TESTIMONIALS.length > 0 ? [["Testimonials", "testimonials"]] : []),
  ["FAQ", "faq"],
];

const FEATURES = [
  {
    icon: GripVertical,
    title: "Drag and drop",
    text: "Move stories between BackLog, To do, In Progress, and Done. Your order is saved.",
  },
  {
    icon: ListChecks,
    title: "Progress tracking",
    text: "Slide a story from 0 to 100% and see it on the card at a glance.",
  },
  {
    icon: Clock,
    title: "Priorities and deadlines",
    text: "Mark stories Low, Medium, or High, and see how many days are left.",
  },
  {
    icon: SlidersHorizontal,
    title: "Search and filters",
    text: "Find any story fast, or filter by priority and due date.",
  },
  {
    icon: Users,
    title: "Share your boards",
    text: "Invite teammates by email so everyone works on the same board.",
  },
  {
    icon: Layers,
    title: "Multiple boards",
    text: "Keep a separate board for every project and switch between them.",
  },
];

const STEPS = [
  {
    title: "Create a board",
    text: "Start a board for a project. Folio sets up four columns for you.",
  },
  {
    title: "Add your stories",
    text: "Give each story a title, a priority, a due date, and a description.",
  },
  {
    title: "Move and share",
    text: "Drag stories as work moves forward, and invite your team to join in.",
  },
];

const FAQS = [
  {
    q: "What is a kanban board?",
    a: "It's a board with columns that show where each piece of work stands. Stories start in BackLog and move to the right until they reach Done.",
  },
  {
    q: "Can I share a board with other people?",
    a: "Yes. Press Share on a board and invite someone by email. They see the invitation in Folio and can accept or decline it.",
  },
  {
    q: "What can people I invite do?",
    a: "Members can add, edit, move, and delete stories. Only the board owner can invite or remove people, and members can leave a board whenever they like.",
  },
  {
    q: "Does the person I invite need an account?",
    a: "Yes. They sign up with the same email address you invited, and the invitation is waiting for them when they log in.",
  },
  {
    q: "Who can see my boards?",
    a: "Only you and the people you invite. Other accounts can't open your boards.",
  },
  {
    q: "Will Folio have notes?",
    a: "Yes, notes are the next feature we're building, right beside your boards.",
  },
];

const DEMO_COLUMNS = [
  { id: "backlog", title: "BackLog" },
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const DEMO_PRIORITY = {
  none: { label: "Undefined", style: "bg-slate-100 text-slate-500" },
  low: { label: "Low", style: "bg-low/15 text-low" },
  medium: { label: "Medium", style: "bg-medium/20 text-medium" },
  high: { label: "High", style: "bg-high/15 text-high" },
};

const DEMO_STORIES = {
  backlog: [
    { id: "d1", title: "Plan the launch", priority: "none", progress: 0 },
    { id: "d2", title: "Write the docs", priority: "low", progress: 10 },
  ],
  todo: [
    { id: "d3", title: "Design the landing page", priority: "medium", progress: 25 },
    { id: "d4", title: "Set up analytics", priority: "low", progress: 40 },
  ],
  in_progress: [
    { id: "d5", title: "Build the sign-up flow", priority: "high", progress: 70 },
    { id: "d6", title: "Review pull requests", priority: "medium", progress: 50 },
  ],
  done: [
    { id: "d7", title: "Choose the color palette", priority: "low", progress: 100 },
    { id: "d8", title: "Set up the repo", priority: "high", progress: 100 },
  ],
};

// fades a block in the first time it scrolls into view
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      className={`${visible ? "motion-safe:animate-card-in" : "motion-safe:opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

// sets --mx and --my (-0.5 to 0.5) on an element as the pointer moves over it
function useParallax() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduced) return;

    let frame = 0;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--mx", x.toFixed(3));
        el.style.setProperty("--my", y.toFixed(3));
      });
    }

    function onLeave() {
      cancelAnimationFrame(frame);
      el.style.setProperty("--mx", "0");
      el.style.setProperty("--my", "0");
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}

// a card that lifts on hover and shows a soft purple glow under the cursor
function SpotlightCard({ children, className = "" }) {
  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      onPointerMove={onMove}
      className={`group relative overflow-hidden rounded-2xl border border-brand-muted/40 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-brand-muted hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-base leading-relaxed text-slate-600">{text}</p>}
    </div>
  );
}

// a small drawn board inside the tablet frame, purely decorative
function TabletMock() {
  const columns = [
    {
      title: "To do",
      cards: [
        { tag: "bg-medium", line: "w-3/4", progress: "w-1/3" },
        { tag: "bg-low", line: "w-2/3", progress: "w-1/2" },
      ],
    },
    {
      title: "In Progress",
      cards: [
        { tag: "bg-high", line: "w-4/5", progress: "w-2/3" },
        { tag: "bg-medium", line: "w-3/5", progress: "w-1/4" },
      ],
    },
    {
      title: "Done",
      cards: [
        { tag: "bg-low", line: "w-1/2" },
        { tag: "bg-low", line: "w-2/3" },
        { tag: "bg-medium", line: "w-3/5" },
      ],
    },
  ];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[1.75rem] border-[6px] border-slate-900 bg-canvas shadow-2xl"
    >
      <div className="flex items-center justify-between bg-white px-4 py-2.5">
        <span className="text-xs font-medium text-brand">Folio</span>
        <span className="h-1.5 w-16 rounded bg-brand-soft" />
      </div>

      <div className="grid grid-cols-3 gap-2.5 p-3 pb-16">
        {columns.map((col) => (
          <div key={col.title} className="space-y-2 rounded-xl bg-brand-soft p-2">
            <p className="text-[9px] font-semibold">{col.title}</p>

            {col.cards.map((card, i) => (
              <div key={i} className="space-y-1.5 rounded-lg bg-white p-2 shadow-sm">
                <div className={`h-1.5 w-6 rounded ${card.tag}`} />
                <div className={`h-1.5 rounded bg-brand-soft ${card.line}`} />
                {card.progress && (
                  <div className="h-1 w-full rounded-full bg-brand-soft">
                    <div
                      className={`h-1 origin-left rounded-full bg-brand motion-safe:animate-grow ${card.progress}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoCard({ story, index, done }) {
  const priority = DEMO_PRIORITY[story.priority];

  return (
    <Draggable draggableId={story.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2 select-none"
        >
          <div
            className={`rounded-lg border bg-white p-2.5 transition-shadow ${
              snapshot.isDragging
                ? "border-brand shadow-xl"
                : "border-brand-muted/40 shadow-sm hover:shadow-md"
            }`}
          >
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${priority.style}`}
            >
              {priority.label}
            </span>

            <p className="mt-1.5 text-xs font-semibold leading-snug">{story.title}</p>

            {/* finished stories show no progress, just like in the app */}
            {!done && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-brand-soft">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${story.progress}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-500">
                  {story.progress}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// a real, working board that lives only in this page's memory
function DemoBoard() {
  const [columns, setColumns] = useState(DEMO_STORIES);
  const [moves, setMoves] = useState(0);

  function onDragEnd({ source, destination }) {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    setColumns((prev) => {
      const next = { ...prev };
      const from = Array.from(next[source.droppableId]);
      const [moved] = from.splice(source.index, 1);

      if (source.droppableId === destination.droppableId) {
        from.splice(destination.index, 0, moved);
        next[source.droppableId] = from;
      } else {
        const to = Array.from(next[destination.droppableId]);
        to.splice(destination.index, 0, moved);
        next[source.droppableId] = from;
        next[destination.droppableId] = to;
      }

      return next;
    });

    setMoves((m) => m + 1);
  }

  function reset() {
    setColumns(DEMO_STORIES);
    setMoves(0);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-muted/50 bg-white shadow-2xl">
      <div className="flex items-center gap-2 border-b border-brand-soft bg-white px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-high" />
        <span className="h-2.5 w-2.5 rounded-full bg-medium" />
        <span className="h-2.5 w-2.5 rounded-full bg-low" />
        <span className="ml-3 text-xs font-medium text-brand">Folio</span>
        <span className="ml-2 h-3 w-px bg-brand-muted/60" />
        <span className="text-xs font-semibold">Product launch</span>

        {moves > 0 && (
          <button
            type="button"
            onClick={reset}
            className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 gap-3 bg-canvas p-4 md:grid-cols-4">
          {DEMO_COLUMNS.map((col) => (
            <div key={col.id} className="rounded-xl bg-brand-soft p-2.5">
              <p className="mb-2 px-0.5 text-xs font-semibold">
                {col.title}{" "}
                <span className="font-normal text-slate-500">{columns[col.id].length}</span>
              </p>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-28 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? "bg-brand/10" : ""
                    }`}
                  >
                    {columns[col.id].map((story, index) => (
                      <DemoCard
                        key={story.id}
                        story={story}
                        index={index}
                        done={col.id === "done"}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function StoryPreview() {
  return (
    <div className="w-56 rounded-2xl border border-dashed border-brand-muted bg-white p-4 shadow-xl">
      <span className="rounded bg-high/15 px-1.5 py-0.5 text-[9px] font-semibold text-high">
        High
      </span>
      <p className="mt-2 text-sm font-semibold leading-snug">Design system research</p>

      <div className="mt-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full w-3/5 origin-left rounded-full bg-brand motion-safe:animate-grow" />
        </div>
        <span className="text-[10px] font-medium text-slate-500">60%</span>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
        <Clock size={11} />3 days
      </div>
    </div>
  );
}

function ShareCard() {
  return (
    <div className="flex w-56 items-center gap-3 rounded-2xl border border-dashed border-brand-muted bg-white p-4 shadow-xl">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
        <UserPlus size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">Board shared</p>
        <p className="text-xs text-slate-500">A teammate accepted your invite</p>
      </div>
    </div>
  );
}

function TestimonialCard({ name, handle, quote, rating = 5, avatar, sample }) {
  const stars = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <figure className="relative flex h-full flex-col rounded-2xl border border-dashed border-brand-muted bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {sample && (
        <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          Sample
        </span>
      )}

      <figcaption className="flex items-center gap-3 pr-14">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
          >
            {name?.charAt(0).toUpperCase()}
          </span>
        )}

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{name}</span>
          {handle && (
            <span className="block truncate text-xs text-slate-500">{handle}</span>
          )}
        </span>
      </figcaption>

      <div
        role="img"
        aria-label={`${stars} out of 5 stars`}
        className="mt-3 flex gap-0.5 text-medium"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={14}
            aria-hidden="true"
            fill={i < stars ? "currentColor" : "none"}
            className={i < stars ? "" : "text-slate-300"}
          />
        ))}
      </div>

      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">
        “{quote}”
      </blockquote>
    </figure>
  );
}

function Faq({ id, q, a, open, onToggle }) {
  return (
    <div
      className={`rounded-xl border bg-white transition-colors ${
        open ? "border-brand-muted shadow-sm" : "border-brand-muted/40"
      }`}
    >
      <h3>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand"
        >
          {q}
          <ChevronDown
            size={16}
            className={`shrink-0 text-brand transition-transform duration-300 motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const heroRef = useParallax();
  const barRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  // scroll progress bar, header shadow, and the back to top button
  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const progress = max > 0 ? window.scrollY / max : 0;

      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      setScrolled(window.scrollY > 8);
      setShowTop(window.scrollY > 600);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // highlight the nav link of the section you are reading
  useEffect(() => {
    const ids = ["hero", "features", "how", "demo", "testimonials", "faq"];
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id === "hero" ? "" : entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-white text-slate-900">
      <header
        className={`sticky top-0 z-40 border-b bg-white/85 backdrop-blur transition-shadow duration-300 ${
          scrolled ? "border-brand-soft shadow-sm" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <a href="#top" className="text-2xl font-medium text-brand">
            Folio
          </a>

          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {NAV.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={active === id ? "location" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active === id
                    ? "bg-brand-soft text-brand"
                    : "text-slate-600 hover:bg-brand-soft hover:text-brand"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-soft"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>

        {/* scroll progress */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5">
          <div
            ref={barRef}
            className="h-full origin-left bg-brand"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>

      <main id="top">
        {/* hero */}
        <section
          id="hero"
          ref={heroRef}
          className="relative isolate mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-10 lg:grid-cols-2 lg:pt-20"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-10 -z-10 h-80 w-80 rounded-full bg-brand-soft opacity-70 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 left-0 -z-10 h-64 w-64 rounded-full bg-brand-soft opacity-60 blur-3xl"
          />

          <div className="motion-safe:animate-board-in">
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Kanban boards that keep your{" "}
              <span className="text-brand">work moving.</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
              Drag stories across columns, track progress, set deadlines, and share
              boards with your team. More focused, with less clutter.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                to="/register"
                className="group inline-flex items-center gap-3 rounded-full bg-brand py-2 pl-6 pr-2 text-sm font-semibold text-white transition-all hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95"
              >
                Get started
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-brand transition-transform group-hover:translate-x-0.5">
                  <ArrowRight size={16} />
                </span>
              </Link>

              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 transition-colors hover:text-brand"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mb-12 w-full max-w-md lg:mb-0 lg:max-w-none">
            {/* the tablet tilts a little toward the pointer */}
            <div
              className="lg:ml-auto lg:w-[26rem]"
              style={{
                transform:
                  "perspective(1000px) rotateY(calc(var(--mx, 0) * 7deg)) rotateX(calc(var(--my, 0) * -5deg))",
                transition: "transform 250ms ease-out",
              }}
            >
              <TabletMock />
            </div>

            {/* board shared: appears, slides with the pointer, and floats */}
            <div
              className="absolute -top-6 right-0 motion-safe:animate-card-in sm:-right-4"
              style={{ animationDelay: "250ms" }}
            >
              <div
                style={{
                  transform:
                    "translate3d(calc(var(--mx, 0) * -24px), calc(var(--my, 0) * -18px), 0)",
                  transition: "transform 250ms ease-out",
                }}
              >
                <div
                  className="motion-safe:animate-float"
                  style={{ animationDuration: "5.5s", animationDelay: "-1s" }}
                >
                  <ShareCard />
                </div>
              </div>
            </div>

            {/* story preview: a different rhythm, so the two never move together */}
            <div
              className="absolute -bottom-10 -left-2 motion-safe:animate-card-in sm:-left-8"
              style={{ animationDelay: "400ms" }}
            >
              <div
                style={{
                  transform:
                    "translate3d(calc(var(--mx, 0) * -32px), calc(var(--my, 0) * -24px), 0)",
                  transition: "transform 250ms ease-out",
                }}
              >
                <div
                  className="motion-safe:animate-float"
                  style={{ animationDuration: "6.5s", animationDelay: "-3s" }}
                >
                  <StoryPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* features */}
        <section id="features" className="scroll-mt-16 border-t border-brand-soft bg-canvas">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <SectionHeading
                eyebrow="Features"
                title="Everything you need to run a project"
                text="Folio keeps the essentials close and leaves out the clutter."
              />
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={(i % 3) * 80}>
                  <SpotlightCard className="h-full p-5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-sm font-bold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
                  </SpotlightCard>
                </Reveal>
              ))}

              <Reveal delay={160}>
                <div className="h-full rounded-2xl border border-dashed border-brand-muted bg-white/60 p-5 transition-colors hover:bg-white">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand">
                    <StickyNote size={20} />
                  </span>
                  <h3 className="mt-4 flex items-center gap-2 text-sm font-bold">
                    Notes
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                      Coming soon
                    </span>
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    Jot down ideas and meeting notes right beside your boards.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-16">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <SectionHeading
                eyebrow="How it works"
                title="From idea to done in three steps"
              />
            </Reveal>

            <div className="relative mt-14">
              {/* the line that connects the three circles */}
              <div
                aria-hidden="true"
                className="absolute left-[16.67%] right-[16.67%] top-5 hidden h-px bg-brand-muted/50 md:block"
              />

              <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="list-none">
                    <Reveal delay={i * 100}>
                      <div className="text-center">
                        <span className="relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-bold text-white ring-8 ring-white transition-transform duration-300 hover:scale-110 motion-reduce:transition-none">
                          {i + 1}
                        </span>
                        <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600">
                          {step.text}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* interactive demo */}
        <section id="demo" className="scroll-mt-16 border-t border-brand-soft bg-canvas">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Reveal>
              <SectionHeading
                eyebrow="Try it"
                title="Drag a card. That's the whole idea."
                text="This is a working board, so go ahead and move the stories around."
              />
            </Reveal>

            <Reveal delay={120} className="mx-auto mt-12 max-w-4xl">
              <DemoBoard />
              <p className="mt-4 text-center text-xs text-slate-500">
                Prefer the keyboard? Focus a card, press Space, move it with the arrow
                keys, and press Space again to drop it.
              </p>
            </Reveal>
          </div>
        </section>

        {/* testimonials: hidden while the list is empty */}
        {TESTIMONIALS.length > 0 && (
          <section id="testimonials" className="scroll-mt-16">
            <div className="mx-auto max-w-6xl px-6 py-20">
              <Reveal>
                <SectionHeading
                  eyebrow="Testimonials"
                  title="What people say about Folio"
                />
              </Reveal>

              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {TESTIMONIALS.map((item, i) => (
                  <Reveal key={`${item.name}-${i}`} delay={(i % 3) * 80}>
                    <TestimonialCard {...item} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* faq */}
        <section id="faq" className="scroll-mt-16 border-t border-brand-soft bg-canvas">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <Reveal>
              <SectionHeading eyebrow="FAQ" title="Questions, answered" />
            </Reveal>

            <div className="mt-10 space-y-3">
              {FAQS.map((item, i) => (
                <Reveal key={item.q} delay={i * 50}>
                  <Faq
                    id={`faq-${i}`}
                    q={item.q}
                    a={item.a}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* final call to action */}
        <section className="px-6 py-20">
          <Reveal>
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-dark px-8 py-14 text-center text-white sm:px-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-white/5"
              />

              <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to get your work moving?
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed">
                Create your first board in a minute. No setup, no clutter.
              </p>

              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-brand-dark transition-all hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
                >
                  Get started
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white transition-transform group-hover:translate-x-0.5">
                    <ArrowRight size={16} />
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-brand-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-2xl font-medium text-brand">Folio</p>
            <p className="mt-1 text-xs text-slate-500">Your kanban and noting ally</p>
          </div>

          <div className="flex gap-12 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </p>
              {NAV.map(([label, id]) => (
                <a key={id} href={`#${id}`} className="block text-slate-700 hover:text-brand">
                  {label}
                </a>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Account
              </p>
              <Link to="/login" className="block text-slate-700 hover:text-brand">Log in</Link>
              <Link to="/register" className="block text-slate-700 hover:text-brand">Sign up</Link>
            </div>
          </div>
        </div>

        <p className="border-t border-brand-soft px-6 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Folio. All rights reserved.
        </p>
      </footer>

      {/* back to top */}
      <button
        type="button"
        onClick={toTop}
        aria-label="Back to top"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
        className={`fixed bottom-6 right-6 z-40 grid h-10 w-10 place-items-center rounded-full bg-brand text-white shadow-lg transition-all duration-300 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}