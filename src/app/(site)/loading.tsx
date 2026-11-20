export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center pt-[var(--nl-header-h)]" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-green" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
