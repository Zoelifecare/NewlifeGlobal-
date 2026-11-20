"use client";
import { useEffect, useState } from "react";

export interface TocItem { id: string; label: string }

/**
 * ai.gov.rw P10 — sticky numbered table of contents with scroll-spy.
 * Desktop: vertical rail. ≤1024px: horizontal scrollable chip bar under the header.
 */
export function StickyToc({ items, title = "On this page" }: { items: TocItem[]; title?: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  return (
    <>
      <nav aria-label={title} className="sticky top-[calc(var(--nl-header-h)+1.5rem)] hidden border-l border-line pl-5 lg:grid">
        <p className="mb-3 text-[0.625rem] font-bold uppercase tracking-[0.2em] text-muted">{title}</p>
        <ol className="grid gap-0.5">
          {items.map((it, i) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={active === it.id ? "location" : undefined}
                className={`relative grid grid-cols-[1.75rem_1fr] gap-1.5 py-1.5 text-[0.8125rem] leading-snug transition-colors before:absolute before:-left-5 before:inset-y-0 before:w-px before:origin-top before:bg-blue before:transition-transform before:duration-500 ${
                  active === it.id ? "text-ink before:scale-y-100" : "text-muted before:scale-y-0 hover:text-ink"
                }`}
              >
                <b className={`text-[0.6875rem] ${active === it.id ? "text-blue-deep" : "text-muted/70"}`}>{String(i + 1).padStart(2, "0")}</b>
                {it.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <nav aria-label={`${title} (compact)`} className="sticky top-[var(--nl-header-h)] z-30 -mx-[var(--nl-pad)] mb-8 overflow-x-auto border-b border-line bg-white/95 px-[var(--nl-pad)] backdrop-blur lg:hidden">
        <ol className="flex gap-6 whitespace-nowrap py-3">
          {items.map((it, i) => (
            <li key={it.id}>
              <a href={`#${it.id}`} className={`text-sm ${active === it.id ? "font-semibold text-ink" : "text-muted"}`}>
                <span className="mr-1.5 text-[0.7rem] text-blue-deep">{String(i + 1).padStart(2, "0")}</span>{it.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Numbered content block that pairs with StickyToc. */
export function TocBlock({ id, index, title, children }: { id: string; index: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="nl-reveal scroll-mt-[calc(var(--nl-header-h)+4rem)] border-t border-line py-[clamp(2.5rem,5vw,4rem)] first:border-t-0 first:pt-0">
      <div className="grid gap-6 md:grid-cols-[5rem_1fr]">
        <span className="nl-num text-sm font-semibold text-blue-deep">{String(index).padStart(2, "0")}</span>
        <div className="grid gap-5">
          <h2 id={`${id}-h`} className="nl-h3 !text-[clamp(1.5rem,2.4vw,2.1rem)]">{title}</h2>
          <div className="grid gap-4 text-body [&_p]:m-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function TocLayout({ toc, children }: { toc: TocItem[]; children: React.ReactNode }) {
  return (
    <div className="nl-container py-[clamp(3rem,8vh,6rem)]">
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-16 xl:grid-cols-[17rem_1fr]">
        <aside><StickyToc items={toc} /></aside>
        <div className="max-w-[52rem]">{children}</div>
      </div>
    </div>
  );
}
