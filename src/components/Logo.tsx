/** Brand mark: two opposing arrows (convert) on a rounded indigo tile. Mirrors src/app/icon.svg. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="LocalConvert logo">
      <rect width="64" height="64" rx="14" fill="#4f46e5" />
      <g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3 4 7l4 4" />
        <path d="M4 7h16" />
        <path d="m16 21 4-4-4-4" />
        <path d="M20 17H4" />
      </g>
    </svg>
  );
}
