"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Logo } from "./logo";

export const NAV = [
  { href: "/about", label: "About" },
  { href: "/ministries", label: "Ministries" },
  { href: "/messages", label: "Messages" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/prayer", label: "Prayer" },
];

const DRAWER_EXTRA = [
  { href: "/visit", label: "Plan Your Visit" },
  { href: "/contact", label: "Contact" },
];

/**
 * ai.gov.rw P1: fixed header, transparent over the hero, frosted white after scroll;
 * burger + full-screen drawer below 1024px.
 */
export function SiteHeader({ overHero }: { overHero: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // the drawer remembers which page it was opened on, so navigating closes it without an effect
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof v === "function" ? v(open) : v) ? pathname : null);
  const solid = !overHero || scrolled;
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, [overHero]);

  // lock scroll, trap focus and close on Escape while the drawer is open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpenOn(null); burgerRef.current?.focus(); }
      if (e.key === "Tab" && drawerRef.current) {
        const f = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a,button"));
        const list = [burgerRef.current!, ...f];
        const i = list.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (!e.shiftKey && i === list.length - 1) { e.preventDefault(); list[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [open]);

  const light = !solid && !open; // white text over the hero
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[120] border-b transition-[background,border-color,backdrop-filter] duration-500 ease-soft ${
          light ? "border-transparent bg-transparent" : "border-line bg-white/90 backdrop-blur-[14px] backdrop-saturate-[1.4]"
        }`}
      >
        <div className="nl-container flex h-[var(--nl-header-h)] items-center justify-between gap-6">
          <Logo tone={light ? "light" : "dark"} />
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(n.href) ? "page" : undefined}
                    className={`group relative py-2 text-[0.9rem] font-medium transition-colors ${
                      light ? "text-white/90 hover:text-white" : "text-ink/80 hover:text-ink"
                    } ${isActive(n.href) ? (light ? "text-white" : "text-ink") : ""}`}
                  >
                    {n.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-500 ease-out-expo ${
                        light ? "bg-blue" : "bg-blue"
                      } ${isActive(n.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/visit"
              className={`nl-btn hidden !min-h-0 !py-3.5 sm:inline-flex ${light ? "nl-btn--ghost" : "nl-btn--ink-ghost"}`}
            >
              <span>Plan Your Visit</span>
            </Link>
            <button
              ref={burgerRef}
              type="button"
              className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
              aria-expanded={open}
              aria-controls="site-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`block h-[1.5px] w-6 transition-all duration-400 ease-out-expo ${light ? "bg-white" : "bg-ink"} ${
                    open && i === 0 ? "translate-y-[6.5px] rotate-45" : ""
                  } ${open && i === 1 ? "opacity-0" : ""} ${open && i === 2 ? "-translate-y-[6.5px] -rotate-45" : ""}`}
                />
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
            {[...NAV, ...DRAWER_EXTRA].map((n, i) => (
              <li key={n.href} className="border-b border-line">
                <Link href={n.href} className="flex items-center gap-5 py-5 text-2xl font-medium tracking-tight text-ink" aria-current={isActive(n.href) ? "page" : undefined}>
                  <span className="nl-index w-8 text-blue-deep">{String(i + 1).padStart(2, "0")}</span>
                  {n.label}
                  <ArrowRight className="ml-auto h-5 w-5 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <Link href="/visit" className="nl-btn nl-btn--lg nl-btn--block mt-10">
          <span>Plan Your Visit</span>
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </>
  );
}
