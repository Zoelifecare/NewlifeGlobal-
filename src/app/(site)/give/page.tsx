import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getChurchContent, getGivingCatalog, getMediaByIds, getSettings, isPageVisible } from "@/lib/content";
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
  const [settings, content, rawCatalog, media] = await Promise.all([getSettings(), getChurchContent(), getGivingCatalog(), getMediaByIds(["ig-rw-05"])]);
  if (!settings.giving.enabled) notFound();
  const phone = settings.contact.phone?.trim() || null;
  const catalog = {
    ...rawCatalog,
    methods: rawCatalog.methods.map((m) => (!m.handle && (m.kind === "zelle" || m.kind === "cashapp") ? { ...m, handle: phone } : m)),
  };
  const intro = content.give_intro;
  const bg = media["ig-rw-05"];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink pb-[clamp(4rem,9vw,7rem)] pt-[calc(var(--nl-header-h)+clamp(1.5rem,4vw,3rem))] text-white" id="ways">
        {bg && <Image src={bg.url} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-40" />}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(11,38,36,.94)_0%,rgba(22,58,51,.78)_55%,rgba(216,184,121,.45)_100%)]" />
        <div className="nl-container">
          <div className="mb-8 grid gap-3 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="nl-label nl-label--light mb-3">{intro?.title || "Give"} · {settings.name}</p>
              <h1 className="nl-h2 !text-white">Give with a cheerful heart.</h1>
            </div>
            <div className="grid gap-2 text-white/80 lg:col-span-5">
              {intro?.body && <RichText text={intro.body} />}
              <p className="m-0 text-sm italic text-white/60">&ldquo;God loveth a cheerful giver.&rdquo; 2 Corinthians 9:7</p>
            </div>
          </div>
          <GivingExperience catalog={catalog} />
        </div>
      </section>
    </>
  );
}
