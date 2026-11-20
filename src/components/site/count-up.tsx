"use client";
import { useEffect, useRef, useState } from "react";

/** Animates the numeric part of a value ("19,000", "25", "2001") once it scrolls into view. Non-numeric values render as-is. */
export function CountUp({ value }: { value: string }) {
  const match = value.match(/^(\D*)([\d,]+)(\D*)$/);
  const target = match ? Number(match[2].replace(/,/g, "")) : NaN;
  const isYear = match && /^\d{4}$/.test(match[2]);
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!match || Number.isNaN(target) || isYear) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const fmt = (n: number) => `${match[1]}${match[2].includes(",") ? n.toLocaleString("en-US") : n}${match[3]}`;
    setShown(fmt(0));
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min((t - t0) / 1600, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        setShown(fmt(Math.round(target * eased)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref} aria-label={value}>{shown}</span>;
}
