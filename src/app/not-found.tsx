import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[80vh] items-center bg-paper">
      <div className="nl-container grid gap-6 py-24">
        <p className="nl-label">404</p>
        <h1 className="nl-h1 max-w-[16ch]">We couldn&apos;t find that page.</h1>
        <p className="nl-lead">It may have moved. Let&apos;s get you back home.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="nl-btn"><span>Go home</span></Link>
          <Link href="/visit" className="nl-btn nl-btn--ink-ghost"><span>Plan your visit</span></Link>
        </div>
      </div>
    </main>
  );
}
