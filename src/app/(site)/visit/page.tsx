import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getMediaByIds, getSettings } from "@/lib/content";
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
  { id: "tell-us", label: "Let us know you're coming" },
];

export default async function VisitPage() {
  const [s, media] = await Promise.all([getSettings(), getMediaByIds(["ig-seat-saved"])]);
  const a = s.address;
  const full = `${a.line1}, ${a.city}, ${a.region} ${a.postal}`;
  const dir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.mapQuery)}`;
  const img = media["ig-seat-saved"];
  return (
    <>
      <PageHero
        kicker="Plan your visit"
        title="We saved you a seat."
        tagline="Whether you're new to church or looking for a church family, you are welcome at New Life Global."
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
          <p>Our Sunday service runs from 3:00 to 5:00 PM. Expect lively, heartfelt worship, prayer, and a Bible message you can apply to everyday life. Come as you are; there is no dress code.</p>
          <p>We are an international family with deep roots in Rwanda, and you&apos;ll hear that warmth in our worship. Arrive a few minutes early and someone from our team will be glad to welcome you.</p>
        </TocBlock>
        <TocBlock id="kids" index={4} title="Kids">
          <p>Children are a joy at New Life. Our Sunday School meets during the service and is growing every week. If you have questions about our children&apos;s ministry, let us know in the form below.</p>
        </TocBlock>
        <TocBlock id="tell-us" index={5} title="Let us know you're coming">
          <p>It&apos;s not required, but if you tell us you&apos;re coming, we&apos;ll look out for you.</p>
          <div className="border border-line bg-paper p-[clamp(1.25rem,3vw,2rem)]"><VisitForm /></div>
        </TocBlock>
      </TocLayout>
    </>
  );
}
