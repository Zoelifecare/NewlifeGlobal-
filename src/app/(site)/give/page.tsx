import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getChurchContent, getGivingCatalog, getMediaByIds, getSettings, isPageVisible } from "@/lib/content";
import { PageHero } from "@/components/site/page-hero";
import { RichText } from "@/components/site/rich-text";
import { GivingExperience } from "@/components/site/giving/giving-experience";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Give",
  description: "Give to New Life Global in Chandler, Arizona: give now, make a pledge, give by Cash Drop or other ways.",
  alternates: { canonical: "/give" },
};

/**
 * Giving page. Four guided options: Give Now, Make a Pledge, Give by Cash Drop and Other Ways.
 * Methods are managed in Admin › Giving › Payment methods. Zelle and Cash App use the church phone from
 * Site settings until finance enters a specific handle. The website never collects card or bank details.
 */
export default async function GivePage() {
  if (!(await isPageVisible("give"))) notFound();
  const [settings, content, rawCatalog, media] = await Promise.all([getSettings(), getChurchContent(), getGivingCatalog(), getMediaByIds(["ig-fellowship", "ig-rw-05"])]);
  if (!settings.giving.enabled) notFound();
  const phone = settings.contact.phone?.trim() || null;
  const catalog = {
    ...rawCatalog,
    methods: rawCatalog.methods.map((m) => (!m.handle && (m.kind === "zelle" || m.kind === "cashapp") ? { ...m, handle: phone } : m)),
  };
  const intro = content.give_intro;
  const img = media["ig-fellowship"];
  const bg = media["ig-rw-05"];

  return (
    <>
      <PageHero
        kicker="Give"
        title={intro?.title || "Give"}
        tagline="Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver. (2 Corinthians 9:7)"
        meta={[settings.name, `${settings.address.city}, Arizona`]}
        image={img ? { url: img.url, alt: img.alt } : null}
        badge="Worship · Grow · Serve"
      />
      <section className="relative isolate overflow-hidden bg-ink py-[clamp(4rem,9vw,7rem)] text-white" id="ways">
        {bg && <Image src={bg.url} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(0,27,61,.94)_0%,rgba(0,63,130,.78)_55%,rgba(0,161,222,.45)_100%)]" />
        <div className="nl-container">
          <div className="mb-10 grid gap-4 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="nl-label nl-label--light mb-4">Ways to give</p>
              <h2 className="nl-h2 !text-white">Give with a cheerful heart.</h2>
            </div>
            {intro?.body && <div className="text-white/80 lg:col-span-5"><RichText text={intro.body} /></div>}
          </div>
          <GivingExperience catalog={catalog} />
        </div>
      </section>
    </>
  );
}
