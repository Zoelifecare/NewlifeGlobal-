import type { Metadata } from "next";
import { ArrowUpRight, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { getChurchContent, getMediaByIds, getSettings, isPageVisible } from "@/lib/content";
import { RichText } from "@/components/site/rich-text";
import { PageHero } from "@/components/site/page-hero";
import { TocBlock, TocLayout } from "@/components/site/sticky-toc";
import { VisitForm } from "@/components/site/forms/public-forms";
import { MapEmbed } from "@/components/site/map-embed";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Plan Your Visit",
  description: "Service times, directions and what to expect at New Life Global. Sundays at 3:00 PM, 800 W Galveston St, Chandler, AZ.",
  alternates: { canonical: "/visit" },
};

const TOC = [
  { id: "when", label: "When we meet" },
  { id: "where", label: "Where to find us" },
  { id: "expect", label: "What to expect" },
  { id: "kids", label: "Kids" },
  { id: "faq", label: "Questions" },
  { id: "tell-us", label: "Let us know you're coming" },
];

export default async function VisitPage() {
  if (!(await isPageVisible("visit"))) notFound();
  const [s, media, content] = await Promise.all([getSettings(), getMediaByIds(["ig-seat-saved"]), getChurchContent()]);
  const intro = content.visit_intro;
  const a = s.address;
  const full = `${a.line1}, ${a.city}, ${a.region} ${a.postal}`;
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.mapQuery)}`;
  const img = media["ig-seat-saved"];
  return (
    <>
      <PageHero
        kicker="Plan your visit"
        title={intro?.title || "We saved you a seat."}
        tagline={intro?.body ?? null}
        meta={["Sundays 3:00 PM", `${a.city}, ${a.region}`, "Kids welcome"]}
        image={img ? { url: img.url, alt: img.alt } : null}
        badge="Every Sunday · 3 PM"
      />
      <TocLayout toc={TOC}>
        <TocBlock id="when" index={1} title="When we meet">
          <ul className="grid border-t border-line">
            {s.services.map((x) => (
              <li key={x.name} className="nl-hoverbox grid cursor-default gap-1 border-b border-line px-3 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline">
                <div>
                  <p className="nl-hb-lift m-0 text-lg font-medium text-ink">{x.name}</p>
                  <p className="m-0 text-sm text-muted">{x.location}{x.note ? ` · ${x.note}` : ""}</p>
                </div>
                <p className="m-0 text-ink sm:text-right"><span className="font-semibold">{x.day}</span><br className="hidden sm:block" /> <span className="text-body">{x.time}</span></p>
              </li>
            ))}
          </ul>
        </TocBlock>
        <TocBlock id="where" index={2} title="Where to find us">
          <address className="not-italic text-lg text-ink">{s.name}<br />{a.line1}<br />{a.city}, {a.region} {a.postal}</address>
          <MapEmbed query={a.mapQuery} title={`Map showing ${full}`} />
          <a href={dir} target="_blank" rel="noopener noreferrer" className="nl-btn w-fit"><span>Get directions</span><ArrowUpRight className="h-4 w-4" aria-hidden /></a>
        </TocBlock>
        <TocBlock id="expect" index={3} title="What to expect">
          {content.visit_expect?.body ? <RichText text={content.visit_expect.body} /> : <p>Our Sunday service runs from 3:00 to 5:00 PM.</p>}
        </TocBlock>
        <TocBlock id="kids" index={4} title="Kids">
          {content.visit_kids?.body ? <RichText text={content.visit_kids.body} /> : <p>Ask us about our Sunday School.</p>}
        </TocBlock>
        <TocBlock id="faq" index={5} title="Questions">
          {s.visitFaq.length === 0 ? <p>Have a question? Send it with the form below.</p> : (
            <div className="grid border-t border-line">
              {s.visitFaq.map((f, i) => (
                <details key={f.q} className="nl-hoverbox group border-b border-line px-3 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center gap-4 py-5">
                    <span className="nl-index nl-num w-7 text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                    <span className="nl-hb-lift flex-1 text-lg font-medium text-ink">{f.q}</span>
                    <Plus className="h-5 w-5 text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="pb-5 pl-11 text-body">{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </TocBlock>
        <TocBlock id="tell-us" index={6} title="Let us know you're coming">
          <p>It&apos;s not required, but if you tell us you&apos;re coming, we&apos;ll look out for you.</p>
          <div className="border border-line bg-paper p-[clamp(1.25rem,3vw,2rem)]"><VisitForm /></div>
        </TocBlock>
      </TocLayout>
    </>
  );
}
