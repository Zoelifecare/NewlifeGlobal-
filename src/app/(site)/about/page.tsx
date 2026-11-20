import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getLeaders, getMediaByIds, getSettings } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { TocBlock, TocLayout } from "@/components/site/sticky-toc";
import { CtaBand } from "@/components/site/cta-band";
import { HoverVideo } from "@/components/site/hover-video";
import { LeaderCard } from "@/components/site/leader-card";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About Us",
  description: "Our story, mission, beliefs and leadership, and our roots in New Life Bible Church in Kigali, Rwanda.",
  alternates: { canonical: "/about" },
};

const TOC = [
  { id: "story", label: "Our Story" },
  { id: "mission", label: "Our Mission" },
  { id: "vision", label: "Our Vision" },
  { id: "beliefs", label: "What We Believe" },
  { id: "values", label: "Our Values" },
  { id: "leadership", label: "Leadership" },
  { id: "rwanda", label: "Our Rwanda Connection" },
];

/* Mission/vision/purpose: New Life Bible Church, newlifekigali.org/about-us (R7).
   Statement of faith + core values: Africa New Life, africanewlife.org/about-us (R2). */
const BELIEFS = [
  ["The Bible", "We believe the Bible is the inspired, infallible and authoritative Word of God."],
  ["God", "We believe in one God, eternally existing in three persons: Father, Son and Holy Spirit."],
  ["Jesus Christ", "We believe in the deity of Christ, His virgin birth, sinless life, miracles, atoning death, bodily resurrection, ascension, and His personal return."],
  ["Salvation", "We believe regeneration by the Holy Spirit is essential for the salvation of lost and sinful people."],
  ["The Holy Spirit", "We believe in the present ministry of the Holy Spirit, by whose indwelling the Christian is enabled to live a godly life."],
  ["The Church", "We believe in the spiritual unity of believers in Christ, with equality across racial, gender and class differences."],
];

const VALUES = ["Trust Jesus", "Act with Compassion", "Model Integrity & Stewardship", "Work as a Team", "Lead with Excellence", "Honor Relationships"];

const PURPOSE = ["Worship God", "Study His Word", "Pray", "Love one another", "Be unified in Christ", "Help each other", "Live as godly people", "Be equipped to evangelize"];

export default async function AboutPage() {
  const [settings, leaders, media] = await Promise.all([
    getSettings(), getLeaders(), getMediaByIds(["ig-rw-07", "yt-25-years"]),
  ]);
  const hero = media["ig-rw-07"] ?? Object.values(media)[0] ?? null;
  const rwanda = media["yt-25-years"];

  return (
    <>
      <PageHero
        kicker="About New Life Global"
        title="A young church with deep roots."
        tagline={`${settings.affiliation}.`}
        meta={["Chandler, Arizona", "Sundays 3:00 PM", "Part of Africa New Life"]}
        image={hero ? { url: hero.url, alt: hero.alt } : null}
        badge="Worship · Grow · Serve"
      />
      <TocLayout toc={TOC}>
        <TocBlock id="story" index={1} title="Our Story">
          <p>Our story began in Rwanda in 2001, when Pastors Charles and Florence Mugisha, both raised as Rwandan refugees in Uganda, started Africa New Life by sponsoring the education of the first children in Kayonza.</p>
          <p>From that small beginning grew New Life Bible Church in Kigali (2003), a family of churches across Rwanda, schools, the Africa College of Theology and Dream Medical Center. In Chandler, Arizona, New Life Global carries the same Gospel and the same family spirit, and in December 2026 we celebrate our first anniversary.</p>
        </TocBlock>
        <TocBlock id="mission" index={2} title="Our Mission">
          <p className="nl-serif text-[clamp(1.35rem,2vw,1.7rem)] leading-snug text-blue-deep">To teach and preach the Bible in an applicable way, to make disciples for Christ, and to worship God in a lively and heartfelt atmosphere.</p>
          <p>We are carriers of love and hope to families and communities through the proclamation of the Gospel and acts of compassion.</p>
        </TocBlock>
        <TocBlock id="vision" index={3} title="Our Vision">
          <p className="nl-serif text-[clamp(1.35rem,2vw,1.7rem)] leading-snug text-blue-deep">A healthy church that transforms lives and nations by the proclamation of the Gospel of Jesus Christ and acts of compassion.</p>
          <p className="text-sm text-muted">Our anchor verse, {settings.verse.ref}: “{settings.verse.text}”</p>
        </TocBlock>
        <TocBlock id="beliefs" index={4} title="What We Believe">
          <ol className="nl-grid grid-cols-1 sm:grid-cols-2">
            {BELIEFS.map(([h, t], i) => (
              <li key={h} className="nl-cell nl-hoverbox grid cursor-default gap-2 p-6">
                <span className="nl-index text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="nl-hb-lift nl-h4">{h}</h3>
                <p className="text-[0.95rem] leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
                  </TocBlock>
        <TocBlock id="values" index={5} title="Our Values">
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <li key={v} className="nl-hoverbox flex cursor-default items-baseline gap-4 border-b border-line px-2 py-4">
                <span className="nl-index text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                <span className="nl-hb-lift text-lg font-medium text-ink">{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">As a church with purpose, we gather to:</p>
          <ul className="flex flex-wrap gap-2">
            {PURPOSE.map((p) => <li key={p} className="nl-hoverbox cursor-default border border-line bg-paper transition-colors hover:border-blue px-3 py-2 text-sm text-ink">{p}</li>)}
          </ul>
        </TocBlock>
        <TocBlock id="leadership" index={6} title="Leadership">
          <p>Our church is led by pastors whose lives have been shaped by the story of Africa New Life.</p>
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {leaders.map((l) => <LeaderCard key={l.id} leader={l} />)}
          </div>
        </TocBlock>
        <TocBlock id="rwanda" index={7} title="Our Rwanda Connection">
          <p>New Life Global is part of the Africa New Life family. Founded and led by Rwandans, Africa New Life serves communities across Rwanda through New Life Bible Churches, educational sponsorship, the Africa College of Theology, and Dream Medical Center. In 2026 the ministry celebrated 25 years of transforming lives.</p>
          {rwanda && (
            <HoverVideo videoId="9-581YAL-Ys" image={{ url: rwanda.url, alt: rwanda.alt }} label="25 Years of Transforming Lives: Thanksgiving Service" className="relative aspect-video" sizes="(min-width:1024px) 52rem, 100vw" />
          )}
          <div className="flex flex-wrap gap-6">
            <a className="nl-textlink" href="https://www.africanewlife.org/" target="_blank" rel="noopener noreferrer">Africa New Life Ministries <ArrowUpRight className="h-4 w-4" aria-hidden /></a>
            <a className="nl-textlink" href="https://newlifekigali.org/" target="_blank" rel="noopener noreferrer">New Life Bible Church, Kigali <ArrowUpRight className="h-4 w-4" aria-hidden /></a>
          </div>
        </TocBlock>
      </TocLayout>
      <CtaBand kicker="Plan your visit" title="Come and see. There's a seat saved for you." text={`Sundays 3:00 PM · ${settings.address.line1}, ${settings.address.city}`} href="/visit" label="Plan Your Visit" />
    </>
  );
}
