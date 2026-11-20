import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Heart } from "lucide-react";
import { getChurchContent, getMediaByIds, getSettings, isPageVisible } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { RichText } from "@/components/site/rich-text";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Give",
  description: "Support the ministry of New Life Global in Chandler, Arizona.",
  alternates: { canonical: "/give" },
};

/**
 * Giving options are managed in Church Identity & Settings › Giving. The website never processes
 * payments itself and never shows a provider the church has not approved: it only links to approved,
 * https giving links. With no approved method, the page says so honestly.
 */
export default async function GivePage() {
  if (!(await isPageVisible("give"))) notFound();
  const [settings, content, media] = await Promise.all([getSettings(), getChurchContent(), getMediaByIds(["ig-fellowship"])]);
  if (!settings.giving.enabled) notFound();
  const intro = content.give_intro;
  const methods = settings.giving.methods.filter((m) => m.label?.trim());
  const img = media["ig-fellowship"];

  return (
    <>
      <PageHero
        kicker="Give"
        title={intro?.title || "Give"}
        tagline={null}
        meta={[settings.name, `${settings.address.city}, Arizona`]}
        image={img ? { url: img.url, alt: img.alt } : null}
        badge="Worship · Grow · Serve"
      />
      <section className="nl-section">
        <div className="nl-container grid gap-12 lg:grid-cols-12">
          <div className="nl-reveal grid content-start gap-5 lg:col-span-5">
            <p className="nl-label">Ways to give</p>
            {intro?.body ? <RichText text={intro.body} className="nl-lead" /> : null}
          </div>
          <div className="lg:col-span-7">
            {methods.length === 0 ? (
              <div className="nl-hoverbox border border-line p-[clamp(1.5rem,4vw,2.5rem)]">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-mist text-blue-deep"><Heart className="h-5 w-5" aria-hidden /></span>
                <h2 className="nl-hb-lift nl-h3">Online giving is coming soon.</h2>
                <p className="mt-3 text-body">Giving details will be published here once they are confirmed by the church. If you have a question about giving, please get in touch.</p>
                <Link href="/contact?topic=giving" className="nl-btn mt-6 w-fit"><span>Contact us</span></Link>
              </div>
            ) : (
              <ol className="border-t border-line">
                {methods.map((m, i) => (
                  <li key={`${m.label}-${i}`} className="nl-hoverbox border-b border-line">
                    <div className="grid gap-4 px-3 py-7 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center">
                      <span className="nl-index nl-num text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                      <div className="grid gap-1">
                        <h2 className="nl-hb-lift text-xl font-medium tracking-tight text-ink">{m.label}</h2>
                        {m.description && <p className="m-0 text-body">{m.description}</p>}
                        {m.note && <p className="m-0 text-sm text-muted">{m.note}</p>}
                      </div>
                      {m.url && /^https:\/\//.test(m.url) && (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="nl-btn w-fit">
                          <span>Give</span><ArrowUpRight className="h-4 w-4" aria-hidden />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-6 text-xs text-muted">Online gifts are handled by the giving provider shown on its own secure page. This website does not collect card or bank details.</p>
          </div>
        </div>
      </section>
    </>
  );
}
