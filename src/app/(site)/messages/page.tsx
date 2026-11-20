import type { Metadata } from "next";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { getSermonCategories, getSermons, youTubeId } from "@/lib/content";
import { SermonCard } from "@/components/site/sermon-card";
import { VideoEmbed } from "@/components/site/video-embed";
import { formatSermonDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Messages & Sermons",
  description: "Watch messages from Pastor Charles Mugisha and the New Life family. Search by title, speaker, series or scripture.",
  alternates: { canonical: "/messages" },
};

type SP = Promise<{ q?: string; category?: string; speaker?: string; series?: string }>;

export default async function MessagesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const filtered = Boolean(q || sp.category || sp.speaker || sp.series);
  const [all, categories] = await Promise.all([getSermons(), getSermonCategories()]);
  const list = filtered ? await getSermons({ q, category: sp.category, speaker: sp.speaker, series: sp.series }) : all;
  const featured = all.find((s) => s.isFeatured) ?? all[0];
  const speakers = [...new Set(all.map((s) => s.speakerName).filter(Boolean))].sort();
  const series = [...new Set(all.map((s) => s.series).filter(Boolean) as string[])];
  const fid = featured ? youTubeId(featured.videoUrl) : null;

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const next = { q: q || undefined, category: sp.category, speaker: sp.speaker, series: sp.series, ...patch };
    Object.entries(next).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/messages${s ? `?${s}` : ""}#library`;
  };

  return (
    <>
      <section className="bg-ink pb-[clamp(3rem,8vh,5rem)] pt-[calc(var(--nl-header-h)+clamp(2.5rem,6vh,4.5rem))] text-white">
        <div className="nl-container">
          <p className="nl-label nl-label--light mb-6">Messages &amp; Sermons</p>
          <h1 className="nl-display max-w-[14ch] !text-[clamp(2.4rem,5vw,4.75rem)]">Hear the Word.</h1>
          {featured && (
            <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                {fid ? <VideoEmbed videoId={fid} title={featured.title} thumbnail={featured.thumbnail} /> : null}
              </div>
              <div className="grid gap-4 lg:col-span-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">Featured message</p>
                <h2 className="text-[clamp(1.6rem,2.6vw,2.3rem)] font-medium leading-tight tracking-tight">{featured.title}</h2>
                <p className="text-white/70">{featured.speakerName} · {formatSermonDate(featured.preachedOn)}</p>
                {featured.description && <p className="text-white/70">{featured.description}</p>}
                <Link href={`/messages/${featured.slug}`} className="nl-btn nl-btn--ghost mt-2 w-fit"><span>Message details</span></Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="library" className="nl-section scroll-mt-16">
        <div className="nl-container">
          <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3">
              <p className="nl-label">Library</p>
              <h2 className="nl-h2">All messages</h2>
            </div>
            <form action="/messages" method="get" role="search" className="flex w-full max-w-md" aria-label="Search messages">
              {sp.category && <input type="hidden" name="category" value={sp.category} />}
              <label htmlFor="sermon-q" className="sr-only">Search messages</label>
              <input id="sermon-q" name="q" defaultValue={q} placeholder="Search title, speaker, scripture…" className="nl-input" maxLength={100} />
              <button type="submit" className="flex w-14 shrink-0 items-center justify-center bg-blue-deep text-white hover:bg-blue hover:text-blue-ink" aria-label="Search"><Search className="h-5 w-5" /></button>
            </form>
          </div>

          <div className="mb-10 grid gap-4 border-y border-line py-5">
            <FilterRow label="Category" items={categories.map((c) => ({ label: c.name, value: c.slug }))} current={sp.category} make={(v) => href({ category: v })} />
            {speakers.length > 1 && <FilterRow label="Speaker" items={speakers.map((s) => ({ label: s, value: s }))} current={sp.speaker} make={(v) => href({ speaker: v })} />}
            {series.length > 0 && <FilterRow label="Series" items={series.map((s) => ({ label: s, value: s }))} current={sp.series} make={(v) => href({ series: v })} />}
            {filtered && <Link href="/messages#library" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-deep"><X className="h-4 w-4" aria-hidden />Clear filters</Link>}
          </div>

          <p className="mb-6 text-sm text-muted" role="status">{list.length} message{list.length === 1 ? "" : "s"}{q ? ` for “${q}”` : ""}</p>
          {list.length === 0 ? (
            <div className="border border-dashed border-line p-12 text-center">
              <p className="text-lg text-ink">No messages match your search.</p>
              <Link href="/messages#library" className="nl-textlink mt-3">Show all messages</Link>
            </div>
          ) : (
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((s, i) => <li key={s.id} className="nl-reveal" style={{ ["--d" as string]: `${(i % 3) * 0.05}s` }}><SermonCard s={s} /></li>)}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function FilterRow({ label, items, current, make }: { label: string; items: { label: string; value: string }[]; current?: string; make: (v?: string) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 w-20 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</span>
      <Link href={make(undefined)} aria-current={!current ? "true" : undefined} className={`border px-3 py-1.5 text-sm transition-colors ${!current ? "border-blue-deep bg-blue-deep text-white" : "border-line text-ink hover:border-blue"}`}>All</Link>
      {items.map((it) => (
        <Link key={it.value} href={make(it.value)} aria-current={current === it.value ? "true" : undefined}
          className={`border px-3 py-1.5 text-sm transition-colors ${current === it.value ? "border-blue-deep bg-blue-deep text-white" : "border-line text-ink hover:border-blue"}`}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}
