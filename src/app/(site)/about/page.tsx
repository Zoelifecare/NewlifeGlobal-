import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChurchContent, getLeaders, getMediaByIds, getSettings, isPageVisible } from "@/lib/content";
import type { ChurchContentValue } from "@/lib/content/types";
import { PageHero } from "@/components/site/page-hero";
import { TocBlock, TocLayout } from "@/components/site/sticky-toc";
import { CtaBand } from "@/components/site/cta-band";
import { LeaderCard } from "@/components/site/leader-card";
import { RichText } from "@/components/site/rich-text";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About Us",
  description: "Who we are, what we believe and who leads New Life Global in Chandler, Arizona.",
  alternates: { canonical: "/about" },
};

/**
 * Every section comes from Church Identity & Settings (church_content). Only approved, published
 * entries render; sections still awaiting Pastor Charles' confirmation are simply not shown.
 */
export default async function AboutPage() {
  if (!(await isPageVisible("about"))) notFound();
  const [settings, leaders, content, media] = await Promise.all([
    getSettings(), getLeaders(), getChurchContent(), getMediaByIds(["ig-rw-07"]),
  ]);
  const hero = media["ig-rw-07"] ?? null;
  const intro = content.about_intro;

  const blocks: { id: string; label: string; value: ChurchContentValue; anchorAlias?: string }[] = [];
  const add = (id: string, label: string, v?: ChurchContentValue) => {
    if (v && (v.body?.trim() || v.items?.length)) blocks.push({ id, label, value: v });
  };
  add("story", "Our Story", content.our_story);
  add("mission", "Our Mission", content.mission);
  add("vision", "Our Vision", content.vision);
  add("values", "Our Values", content.core_values);
  add("beliefs", "What We Believe", content.beliefs);
  const toc = [...blocks.map((b) => ({ id: b.id, label: b.value.title || b.label })), { id: "leadership", label: "Leadership" }];

  return (
    <>
      <PageHero
        kicker="About New Life Global"
        title={intro?.title || `About ${settings.name}`}
        tagline={intro?.body ?? null}
        meta={[`${settings.address.city}, Arizona`, "Sundays 3:00 PM", settings.tagline]}
        image={hero ? { url: hero.url, alt: hero.alt } : null}
        badge="Worship · Grow · Serve"
      />
      <TocLayout toc={toc}>
        {blocks.map((b, i) => (
          <TocBlock key={b.id} id={b.id} index={i + 1} title={b.value.title || b.label}>
            {b.value.body && (b.id === "mission" || b.id === "vision")
              ? <p className="nl-serif text-[clamp(1.35rem,2vw,1.7rem)] leading-snug text-blue-deep">{b.value.body}</p>
              : b.value.body ? <RichText text={b.value.body} /> : null}
            {b.value.items && b.value.items.length > 0 && (
              <ol className="nl-grid grid-cols-1 sm:grid-cols-2">
                {b.value.items.map((it, n) => (
                  <li key={`${it.title}-${n}`} className="nl-cell nl-hoverbox grid cursor-default gap-2 p-6">
                    <span className="nl-index text-blue-deep">{String(n + 1).padStart(2, "0")}</span>
                    <h3 className="nl-hb-lift nl-h4">{it.title}</h3>
                    {it.text && <p className="text-[0.95rem] leading-relaxed">{it.text}</p>}
                  </li>
                ))}
              </ol>
            )}
          </TocBlock>
        ))}
        <TocBlock id="leadership" index={blocks.length + 1} title="Leadership">
          {leaders.length === 0 ? <p>Our leadership team will be introduced here soon.</p> : (
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
              {leaders.map((l, i) => (
                <div key={l.id} className={i === 0 && leaders.length > 2 ? "sm:col-span-2" : ""}>
                  <LeaderCard leader={l} featured={i === 0 && leaders.length > 2} />
                </div>
              ))}
            </div>
          )}
        </TocBlock>
      </TocLayout>
      <CtaBand kicker="Plan your visit" title="Come and see. There's a seat saved for you." text={`Sundays 3:00 PM · ${settings.address.line1}, ${settings.address.city}`} href="/visit" label="Plan Your Visit" />
    </>
  );
}
