import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarPlus, Clock, MapPin } from "lucide-react";
import { getEvent, getEvents } from "@/lib/content";
import { formatEventDateLong, formatTime, googleCalendarUrl, isEventPast } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getEvents()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await getEvent((await params).slug);
  if (!e) return { title: "Event not found" };
  return { title: e.title, description: e.summary ?? undefined, alternates: { canonical: `/events/${e.slug}` }, openGraph: e.image ? { images: [e.image.url] } : undefined };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await getEvent((await params).slug);
  if (!e) notFound();
  const isPast = isEventPast(e);
  const mapsUrl = e.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}` : null;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event", name: e.title, startDate: e.startsAt, endDate: e.endsAt ?? undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.venue ?? "New Life Global", address: e.address ?? undefined },
    description: e.summary ?? undefined, organizer: { "@type": "Organization", name: "New Life Global" },
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink pb-16 pt-[calc(var(--nl-header-h)+2.5rem)] text-white">
        {/* translucent, blurred photo backdrop; the flyer itself sits in front */}
        {e.image && (
          <div className="absolute inset-0 -z-10" aria-hidden>
            <Image src={e.image.url} alt="" fill priority sizes="100vw" className="scale-110 object-cover opacity-60 blur-2xl" />
            <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(0,27,61,.94)_0%,rgba(0,27,61,.78)_50%,rgba(0,27,61,.45)_100%)]" />
          </div>
        )}
        <div className="nl-container">
          <Link href="/events" className="mb-8 inline-flex items-center gap-2 text-sm text-white/70 hover:text-blue"><ArrowLeft className="h-4 w-4" aria-hidden />All events</Link>
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="grid content-start gap-6 lg:col-span-7">
              <p className="nl-label nl-label--light">{isPast ? "Past event" : e.category ?? "Event"}</p>
              <h1 className="nl-h1" style={{ color: "#fff" }}>{e.title}</h1>
              {e.summary && <p className="nl-lead" style={{ color: "rgba(255,255,255,.78)" }}>{e.summary}</p>}
              <dl className="grid border-t border-white/15 sm:grid-cols-2">
                <Info icon={<Clock className="h-4 w-4" />} k="When" v={`${formatEventDateLong(e.startsAt)} · ${formatTime(e.startsAt)}${e.endsAt ? ` to ${formatEventDateLong(e.endsAt) === formatEventDateLong(e.startsAt) ? formatTime(e.endsAt) : formatEventDateLong(e.endsAt)}` : ""}`} />
                <Info icon={<MapPin className="h-4 w-4" />} k="Where" v={[e.venue, e.address].filter(Boolean).join(" · ") || "To be announced"} />
              </dl>
              <div className="flex flex-wrap gap-3">
                {e.registrationUrl && !isPast && <a href={e.registrationUrl} target="_blank" rel="noopener noreferrer" className="nl-btn nl-btn--light"><span>Register</span><ArrowUpRight className="h-4 w-4" aria-hidden /></a>}
                {!isPast && <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="nl-btn nl-btn--ghost"><span>Add to calendar</span><CalendarPlus className="h-4 w-4" aria-hidden /></a>}
                {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="nl-btn nl-btn--ghost"><span>Directions</span><MapPin className="h-4 w-4" aria-hidden /></a>}
              </div>
              {e.description && <div className="grid gap-4 pt-4 text-white/80">{e.description.split(/\n+/).map((p, i) => <p key={i} className="m-0">{p}</p>)}</div>}
            </div>
            {e.image && (
              <div className="lg:col-span-5">
                <div className="group relative overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] ring-1 ring-white/15">
                  <Image src={e.image.url} alt={e.image.alt} width={1080} height={1350} sizes="(min-width:1024px) 40vw, 100vw" className="h-auto w-full transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.03]" priority />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

function Info({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="nl-hoverbox nl-hoverbox--dark grid cursor-default gap-1 border-b border-white/15 px-3 py-4 sm:pr-6">
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/60">{icon}{k}</dt>
      <dd className="nl-hb-lift m-0 text-white">{v}</dd>
    </div>
  );
}
