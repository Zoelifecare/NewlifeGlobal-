import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getSermon, getSermons, youTubeId } from "@/lib/content";
import { VideoEmbed } from "@/components/site/video-embed";
import { SermonCard } from "@/components/site/sermon-card";
import { formatSermonDate } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getSermons()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getSermon((await params).slug);
  if (!s) return { title: "Message not found" };
  return {
    title: s.title, description: s.description ?? `${s.title}, ${s.speakerName}`,
    alternates: { canonical: `/messages/${s.slug}` }, openGraph: { type: "video.other", images: s.thumbnail ? [s.thumbnail] : undefined },
  };
}

export default async function SermonPage({ params }: { params: Promise<{ slug: string }> }) {
  const s = await getSermon((await params).slug);
  if (!s) notFound();
  const all = await getSermons();
  const related = all
    .filter((x) => x.id !== s.id)
    .map((x) => ({ x, score: (x.series && x.series === s.series ? 3 : 0) + (x.speakerName === s.speakerName ? 2 : 0) + (x.category?.id === s.category?.id ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.x);
  const vid = youTubeId(s.videoUrl);

  return (
    <>
      <section className="bg-ink pb-12 pt-[calc(var(--nl-header-h)+2.5rem)] text-white">
        <div className="nl-container">
          <Link href="/messages" className="mb-8 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" aria-hidden />All messages</Link>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {vid ? <VideoEmbed videoId={vid} title={s.title} thumbnail={s.thumbnail} /> : <div className="flex aspect-video items-center justify-center bg-ink-2 text-white/60">Video not available</div>}
              {s.audioUrl && (
                <div className="mt-4 bg-ink-2 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-blue">Listen</p>
                  <audio controls preload="none" src={s.audioUrl} className="w-full">Your browser does not support audio playback.</audio>
                </div>
              )}
            </div>
            <div className="grid content-start gap-5 lg:col-span-4">
              {s.category && <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">{s.category.name}</p>}
              <h1 className="text-[clamp(1.8rem,3vw,2.6rem)] font-medium leading-tight tracking-tight">{s.title}</h1>
              <dl className="grid gap-3 border-t border-white/15 pt-5 text-sm">
                <Row k="Speaker" v={s.speakerName} />
                {s.preachedOn && <Row k="Date" v={formatSermonDate(s.preachedOn)} />}
                {s.series && <Row k="Series" v={s.series} />}
                {s.scripture && <Row k="Scripture" v={s.scripture} />}
              </dl>
              {s.description && <p className="text-white/75">{s.description}</p>}
              {s.videoUrl && <a href={s.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:text-white">Watch on YouTube<ArrowUpRight className="h-4 w-4" aria-hidden /></a>}
            </div>
          </div>
        </div>
      </section>
      {s.speaker?.bio && (
        <section className="border-b border-line bg-paper py-12">
          <div className="nl-container grid gap-3 md:grid-cols-[12rem_1fr]">
            <p className="nl-label">About the speaker</p>
            <div><h2 className="nl-h4 !text-xl">{s.speaker.name}</h2><p className="mt-2 max-w-3xl">{s.speaker.bio}</p></div>
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="nl-section">
          <div className="nl-container">
            <p className="nl-label mb-4">Keep watching</p>
            <h2 className="nl-h2 mb-10">Related messages</h2>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <li key={r.id}><SermonCard s={r} /></li>)}</ul>
          </div>
        </section>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (<div className="grid grid-cols-[6rem_1fr] gap-3"><dt className="text-white/50">{k}</dt><dd className="m-0 text-white">{v}</dd></div>);
}
