import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, MapPin, Play, Sparkles, Star } from "lucide-react";
import type { Media, Sermon, SiteSettings } from "@/lib/content/types";
import { ContactForm } from "@/components/site/forms/public-forms";
import { MapEmbed } from "@/components/site/map-embed";
import { LongArrow } from "@/components/site/icons";

/* eslint-disable @typescript-eslint/no-explicit-any */
type D = Record<string, any>;
interface Base { kicker: string | null; title: string | null; body: string | null; data: D }

const ICONS: Record<string, React.ElementType> = { sparkles: Sparkles, heart: Heart, star: Star, clock: Clock, pin: MapPin };
const isExternal = (href: string) => /^https:\/\//.test(href);

function Cta({ cta, variant = "", lg = false }: { cta?: { label?: string; href?: string }; variant?: string; lg?: boolean }) {
  if (!cta?.label || !cta?.href) return null;
  const cls = `nl-btn ${variant} ${lg ? "nl-btn--lg" : ""}`;
  return isExternal(cta.href)
    ? <a href={cta.href} target="_blank" rel="noopener noreferrer" className={cls}><span>{cta.label}</span><LongArrow /></a>
    : <Link href={cta.href} className={cls}><span>{cta.label}</span><LongArrow /></Link>;
}

function Paragraphs({ text, className }: { text: string | null; className: string }) {
  if (!text) return null;
  return <>{text.split(/\n{2,}/).map((p, i) => <p key={i} className={className}>{p}</p>)}</>;
}

/** "More than a Sunday service": text left, photo right with the gold offset shadow. */
export function AboutSplit({ s, image }: { s: Base; image: Media | null }) {
  return (
    <section id="about" className="nl-section scroll-mt-24">
      <div className="nl-container grid items-center gap-[clamp(3rem,7vw,6rem)] lg:grid-cols-2">
        <div className="nl-reveal grid content-start gap-6">
          {s.kicker && <p className="nl-label nl-label--plain">{s.kicker}</p>}
          <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
          <Paragraphs text={s.body} className="nl-lead m-0" />
          <div className="pt-2"><Cta cta={s.data.cta} variant="nl-btn--dark" /></div>
        </div>
        {image && (
          <div className="nl-reveal relative aspect-[4/5] max-h-[560px] w-full lg:aspect-auto lg:h-[550px]">
            <Image src={image.url} alt={image.alt} fill sizes="(min-width:1024px) 45vw, 100vw" className="nl-split-img object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

/** "Come as you are": dark green, photo left, service details right. */
export function VisitSplit({ s, image }: { s: Base; image: Media | null }) {
  return (
    <section id="visit" className="nl-section nl-section--ink scroll-mt-24 text-white">
      <div className="nl-container grid items-center gap-[clamp(3rem,7vw,6rem)] lg:grid-cols-2">
        {image && (
          <div className="nl-reveal relative order-2 aspect-[4/5] max-h-[560px] w-full lg:order-1 lg:aspect-auto lg:h-[550px]">
            <Image src={image.url} alt={image.alt} fill sizes="(min-width:1024px) 45vw, 100vw" className="nl-split-img object-cover" />
          </div>
        )}
        <div className="nl-reveal order-1 grid content-start gap-6 lg:order-2">
          {s.kicker && <p className="nl-label nl-label--light nl-label--plain">{s.kicker}</p>}
          <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
          <Paragraphs text={s.body} className="nl-lead m-0" />
          <ul className="grid">
            {(s.data.details ?? []).map((d: D, i: number) => {
              const Icon = ICONS[d.icon] ?? Clock;
              return (
                <li key={i} className="flex gap-5 border-b border-white/15 py-5">
                  <Icon className="mt-1 h-6 w-6 shrink-0 text-[#d8b879]" aria-hidden />
                  <span className="grid gap-1"><strong className="text-white">{d.title}</strong><span className="whitespace-pre-line text-[#d4ddd7]">{d.text}</span></span>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Cta cta={s.data.primary} />
            <Cta cta={s.data.secondary} variant="nl-btn--ghost" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** "Get connected": three rounded cards with icon chips. */
export function ConnectCards({ s }: { s: Base }) {
  return (
    <section id="ministries" className="nl-section scroll-mt-24">
      <div className="nl-container">
        <div className="nl-reveal mx-auto grid max-w-3xl justify-items-center gap-5 text-center">
          {s.kicker && <p className="nl-label nl-label--plain">{s.kicker}</p>}
          <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
          {s.body && <p className="nl-lead m-0">{s.body}</p>}
        </div>
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {(s.data.items ?? []).map((it: D, i: number) => {
            const Icon = ICONS[it.icon] ?? Sparkles;
            const inner = (
              <>
                <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf0e9] text-[#275d4c]"><Icon className="h-6 w-6" aria-hidden /></span>
                <h3 className="nl-h3 mt-6">{it.title}</h3>
                <p className="mt-3 text-body">{it.text}</p>
              </>
            );
            const cls = "nl-reveal block h-full rounded-[18px] border border-[#e7e8df] bg-white p-9 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(9,37,29,.08)]";
            return <li key={i}>{it.href ? <Link href={it.href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}</li>;
          })}
        </ul>
      </div>
    </section>
  );
}

/** Large Scripture band on sand. */
export function QuoteBand({ s }: { s: Base }) {
  if (!s.title) return null;
  return (
    <section className="nl-quote py-[clamp(4.5rem,10vw,6.5rem)]" aria-label="Scripture">
      <div className="nl-container nl-reveal">
        <blockquote>“{s.title}”</blockquote>
        {s.body && <p className="m-0 text-sm font-semibold uppercase tracking-[0.18em] text-[#766d5c]">{s.body}</p>}
      </div>
    </section>
  );
}

/** "Messages that inspire life": the three latest published sermons as rounded tiles. */
export function MessageTiles({ s, sermons }: { s: Base; sermons: Sermon[] }) {
  return (
    <section id="messages" className="nl-section nl-section--paper scroll-mt-24">
      <div className="nl-container">
        <div className="nl-reveal mx-auto grid max-w-3xl justify-items-center gap-5 text-center">
          {s.kicker && <p className="nl-label nl-label--plain">{s.kicker}</p>}
          <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
          {s.body && <p className="nl-lead m-0">{s.body}</p>}
          <Cta cta={s.data.cta} variant="nl-btn--dark" />
        </div>
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {sermons.slice(0, 3).map((m) => (
            <li key={m.id}>
              <Link href={`/messages/${m.slug}`} className="nl-reveal group block h-full overflow-hidden rounded-[18px] bg-white shadow-[0_15px_40px_rgba(18,43,39,.07)]">
                <div className="relative aspect-video overflow-hidden bg-ink">
                  {m.thumbnail && <Image src={m.thumbnail} alt="" fill sizes="(min-width:768px) 30vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#d8b879] text-[#0b2624] transition-transform group-hover:scale-110"><Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden /></span>
                </div>
                <div className="grid gap-2 p-8">
                  <h3 className="nl-h3">{m.title}</h3>
                  <p className="m-0 text-sm text-muted">{m.speakerName}{m.series ? ` · ${m.series}` : ""}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "Generosity changes lives": centred dark band. */
export function GiveBand({ s }: { s: Base }) {
  return (
    <section id="give" className="nl-section nl-section--ink scroll-mt-24 text-white">
      <div className="nl-container nl-reveal mx-auto grid max-w-3xl justify-items-center gap-6 text-center">
        {s.kicker && <p className="nl-label nl-label--light nl-label--plain">{s.kicker}</p>}
        <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
        {s.body && <p className="nl-lead m-0">{s.body}</p>}
        <Cta cta={s.data.cta} lg />
      </div>
    </section>
  );
}

/** "We'd love to hear from you": contact form + where to find us. */
export function ContactBlock({ s, settings }: { s: Base; settings: SiteSettings }) {
  const a = settings.address;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapQuery)}`;
  const sunday = settings.services.find((x) => /sunday/i.test(x.name));
  return (
    <section id="contact" className="nl-section scroll-mt-24">
      <div className="nl-container">
        <div className="nl-reveal mx-auto grid max-w-3xl justify-items-center gap-5 text-center">
          {s.kicker && <p className="nl-label nl-label--plain">{s.kicker}</p>}
          <h2 className="nl-h2 !text-[clamp(2.4rem,5vw,4.25rem)]">{s.title}</h2>
          {s.body && <p className="nl-lead m-0">{s.body}</p>}
        </div>
        <div className="mt-14 grid gap-[clamp(3rem,7vw,5.5rem)] lg:grid-cols-2">
          <div className="nl-reveal grid content-start gap-5">
            <h3 className="nl-h3">Send us a message</h3>
            <ContactForm />
          </div>
          <div className="nl-reveal grid content-start gap-4">
            <h3 className="nl-h3">Visit us this Sunday</h3>
            <p className="m-0 leading-relaxed"><strong className="text-ink">{settings.name}</strong><br />{s.data.venue ? <>{s.data.venue}<br /></> : null}{a.line1}<br />{a.city}, {a.region} {a.postal}</p>
            {sunday && <p className="m-0"><strong className="text-ink">Worship Service:</strong> {sunday.day}, {sunday.time}</p>}
            <a href={maps} target="_blank" rel="noopener noreferrer" className="nl-textlink w-fit">Open in Google Maps<LongArrow /></a>
            <div className="overflow-hidden rounded-[15px]"><MapEmbed query={a.mapQuery} title={`Map to ${settings.name}`} /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
