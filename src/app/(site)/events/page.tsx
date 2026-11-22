import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEvents, isPageVisible } from "@/lib/content";
import type { ChurchEvent } from "@/lib/content/types";
import { PageHero } from "@/components/site/page-hero";
import { SectionHead } from "@/components/site/section-head";
import { dateParts, formatEventDateLong, formatTime } from "@/lib/format";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming gatherings, conferences, prayer nights and celebrations at New Life Global in Chandler, Arizona.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  if (!(await isPageVisible("events"))) notFound();
  const [upcoming, past] = await Promise.all([getEvents("upcoming"), getEvents("past")]);
  const featured = upcoming.find((e) => e.isFeatured) ?? upcoming[0];

  return (
    <>
      <PageHero
        kicker="Events"
        title="Gather with us."
        tagline="Conferences, prayer nights and celebrations. Every gathering is open to you."
        meta={[`${upcoming.length} upcoming`, "Chandler, AZ"]}
        image={featured?.image ? { url: featured.image.url, alt: featured.image.alt } : null}
        badge={featured ? `Next: ${formatEventDateLong(featured.startsAt)}` : undefined}
      />
      <section className="nl-section" aria-labelledby="upcoming-h">
        <div className="nl-container">
          <SectionHead id="upcoming-h" kicker="Upcoming" title="What's coming up" index={1} total={2} />
          {upcoming.length === 0 ? (
            <p className="border border-dashed border-line p-10 text-center text-muted">No upcoming events right now. Check back soon, or join us any Sunday at 3:00 PM.</p>
          ) : (
            <ol className="border-t border-line">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</ol>
          )}
        </div>
      </section>
      <section className="nl-section nl-section--paper" aria-labelledby="past-h">
        <div className="nl-container">
          <SectionHead id="past-h" kicker="Past events" title="Recently at New Life" index={2} total={2} />
          {past.length === 0 ? <p className="text-muted">No past events yet.</p> : (
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {past.map((e) => (
                <li key={e.id} className="nl-reveal">
                  {/* photo stays in front; on hover a translucent navy glass rises with the details */}
                  <Link href={`/events/${e.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-ink">
                    {e.image && <Image src={e.image.url} alt={e.image.alt} fill sizes="(min-width:1280px) 30vw, (min-width:768px) 45vw, 100vw" className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-105" />}
                    <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,38,36,.85),rgba(11,38,36,.05)_55%)] transition-opacity duration-500 group-hover:opacity-0" aria-hidden />
                    <span className="absolute inset-0 bg-[rgba(11,38,36,.55)] opacity-0 backdrop-blur-[3px] transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                    <span className="absolute inset-x-0 bottom-0 grid gap-2 p-6 text-white">
                      <span className="text-xs font-bold uppercase tracking-[0.14em] text-blue">{formatEventDateLong(e.startsAt)}</span>
                      <span className="text-[1.35rem] font-medium leading-snug tracking-tight">{e.title}</span>
                      {e.summary && <span className="max-h-0 overflow-hidden text-sm text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 group-focus-visible:max-h-24 group-focus-visible:opacity-100">{e.summary}</span>}
                    </span>
                    <span className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 bg-blue transition-transform duration-700 ease-out-expo group-hover:scale-x-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

function EventRow({ e }: { e: ChurchEvent }) {
  const d = dateParts(e.startsAt);
  return (
    <li className="nl-reveal nl-eventrow border-b border-line">
      {/* on hover the event photo appears behind the row through a translucent navy glass */}
      {e.image && <span className="nl-eventrow__bg" aria-hidden><Image src={e.image.url} alt="" fill sizes="100vw" /></span>}
      <span className="nl-eventrow__glass" aria-hidden />
      <Link href={`/events/${e.slug}`} className="group grid grid-cols-[4.5rem_1fr] items-center gap-5 px-2 py-7 transition-[padding] duration-500 ease-soft hover:pl-5 md:grid-cols-[6rem_1fr_14rem_2rem] md:gap-8">
        <span className="grid text-center">
          <span className="nl-er-text text-[2.4rem] font-medium leading-none tracking-tight text-ink nl-num">{d.day}</span>
          <span className="nl-er-accent text-xs font-bold tracking-[0.18em] text-blue-deep">{d.month} {d.year}</span>
        </span>
        <span className="grid gap-1">
          {e.category && <span className="nl-er-accent text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">{e.category}</span>}
          <span className="nl-er-text text-xl font-medium tracking-tight text-ink">{e.title}</span>
          {e.summary && <span className="nl-er-soft text-sm text-body">{e.summary}</span>}
        </span>
        <span className="nl-er-soft col-start-2 text-sm text-muted md:col-start-auto">{formatTime(e.startsAt)} · {e.venue ?? e.address}</span>
        <ArrowRight className="nl-er-accent hidden h-5 w-5 text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 md:block" aria-hidden />
      </Link>
    </li>
  );
}
