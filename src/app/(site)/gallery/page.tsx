import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getGallery, getGalleryCategories, getSettings, isPageVisible } from "@/lib/content";
import { GalleryGrid } from "@/components/site/gallery-grid";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from worship, conferences and community life at New Life Global in Chandler, Arizona.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  if (!(await isPageVisible("gallery"))) notFound();
  const [items, categories, settings] = await Promise.all([getGallery(), getGalleryCategories(), getSettings()]);
  const ig = settings.social.find((s) => /instagram/i.test(s.url));
  return (
    <>
      <section className="border-b border-line bg-paper pb-12 pt-[calc(var(--nl-header-h)+clamp(2.5rem,7vh,5rem))]">
        <div className="nl-container grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="nl-reveal grid gap-6">
            <p className="nl-label">Gallery</p>
            <h1 className="nl-h1 max-w-[16ch]">Life together, in pictures.</h1>
          </div>
          {ig && <a href={ig.url} target="_blank" rel="noopener noreferrer" className="nl-textlink">Follow us on Instagram<ArrowUpRight className="h-4 w-4" aria-hidden /></a>}
        </div>
      </section>
      <section className="nl-section !pt-12">
        <div className="nl-container">
          <GalleryGrid items={items} categories={categories} />
        </div>
      </section>
    </>
  );
}
