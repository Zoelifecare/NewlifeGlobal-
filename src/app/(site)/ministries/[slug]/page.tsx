import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getMinistries, getMinistry, isPageVisible } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { TocBlock, TocLayout } from "@/components/site/sticky-toc";
import { LeaderCard } from "@/components/site/leader-card";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getMinistries()).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = await getMinistry((await params).slug);
  if (!m) return { title: "Ministry not found" };
  return { title: m.name, description: m.summary ?? undefined, alternates: { canonical: `/ministries/${m.slug}` }, openGraph: m.image ? { images: [m.image.url] } : undefined };
}

export default async function MinistryPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isPageVisible("ministries"))) notFound();
  const m = await getMinistry((await params).slug);
  if (!m) notFound();
  const all = await getMinistries();
  const others = all.filter((x) => x.id !== m.id).slice(0, 4);

  const toc = [
    { id: "about", label: `About ${m.name}` },
    { id: "when", label: "When we meet" },
    ...(m.activities.length ? [{ id: "activities", label: "Activities" }] : []),
    ...(m.leaders.length ? [{ id: "leaders", label: "Leadership" }] : []),
    { id: "join", label: "Get involved" },
  ];
  let n = 0;

  return (
    <>
      <PageHero
        kicker="Ministry"
        title={m.name}
        tagline={m.summary}
        meta={[m.meetingSchedule, m.location].filter(Boolean) as string[]}
        image={m.image ? { url: m.image.url, alt: m.image.alt } : null}
        badge={m.tagline ?? undefined}
        crumbs={[{ label: "Ministries", href: "/ministries" }]}
      />
      <TocLayout toc={toc}>
        <TocBlock id="about" index={++n} title={`About ${m.name}`}>
          {(m.description ?? m.summary ?? "").split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </TocBlock>
        <TocBlock id="when" index={++n} title="When we meet">
          <dl className="grid border-t border-line sm:grid-cols-2">
            <div className="nl-hoverbox cursor-default border-b border-line px-3 py-4"><dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Schedule</dt><dd className="nl-hb-lift m-0 mt-1 text-lg text-ink">{m.meetingSchedule ?? "To be announced"}</dd></div>
            <div className="nl-hoverbox cursor-default border-b border-line px-3 py-4"><dt className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Location</dt><dd className="nl-hb-lift m-0 mt-1 text-lg text-ink">{m.location ?? "To be announced"}</dd></div>
          </dl>
        </TocBlock>
        {m.activities.length > 0 && (
          <TocBlock id="activities" index={++n} title="Activities">
            <ul className="flex flex-wrap gap-2">{m.activities.map((a) => <li key={a} className="nl-hoverbox cursor-default border border-line bg-paper transition-colors hover:border-blue px-4 py-2 text-ink">{a}</li>)}</ul>
          </TocBlock>
        )}
        {m.leaders.length > 0 && (
          <TocBlock id="leaders" index={++n} title="Leadership">
            <div className="grid gap-px border border-line bg-line sm:grid-cols-2">{m.leaders.map((l) => <LeaderCard key={l.leader.id} leader={{ ...l.leader, title: l.roleTitle ?? l.leader.title }} />)}</div>
          </TocBlock>
        )}
        <TocBlock id="join" index={++n} title="Get involved">
          <p>We would love to have you. Reach out and someone from the {m.name.toLowerCase()} team will get in touch.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={m.joinUrl ?? `/contact?topic=${m.slug}`} className="nl-btn"><span>Join {m.name}</span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
            {m.contactEmail && <a href={`mailto:${m.contactEmail}`} className="nl-btn nl-btn--ink-ghost"><span>{m.contactEmail}</span></a>}
          </div>
        </TocBlock>
        {others.length > 0 && (
          <div className="mt-6 border-t border-line pt-10">
            <p className="nl-label mb-5">Other ministries</p>
            <ul className="flex flex-wrap gap-2">
              {others.map((o) => <li key={o.id}><Link href={`/ministries/${o.slug}`} className="inline-block border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-blue hover:bg-mist">{o.name}</Link></li>)}
            </ul>
          </div>
        )}
      </TocLayout>
    </>
  );
}
