import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSettings, isPageVisible } from "@/lib/content";
import { PrayerForm } from "@/components/site/forms/public-forms";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Prayer Requests",
  description: "Share a prayer request with the pastoral team at New Life Global. Requests are confidential.",
  alternates: { canonical: "/prayer" },
};

export default async function PrayerPage() {
  if (!(await isPageVisible("prayer"))) notFound();
  const s = await getSettings();
  return (
    <section className="bg-paper pb-[clamp(4rem,10vh,7rem)] pt-[calc(var(--nl-header-h)+clamp(2.5rem,7vh,5rem))]">
      <div className="nl-container grid gap-14 lg:grid-cols-12">
        <div className="nl-reveal grid content-start gap-6 lg:col-span-5">
          <p className="nl-label">Prayer</p>
          <h1 className="nl-h1">How can we pray for you?</h1>
          <p className="nl-lead">We believe in a God who hears. Whatever you are carrying, you don&apos;t have to carry it alone. Our pastors and prayer team would be honoured to pray with you.</p>
          <blockquote className="border-l-2 border-blue pl-5">
            <p className="nl-serif text-xl leading-snug text-blue-deep">“Cast all your anxiety on him because he cares for you.”</p>
            <footer className="mt-2 text-sm text-muted">1 Peter 5:7</footer>
          </blockquote>
          <div className="border-t border-line pt-6 text-sm">
            <p className="font-semibold text-ink">Pray with us in person</p>
            <ul className="mt-2 grid gap-1.5 text-body">
              {s.services.filter((x) => /prayer|glory/i.test(x.name)).map((x) => <li key={x.name} className="nl-hoverbox cursor-default border-b border-line px-2 py-2"><span className="nl-hb-lift inline-block font-medium text-ink">{x.name}</span>: {x.day}, {x.time}</li>)}
            </ul>
          </div>
        </div>
        <div className="border border-line bg-white p-[clamp(1.5rem,4vw,3rem)] lg:col-span-7">
          <h2 className="nl-h3 mb-2">Share a prayer request</h2>
          <p className="mb-8 text-sm text-muted">Your name and email are optional.</p>
          <PrayerForm />
        </div>
      </div>
    </section>
  );
}
