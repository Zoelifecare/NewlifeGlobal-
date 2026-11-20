import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/content";
import { ContactForm } from "@/components/site/forms/public-forms";
import { MapEmbed } from "@/components/site/map-embed";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with New Life Global in Chandler, Arizona.",
  alternates: { canonical: "/contact" },
};

const TOPICS: Record<string, string> = {
  worship: "Joining the worship team", women: "Women's ministry", serve: "Serving at New Life",
  children: "Children's ministry", prayer: "Prayer ministry",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const a = s.address;
  return (
    <section className="pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nl-header-h)+clamp(2.5rem,7vh,5rem))]">
      <div className="nl-container grid gap-14 lg:grid-cols-12">
        <div className="nl-reveal grid content-start gap-8 lg:col-span-5">
          <div className="grid gap-6">
            <p className="nl-label">Contact</p>
            <h1 className="nl-h1">We&apos;d love to hear from you.</h1>
            <p className="nl-lead">Questions about visiting, ministries or anything else? Send us a message.</p>
          </div>
          <ul className="grid border-t border-line">
            <li className="nl-hoverbox flex gap-4 border-b border-line px-2 py-5"><MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-deep" aria-hidden /><address className="not-italic text-ink">{a.line1}<br />{a.city}, {a.region} {a.postal}</address></li>
            {s.contact.email && <li className="nl-hoverbox flex gap-4 border-b border-line px-2 py-5"><Mail className="mt-1 h-5 w-5 shrink-0 text-blue-deep" aria-hidden /><a className="text-ink hover:text-blue" href={`mailto:${s.contact.email}`}>{s.contact.email}</a></li>}
            {s.contact.phone && <li className="nl-hoverbox flex gap-4 border-b border-line px-2 py-5"><Phone className="mt-1 h-5 w-5 shrink-0 text-blue-deep" aria-hidden /><a className="text-ink hover:text-blue" href={`tel:${s.contact.phone.replace(/[^\d+]/g, "")}`}>{s.contact.phone}</a></li>}
            {s.social.map((x) => (
              <li key={x.url} className="nl-hoverbox border-b border-line px-2 py-4"><a href={x.url} target="_blank" rel="noopener noreferrer" className="nl-textlink">{x.label}<ArrowUpRight className="h-4 w-4" aria-hidden /></a></li>
            ))}
          </ul>
          <MapEmbed query={a.mapQuery} title={`Map showing ${a.line1}, ${a.city}`} />
        </div>
        <div className="border border-line bg-paper p-[clamp(1.5rem,4vw,3rem)] lg:col-span-7">
          <h2 className="nl-h3 mb-8">Send a message</h2>
          <ContactForm defaultSubject={sp.topic ? TOPICS[sp.topic] ?? "" : ""} />
        </div>
      </div>
    </section>
  );
}
