import Link from "next/link";
import { LongArrow } from "./icons";

/** ai.gov.rw P6 — split ink CTA band. */
export function CtaBand({ kicker, title, text, href, label }: { kicker: string; title: string; text?: string; href: string; label: string }) {
  return (
    <section className="bg-ink text-white">
      <div className="nl-container grid items-end gap-8 py-[clamp(3.5rem,9vh,6rem)] md:grid-cols-[1.15fr_.85fr] md:gap-16">
        <div className="nl-reveal grid gap-4">
          <p className="nl-label nl-label--light">{kicker}</p>
          <h2 className="max-w-[22ch] text-[clamp(1.9rem,3.4vw,3.1rem)] font-medium leading-[1.08] tracking-tight">{title}</h2>
        </div>
        <div className="nl-reveal grid justify-items-start gap-5">
          {text && <p className="text-white/70">{text}</p>}
          <Link href={href} className="nl-btn nl-btn--light nl-btn--lg"><span>{label}</span><LongArrow /></Link>
        </div>
      </div>
    </section>
  );
}
