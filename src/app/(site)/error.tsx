"use client";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[70vh] items-center bg-paper pt-[var(--nl-header-h)]">
      <div className="nl-container grid gap-6 py-20">
        <p className="nl-label">Something went wrong</p>
        <h1 className="nl-h1 max-w-[18ch]">This page couldn&apos;t load right now.</h1>
        <p className="nl-lead">Please try again in a moment.</p>
        <button type="button" onClick={reset} className="nl-btn w-fit"><span>Try again</span></button>
      </div>
    </section>
  );
}
