"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Heart } from "lucide-react";
import type { NavItem } from "@/lib/content/types";
import { Logo } from "./logo";

export interface HeaderProps {
  overHero: boolean;
  nav: NavItem[];
  showGive: boolean;
  logoSrc: string;
  logoAlt: string;
}

/**
 * ai.gov.rw P1: fixed header, transparent over the hero, frosted white after scroll.
 * Menu items come from Church Identity & Settings › Navigation. Groups open a numbered
 * dropdown panel (ai.gov.rw "Opportunity Portfolio" pattern, Bethel-style grouping).
 * Below 1024px: burger + full-screen drawer with grouped, numbered links.
 */
export function SiteHeader({ overHero, nav, showGive, logoSrc, logoAlt }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // drawer and dropdowns remember the page they were opened on, so navigating closes them without an effect
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [menu, setMenu] = useState<{ label: string; path: string } | null>(null);
  const openMenu = menu && menu.path === pathname ? menu.label : null;
  const solid = !overHero || scrolled || Boolean(openMenu);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const items = nav.filter((n) => n.visible);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, [overHero]);

  // dropdown: close on Escape or outside click
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [openMenu]);

  // drawer: lock scroll, trap focus, close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenOn(null); burgerRef.current?.focus(); }
      if (e.key === "Tab" && drawerRef.current) {
        const list = [burgerRef.current!, ...Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a,button"))];
        const i = list.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const light = !solid && !open; // white text over the hero
  const isActive = (n: NavItem) => {
    const paths = [n.href, ...(n.children ?? []).map((c) => c.href)].map((h) => h.split("#")[0]);
    return paths.some((h) => h !== "/" && (pathname === h || pathname.startsWith(h + "/")));
  };
  const linkTone = light ? "text-white/90 hover:text-white" : "text-ink/80 hover:text-ink";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[120] border-b transition-[background,border-color,backdrop-filter] duration-500 ease-soft ${
          light ? "border-transparent bg-transparent" : "border-line bg-white/95 backdrop-blur-[14px] backdrop-saturate-[1.4]"
        }`}
      >
        <div className="nl-container flex h-[var(--nl-header-h)] items-center justify-between gap-6">
          <Logo tone={light ? "light" : "dark"} src={logoSrc} alt={logoAlt} />
          <nav ref={navRef} aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {items.map((n) => {
                const kids = (n.children ?? []).filter((c) => c.visible);
                const active = isActive(n);
                const underline = (
                  <span aria-hidden className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-blue transition-transform duration-500 ease-out-expo ${active || openMenu === n.label ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                );
                if (!kids.length) {
                  return (
                    <li key={n.label}>
                      <Link href={n.href} aria-current={active ? "page" : undefined} className={`group relative py-2 text-[0.9rem] font-medium transition-colors ${linkTone} ${active ? (light ? "text-white" : "text-ink") : ""}`}>
                        {n.label}{underline}
                      </Link>
                    </li>
                  );
                }
                const isOpen = openMenu === n.label;
                return (
                  <li key={n.label} className="relative" onMouseEnter={() => setMenu({ label: n.label, path: pathname })} onMouseLeave={() => setMenu(null)}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`menu-${n.label}`}
                      onClick={() => setMenu(isOpen ? null : { label: n.label, path: pathname })}
                      className={`group relative flex items-center gap-1 py-2 text-[0.9rem] font-medium transition-colors ${linkTone} ${active ? (light ? "text-white" : "text-ink") : ""}`}
                    >
                      {n.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                      {underline}
                    </button>
                    {/* numbered dropdown panel (ai.gov.rw pattern) */}
                    <div
                      id={`menu-${n.label}`}
                      className={`absolute left-1/2 top-full w-[min(30rem,90vw)] -translate-x-1/2 pt-4 transition-[opacity,transform,visibility] duration-300 ease-soft ${isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
                    >
                      <div className="border border-line bg-white p-2 shadow-[0_24px_60px_-24px_rgba(11,38,36,.35)]">
                        <p className="px-4 pb-2 pt-3 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-muted">{n.label}</p>
                        <ol>
                          {kids.map((c, i) => (
                            <li key={c.href + c.label}>
                              <Link href={c.href} onClick={() => setMenu(null)} className="nl-hoverbox group/item grid grid-cols-[2.25rem_1fr_auto] items-center gap-2 px-4 py-3">
                                <span className="nl-index nl-num text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                                <span className="grid">
                                  <span className="nl-hb-lift text-[0.95rem] font-semibold text-ink">{c.label}</span>
                                  {c.description && <span className="text-xs text-muted">{c.description}</span>}
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted transition-transform duration-500 ease-out-expo group-hover/item:translate-x-1 group-hover/item:text-blue" aria-hidden />
                              </Link>
                            </li>
                          ))}
                        </ol>
                        {n.href && !kids.some((c) => c.href === n.href) && (
                          <Link href={n.href} onClick={() => setMenu(null)} className="mx-2 mb-2 mt-1 flex items-center justify-between border-t border-line px-2 pt-3 text-sm font-semibold text-blue-deep">
                            All {n.label.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {showGive && (
              <Link href="/give" className={`hidden items-center gap-2 px-3 py-2 text-[0.8rem] font-bold uppercase tracking-[0.12em] transition-colors sm:inline-flex ${light ? "text-white hover:text-blue" : "text-blue-deep hover:text-blue"}`}>
                <Heart className="h-4 w-4" aria-hidden />Give
              </Link>
            )}
            <Link href="/visit" className={`nl-btn max-sm:!hidden !min-h-0 !py-3.5 whitespace-nowrap ${light ? "nl-btn--ghost" : "nl-btn--ink-ghost"}`}>
              <span>Plan Your Visit</span>
            </Link>
            <button
              ref={burgerRef}
              type="button"
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
              aria-expanded={open}
              aria-controls="site-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpenOn(open ? null : pathname)}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} className={`block h-[1.5px] w-6 transition-all duration-400 ease-out-expo ${light ? "bg-white" : "bg-ink"} ${
                  open && i === 0 ? "translate-y-[6.5px] rotate-45" : ""} ${open && i === 1 ? "opacity-0" : ""} ${open && i === 2 ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
              ))}
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`fixed inset-0 z-[110] overflow-y-auto bg-white px-[var(--nl-pad)] pb-12 pt-[calc(var(--nl-header-h)+2rem)] transition-[opacity,transform,visibility] duration-500 ease-soft lg:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"
        }`}
      >
        <nav aria-label="Mobile">
          <ol className="border-t border-line">
            {items.map((n, i) => {
              const kids = (n.children ?? []).filter((c) => c.visible);
              return (
                <li key={n.label} className="border-b border-line">
                  <Link href={n.href} className="flex items-center gap-5 py-5 text-2xl font-medium tracking-tight text-ink">
                    <span className="nl-index w-8 text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                    {n.label}
                    <ArrowRight className="ml-auto h-5 w-5 text-muted" aria-hidden />
                  </Link>
                  {kids.length > 0 && (
                    <ul className="grid gap-1 pb-4 pl-[3.25rem]">
                      {kids.map((c) => <li key={c.href + c.label}><Link href={c.href} className="block py-1.5 text-base text-body hover:text-blue-deep">{c.label}</Link></li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="mt-10 grid gap-3">
          <Link href="/visit" className="nl-btn nl-btn--lg nl-btn--block"><span>Plan Your Visit</span><ArrowRight className="h-5 w-5" aria-hidden /></Link>
          {showGive && <Link href="/give" className="nl-btn nl-btn--ink-ghost nl-btn--lg nl-btn--block"><span>Give</span><Heart className="h-5 w-5" aria-hidden /></Link>}
        </div>
      </div>
    </>
  );
}
