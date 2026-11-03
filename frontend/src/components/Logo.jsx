import { useId } from "react";

export default function Logo({ size = 28, className = "" }) {
  // the gradient needs its own id, and React's ids contain characters SVG doesn't like
  const gradient = `folio-logo-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b84ff" />
          <stop offset="1" stopColor="#5a52e6" />
        </linearGradient>
      </defs>
      <path
        d="M16 2h26l20 20v26a14 14 0 0 1-14 14H16A14 14 0 0 1 2 48V16A14 14 0 0 1 16 2z"
        fill={`url(#${gradient})`}
      />
      <path d="M42 2l20 20H50a8 8 0 0 1-8-8V2z" fill="#fff" fillOpacity=".3" />
      <rect x="17" y="20" width="9" height="28" rx="3" fill="#fff" />
      <rect x="17" y="20" width="24" height="9" rx="3" fill="#fff" />
      <rect x="17" y="34" width="17" height="8" rx="3" fill="#fff" fillOpacity=".85" />
    </svg>
  );
}