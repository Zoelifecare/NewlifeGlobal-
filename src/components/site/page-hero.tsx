import Image from "next/image";
import Link from "next/link";

/** ai.gov.rw P10 — paper page hero: crumb, kicker, H1, tagline, meta chips | image with badge. */
export function PageHero({
  kicker, title, tagline, meta = [], image, badge, crumbs = [],
}: {
  kicker: string; title: string; tagline?: string | null; meta?: string[];
  image?: { url: string; alt: string } | null; badge?: string; crumbs?: { label: string; href: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper pb-[clamp(3rem,8vh,5.5rem)] pt-[calc(var(--nl-header-h)+clamp(2.5rem,7vh,5.5rem))]">
      <div className={`nl-container grid items-end gap-10 ${image ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16" : ""}`}>
        <div className="nl-reveal">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <li><Link href="/" className="hover:text-ink">Home</Link></li>
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-2"><span aria-hidden>/</span><Link href={c.href} className="hover:text-ink">{c.label}</Link></li>
              ))}
              <li className="flex items-center gap-2" aria-current="page"><span aria-hidden>/</span><span className="text-ink">{title}</span></li>
            </ol>
          </nav>
          <p className="nl-label mb-6">{kicker}</p>
          <h1 className="nl-h1 max-w-[18ch]">{title}</h1>
          {tagline && <p className="mt-6 max-w-[36rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed text-body">{tagline}</p>}
          {meta.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {meta.map((m) => (
                <li key={m} className="border border-line bg-white px-3 py-2 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">{m}</li>
              ))}
            </ul>
          )}
        </div>
        {image && (
          <div className="nl-clip nl-zoom relative aspect-[4/3.4]">
            <Image src={image.url} alt={image.alt} fill priority sizes="(min-width:1024px) 42vw, 100vw" className="object-cover" />
            {badge && (
              <span className="absolute bottom-0 left-0 flex items-center gap-2 bg-ink px-4 py-3 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-white">
                <span className="h-[7px] w-[7px] rounded-full bg-blue" aria-hidden />{badge}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
