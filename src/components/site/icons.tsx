/** Long arrow used on primary CTAs (ai.gov.rw style). */
export function LongArrow({ className = "h-4 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" className={className} aria-hidden>
      <path d="M0 8h45M38 1l7 7-7 7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
