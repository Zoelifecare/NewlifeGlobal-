import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { getAnnouncements, getEvents, getHomepage, getMediaByIds, getMinistries, getSermons, getSettings } from "@/lib/content";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import type { HomepageSection, Media } from "@/lib/content/types";
import { HeroSlider, type HeroSlideView } from "@/components/site/hero-slider";
import { SectionHead } from "@/components/site/section-head";
import { CountUp } from "@/components/site/count-up";
import { HoverVideo } from "@/components/site/hover-video";
import { LongArrow } from "@/components/site/icons";
import { formatEventDate } from "@/lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
type D = Record<string, any>;

/** Sections that carry the page-level "0X / 0N" index (ai.gov.rw P4). */
const NUMBERED = ["chapters", "discover", "pathways", "global"];

export default async function HomePage() {
  const [sections, settings, ministries, sermons, upcoming, announcements] = await Promise.all([
    getHomepage(), getSettings(), getMinistries(), getSermons(), getEvents("upcoming"), getAnnouncements(),
  ]);

  const mediaIds = sections.flatMap((s) => collectMediaIds(s.data));
  const media = await getMediaByIds(mediaIds);
  const img = (id?: string): Media | null => (id ? media[id] ?? null : null);

  const numbered = sections.filter((s) => NUMBERED.includes(s.key)).map((s) => s.key);
  const idx = (key: string) => ({ index: numbered.indexOf(key) + 1, total: numbered.length });

  const featured = sermons.find((s) => s.isFeatured) ?? sermons[0];
  const nextEvent = upcoming.find((e) => e.isFeatured) ?? upcoming[0];

  const render = (s: HomepageSection<D>) => {
    switch (s.key) {
      case "hero": {
        // featured slides only, in the admin's order; numbering follows that order
        const slides: HeroSlideView[] = (s.data.slides ?? []).filter((sl: D) => sl.featured !== false).map((sl: D, i: number) => ({
          index: String(i + 1).padStart(2, "0"), label: sl.label, caption: sl.caption, headline: sl.headline, body: sl.body,
          image: img(sl.mediaId) ? { url: img(sl.mediaId)!.url, alt: sl.alt?.trim() || img(sl.mediaId)!.alt } : null,
          video: sl.video?.id && /^[\w-]{11}$/.test(sl.video.id) ? { id: sl.video.id, title: sl.video.title || "Watch the message", href: /^\/(?!\/)/.test(sl.video.href ?? "") ? sl.video.href : "/messages" } : null,
        }));
        if (!slides.length) return null;
        return <HeroSlider key={s.key} slides={slides} primary={s.data.primaryCta} secondary={s.data.secondaryCta} />;
      }

      case "stats":
        return (
          <section key={s.key} aria-label="New Life at a glance" className="border-b border-line">
            <div className="nl-container !px-0 sm:!px-[var(--nl-pad)]">
              <dl className="grid grid-cols-2 lg:grid-cols-4">
                {(s.data.items ?? []).map((it: D, i: number) => (
                  <div key={i} className={`nl-hoverbox grid cursor-default gap-1.5 border-line px-[var(--nl-pad)] py-8 sm:px-8 lg:py-11 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                    <dt className="order-2 text-xs leading-snug text-muted">{it.label}</dt>
                    <dd className="nl-hb-lift order-1 m-0 flex items-start text-[clamp(2rem,3.6vw,3.1rem)] font-medium leading-none tracking-tight text-ink nl-num">
                      <CountUp value={it.value} />
                      {it.suffix && <span className="ml-1 mt-1 text-base font-semibold text-blue-deep">{it.suffix}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        );

      case "chapters":
        return (
          <section key={s.key} id="chapters" className="nl-section scroll-mt-16" aria-labelledby="chapters-title">
            <div className="nl-container">
              <SectionHead id="chapters-title" kicker={s.kicker} title={s.title} lead={s.body} {...idx(s.key)} />
              <div className="grid gap-[clamp(4rem,9vw,8rem)]">
                {(s.data.chapters ?? []).map((c: D, i: number) => {
                  const m = img(c.mediaId);
                  const flip = i % 2 === 1;
                  return (
                    <article key={c.index} id={`chapter-${c.index}`} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-12 lg:gap-16">
                      <div className={`nl-clip relative aspect-[4/3.2] lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
                        {m && (c.videoId ? (
                          <HoverVideo videoId={c.videoId} image={{ url: m.url, alt: m.alt }} label={`${c.title} worship clip`} className="absolute inset-0" />
                        ) : (
                          <div className="nl-zoom absolute inset-0">
                            <Image src={m.url} alt={m.alt} fill sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" />
                          </div>
                        ))}
                        <span className="absolute left-0 top-0 bg-ink px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white">
                          Chapter {c.index}
                        </span>
                      </div>
                      <div className={`nl-reveal lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
                        <div className="flex items-baseline gap-4 border-b border-line pb-5">
                          <span className="text-[clamp(3rem,6vw,5.5rem)] font-medium leading-none tracking-tighter text-blue-deep/25 nl-num">{c.index}</span>
                          <h3 className="nl-h2 !text-[clamp(1.7rem,2.8vw,2.6rem)]">{c.title}</h3>
                        </div>
                        <p className="nl-serif mt-6 text-[clamp(1.35rem,2vw,1.75rem)] leading-snug text-blue-deep">{c.lead}</p>
                        <p className="mt-5 text-body">{c.body}</p>
                        {c.points?.length > 0 && (
                          <ul className="mt-7 grid gap-0 border-t border-line">
                            {c.points.map((p: string) => (
                              <li key={p} className="nl-hoverbox flex cursor-default items-center gap-3 border-b border-line px-2 py-3 text-[0.95rem] text-ink">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue" aria-hidden />{p}
                              </li>
                            ))}
                          </ul>
                        )}
                        {c.cta && <Link href={c.cta.href} className="nl-textlink mt-7">{c.cta.label}<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case "invite-band":
        return (
          <section key={s.key} className="bg-ink text-white" aria-label={s.kicker ?? "Plan your visit"}>
            <div className="nl-container grid items-end gap-8 py-[clamp(3.5rem,8vh,5.5rem)] md:grid-cols-[1.15fr_.85fr] md:gap-16">
              <div className="nl-reveal grid gap-4">
                {s.kicker && <p className="nl-label nl-label--light">{s.kicker}</p>}
                <h2 className="max-w-[22ch] text-[clamp(1.9rem,3.4vw,3.1rem)] font-medium leading-[1.08] tracking-tight">{s.title}</h2>
              </div>
              <div className="nl-reveal grid justify-items-start gap-5" style={{ ["--d" as string]: ".1s" }}>
                {s.body && <p className="text-white/70">{s.body}</p>}
                {s.data.cta && <Link href={s.data.cta.href} className="nl-btn nl-btn--light nl-btn--lg"><span>{s.data.cta.label}</span><LongArrow /></Link>}
              </div>
            </div>
          </section>
        );

      case "discover":
        return (
          <section key={s.key} className="nl-section nl-section--paper" aria-labelledby="discover-title">
            <div className="nl-container">
              <SectionHead id="discover-title" kicker={s.kicker} title={s.title} lead={s.body} {...idx(s.key)} />
              <ol className="nl-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {(s.data.items ?? []).map((it: D, i: number) => (
                  <li key={it.href} className={`nl-cell nl-hoverbox nl-reveal ${i === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`} style={{ ["--d" as string]: `${i * 0.05}s` }}>
                    <Link href={it.href} className="group flex h-full min-h-[11rem] flex-col justify-between gap-8 p-[clamp(1.5rem,2.4vw,2.25rem)]">
                      <span className="nl-index nl-num text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                      <span className="grid gap-2">
                        <span className={`nl-hb-lift font-medium tracking-tight text-ink ${i === 0 ? "text-[clamp(1.8rem,3vw,2.8rem)] leading-tight" : "text-xl"}`}>{it.title}</span>
                        <span className="text-sm leading-relaxed text-muted">{it.text}</span>
                      </span>
                      <ArrowRight className="h-5 w-5 text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 group-hover:text-blue" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );

      case "pathways": {
        const msgImg = featured?.thumbnail ? { url: featured.thumbnail, alt: featured.title } : img(s.data.messageMediaId);
        const evImg = nextEvent?.image ?? img(s.data.eventMediaId);
        return (
          <section key={s.key} className="nl-section" aria-labelledby="pathways-title">
            <div className="nl-container">
              <SectionHead id="pathways-title" kicker={s.kicker} title={s.title} lead={s.body} {...idx(s.key)} />
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
                {featured && (
                  <PathwayCard
                    href={`/messages/${featured.slug}`} index="Pathway 01" eyebrow="Latest message" title={featured.title}
                    question={`${featured.speakerName}${featured.series ? ` · ${featured.series}` : ""}`}
                    chips={[featured.category?.name, featured.preachedOn ? new Date(featured.preachedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null].filter(Boolean) as string[]}
                    image={msgImg} foot="Watch the message"
                  />
                )}
                {nextEvent ? (
                  <PathwayCard
                    href={`/events/${nextEvent.slug}`} index="Pathway 02" eyebrow="Next gathering" title={nextEvent.title}
                    question={nextEvent.summary ?? ""} chips={[formatEventDate(nextEvent.startsAt), nextEvent.venue].filter(Boolean) as string[]}
                    image={evImg} foot="Event details"
                  />
                ) : (
                  <PathwayCard href="/events" index="Pathway 02" eyebrow="Gatherings" title="Events at New Life Global" question="Conferences, prayer nights and celebrations." chips={[]} image={img(s.data.eventMediaId)} foot="See all events" />
                )}
              </div>
            </div>
          </section>
        );
      }

      case "ministries":
        return (
          <section key={s.key} className="nl-section !pt-0" aria-labelledby="ministries-title">
            <div className="nl-container grid gap-10 lg:grid-cols-12">
              <div className="nl-reveal grid content-start gap-5 lg:col-span-4">
                {s.kicker && <p className="nl-label">{s.kicker}</p>}
                <h2 id="ministries-title" className="nl-h2">{s.title}</h2>
                {s.body && <p className="nl-lead">{s.body}</p>}
                <Link href="/ministries" className="nl-textlink">All ministries<ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </div>
              <ol className="border-t border-line lg:col-span-8">
                {(ministries.some((x) => x.isFeatured) ? ministries.filter((x) => x.isFeatured) : ministries).map((m, i) => (
                  <li key={m.id} className="nl-hoverbox nl-reveal border-b border-line" style={{ ["--d" as string]: `${i * 0.05}s` }}>
                    <Link href={`/ministries/${m.slug}`} className="group grid grid-cols-[3rem_1fr_2rem] items-center gap-4 py-6 transition-[padding] duration-500 ease-soft hover:pl-4 sm:grid-cols-[5rem_1fr_auto_2rem] sm:gap-8">
                      <span className="nl-index nl-num transition-colors group-hover:text-blue">{String(i + 1).padStart(2, "0")}</span>
                      <span className="grid gap-1">
                        <span className="nl-hb-lift text-xl font-medium tracking-tight text-ink">{m.name}</span>
                        <span className="text-sm text-muted">{m.summary}</span>
                      </span>
                      <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:block">{m.meetingSchedule}</span>
                      <ArrowRight className="h-5 w-5 text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 group-hover:text-ink" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );

      case "testimonies":
        if (!s.data.items?.length) return null;
        return (
          <section key={s.key} className="nl-section nl-section--paper">
            <div className="nl-container">
              <SectionHead kicker={s.kicker} title={s.title} />
              <div className="grid gap-6 md:grid-cols-2">
                {s.data.items.map((t: D, i: number) => (
                  <figure key={i} className="nl-reveal border-l-2 border-blue bg-white p-8">
                    <blockquote className="nl-serif text-xl leading-relaxed text-ink">“{t.quote}”</blockquote>
                    <figcaption className="mt-4 text-sm font-semibold text-muted">{t.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        );

      case "invitation": {
        const m = img(s.data.mediaId);
        return (
          <section key={s.key} className="relative isolate overflow-hidden bg-ink text-white" aria-labelledby="invite-title">
            {m && <Image src={m.url} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-45" />}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,27,61,.95),rgba(0,27,61,.35))]" />
            <div className="nl-container grid justify-items-center gap-7 py-[clamp(6rem,16vh,10rem)] text-center">
              {s.kicker && <p className="nl-label nl-label--light nl-label--plain">{s.kicker}</p>}
              <h2 id="invite-title" className="nl-reveal max-w-[16ch] text-[clamp(2.4rem,5.2vw,5rem)] font-medium leading-none tracking-tight">{s.title}</h2>
              {s.body && <p className="nl-reveal max-w-xl text-white/75">{s.body}</p>}
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {s.data.cta && <Link href={s.data.cta.href} className="nl-btn nl-btn--light nl-btn--lg"><span>{s.data.cta.label}</span><LongArrow /></Link>}
                {s.data.secondary && <Link href={s.data.secondary.href} className="nl-btn nl-btn--ghost nl-btn--lg"><span>{s.data.secondary.label}</span></Link>}
              </div>
              <p className="flex items-center gap-2 text-sm text-white/65"><MapPin className="h-4 w-4" aria-hidden />{settings.address.line1}, {settings.address.city}, {settings.address.region} · <Calendar className="h-4 w-4" aria-hidden /> Sundays 3:00 PM</p>
            </div>
          </section>
        );
      }
      default:
        return null;
    }
  };

  const pinned = announcements.filter((a) => a.isPinned);
  return (
    <>
      {sections.map((s, i) => (
        <Fragment key={s.key}>
          {render(s as HomepageSection<D>)}
          {i === 0 && pinned.length > 0 && <AnnouncementBar items={pinned} />}
        </Fragment>
      ))}
    </>
  );
}

function collectMediaIds(data: unknown): string[] {
  const out: string[] = [];
  JSON.stringify(data, (k, v) => { if (/mediaid$/i.test(k) && typeof v === "string") out.push(v); return v; });
  return out;
}

function PathwayCard({ href, index, eyebrow, title, question, chips, image, foot }: {
  href: string; index: string; eyebrow: string; title: string; question: string; chips: string[]; image: { url: string; alt: string } | null; foot: string;
}) {
  return (
    <Link href={href} className="group nl-reveal relative isolate grid min-h-[clamp(28rem,52vh,38rem)] grid-rows-[auto_1fr_auto] overflow-hidden bg-ink text-white">
      {image && (
        <div className="nl-zoom absolute inset-0 -z-10">
          <Image src={image.url} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,12,28,.94)_12%,rgba(0,12,28,.35)_62%,rgba(0,12,28,.2))]" />
      <div className="grid gap-3 p-[clamp(1.5rem,3vw,2.5rem)]">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue">{index} · {eyebrow}</span>
      </div>
      <div className="grid content-end gap-5 px-[clamp(1.5rem,3vw,2.5rem)] pb-8">
        <h3 className="text-[clamp(1.7rem,2.8vw,2.6rem)] font-medium leading-[1.08] tracking-tight">{title}</h3>
        {question && <p className="nl-serif text-lg text-white/70">{question}</p>}
        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => <li key={c} className="border border-white/30 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-white/85">{c}</li>)}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/15 px-[clamp(1.5rem,3vw,2.5rem)] py-5">
        <span className="text-sm font-semibold transition-colors group-hover:text-blue">{foot}</span>
        <ArrowRight className="h-5 w-5 transition-transform duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-blue" aria-hidden />
      </div>
    </Link>
  );
}
