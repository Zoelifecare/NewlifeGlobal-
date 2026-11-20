"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Adds `is-in` to .nl-reveal / .nl-clip elements as they enter the viewport (ai.gov.rw P11). */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".nl-reveal:not(.is-in), .nl-clip:not(.is-in)"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    // A fully clipped element (clip-path inset 100%) never "intersects" in Chromium,
    // so .nl-clip elements are tracked through their parent box instead.
    const targets = new Map<Element, HTMLElement[]>();
    els.forEach((el) => {
      const t = el.classList.contains("nl-clip") ? el.parentElement ?? el : el;
      targets.set(t, [...(targets.get(t) ?? []), el]);
    });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        targets.get(e.target)?.forEach((el) => el.classList.add("is-in"));
        io.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    targets.forEach((_, t) => io.observe(t));
    return () => io.disconnect();
  }, [pathname]);

  // Cursor spotlight for every .nl-hoverbox: one delegated listener sets --mx/--my on the box under the pointer.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = (e.target as Element | null)?.closest?.<HTMLElement>(".nl-hoverbox");
      if (!box) return;
      const r = box.getBoundingClientRect();
      box.style.setProperty("--mx", `${e.clientX - r.left}px`);
      box.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);
  return null;
}
