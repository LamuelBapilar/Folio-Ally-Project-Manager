import {
    Bug,
    ClipboardCheck,
    FileText,
    FlaskConical,
    Palette,
    Sparkles,
    Tag,
    TrendingUp,
  } from "lucide-react";
  
  export const CATEGORIES = [
    { value: "bug", label: "Bug", icon: Bug, tone: "bg-rose-100 text-rose-600" },
    { value: "feature", label: "Feature", icon: Sparkles, tone: "bg-violet-100 text-violet-600" },
    { value: "improvement", label: "Improvement", icon: TrendingUp, tone: "bg-sky-100 text-sky-600" },
    { value: "task", label: "Task", icon: ClipboardCheck, tone: "bg-emerald-100 text-emerald-600" },
    { value: "design", label: "Design", icon: Palette, tone: "bg-pink-100 text-pink-600" },
    { value: "research", label: "Research", icon: FlaskConical, tone: "bg-amber-100 text-amber-700" },
    { value: "docs", label: "Docs", icon: FileText, tone: "bg-slate-200 text-slate-700" },
  ];
  
  export const UNDEFINED_CATEGORY = {
    value: "",
    label: "Undefined",
    icon: Tag,
    tone: "bg-slate-100 text-slate-400",
  };
  
  // a story with no category (or an unknown one) is "Undefined"
  export function getCategory(value) {
    return CATEGORIES.find((c) => c.value === value) ?? UNDEFINED_CATEGORY;
  }