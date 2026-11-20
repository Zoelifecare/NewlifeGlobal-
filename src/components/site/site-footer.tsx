import Link from "next/link";
import type { Ministry, SiteSettings } from "@/lib/content/types";
import { Logo } from "./logo";
import { NewsletterForm } from "./forms/newsletter-form";

/** ai.gov.rw P9 — brand column (4fr) + link columns, uppercase heads, slim legal row. */
export function SiteFooter({ settings, ministries }: { settings: SiteSettings; ministries: Ministry[] }) {
  const year = new Date().getFullYear();
  const a = settings.address;
  return (
    <footer className="bg-ink text-white/70">
      <div className="nl-container grid gap-12 py-16 md:py-20 xl:grid-cols-[minmax(0,4fr)_repeat(4,minmax(0,2fr))] xl:gap-14">
        <div className="grid content-start gap-6 md:col-span-2 xl:col-span-1">
          <Logo tone="light" />
          <p className="max-w-[16ch] text-[clamp(1.6rem,2.4vw,2.2rem)] font-medium leading-[1.05] tracking-tight text-white">
            {settings.pillars.join(". ")}.
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">{settings.affiliation}.</p>
        </div>

        <FooterCol title="Visit">
          <li className="text-sm leading-relaxed">
            {a.line1}<br />{a.city}, {a.region} {a.postal}
          </li>
          {settings.services.slice(0, 2).map((s) => (
            <li key={s.name} className="text-sm leading-relaxed">
              <span className="text-white">{s.name}</span><br />{s.day} · {s.time}
            </li>
          ))}
          <li><Link className="footer-link" href="/visit">Plan your visit →</Link></li>
        </FooterCol>

        <FooterCol title="Ministries">
          {ministries.slice(0, 6).map((m) => (
            <li key={m.id}><Link className="footer-link" href={`/ministries/${m.slug}`}>{m.name}</Link></li>
          ))}
        </FooterCol>

        <FooterCol title="Explore">
          {[["About Us", "/about"], ["Leadership", "/about#leadership"], ["Messages", "/messages"], ["Events", "/events"], ["Gallery", "/gallery"], ["Prayer Requests", "/prayer"], ["Contact", "/contact"]].map(([l, h]) => (
            <li key={h}><Link className="footer-link" href={h}>{l}</Link></li>
          ))}
        </FooterCol>

        <FooterCol title="Stay connected">
          {settings.contact.email && <li><a className="footer-link" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a></li>}
          {settings.contact.phone && <li><a className="footer-link" href={`tel:${settings.contact.phone.replace(/[^\d+]/g, "")}`}>{settings.contact.phone}</a></li>}
          {settings.social.map((s) => (
            <li key={s.url}><a className="footer-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a></li>
          ))}
          <li className="pt-2"><NewsletterForm /></li>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="nl-container flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-white/50">
          <p>© {year} {settings.name}. Part of the Africa New Life family.</p>
          <ul className="flex flex-wrap gap-6">
            <li><Link className="hover:text-blue" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-blue" href="/admin">Staff login</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-4">
      <h2 className="text-[0.625rem] font-bold uppercase tracking-[0.22em] text-white/45">{title}</h2>
      <ul className="grid gap-3 [&_.footer-link]:text-sm [&_.footer-link]:text-white/75 [&_.footer-link]:transition-colors [&_.footer-link:hover]:text-blue">
        {children}
      </ul>
    </div>
  );
}
