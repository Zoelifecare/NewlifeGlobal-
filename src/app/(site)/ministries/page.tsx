import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMinistries } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { SectionHead } from "@/components/site/section-head";
import { CtaBand } from "@/components/site/cta-band";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Our Ministries",
  description: "Worship, prayer, women, children and serving. Find your place to belong and grow at New Life Global.",
  alternates: { canonical: "/ministries" },
};

export default async function MinistriesPage() {
  const ministries = await getMinistries();
  const hero = ministries[0]?.image;
  return (
    <>
      <PageHero
        kicker="Our Ministries"
        title="A place for everyone to belong."
        tagline="Worship. Grow. Serve. Each ministry is a way to grow in Christ and to serve His people."
        meta={[`${ministries.length} ministries`, "Chandler, AZ"]}
        image={hero ? { url: hero.url, alt: hero.alt } : null}
        badge="Get involved"
      />
      <section className="nl-section">
        <div className="nl-container">
          <SectionHead kicker="Directory" title="Find your ministry." lead="Every ministry is open to newcomers. Come as you are." />
          {ministries.length === 0 ? (
            <p className="border border-dashed border-line p-10 text-center text-muted">Ministries will be listed here soon.</p>
          ) : (
            <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {ministries.map((m, i) => (
                <li key={m.id} className="nl-reveal" style={{ ["--d" as string]: `${(i % 3) * 0.06}s` }}>
                  <Link href={`/ministries/${m.slug}`} className="nl-hoverbox group grid h-full grid-rows-[auto_1fr] border border-line bg-white transition-colors hover:border-blue/60">
                    <div className="nl-zoom relative aspect-[4/3] bg-paper">
                      {m.image && <Image src={m.image.url} alt={m.image.alt} fill sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover" />}
                      <span className="absolute left-0 top-0 bg-ink px-3 py-2 text-[0.65rem] font-bold tracking-[0.16em] text-white nl-num">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="grid content-between gap-6 p-6">
                      <div className="grid gap-2">
                        {m.tagline && <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-deep">{m.tagline}</p>}
                        <h2 className="nl-hb-lift nl-h3">{m.name}</h2>
                        <p className="text-[0.95rem] leading-relaxed">{m.summary}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                        <span className="text-muted">{m.meetingSchedule}</span>
                        <ArrowRight className="h-5 w-5 text-muted transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 group-hover:text-blue" aria-hidden />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
      <CtaBand kicker="Get involved" title="Want to serve or join a ministry?" text="Tell us a little about yourself and we'll connect you." href="/contact?topic=serve" label="Get in touch" />
    </>
  );
}
