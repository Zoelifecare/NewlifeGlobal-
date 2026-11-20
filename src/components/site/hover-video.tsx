"use client";
import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Image that plays a muted YouTube clip on hover/focus (OD-8), and on tap for touch devices.
 * The iframe is only mounted while active (no third-party load until the visitor interacts).
 */
export function HoverVideo({
  videoId, image, label, className = "", sizes = "(min-width: 1024px) 50vw, 100vw", priority = false,
}: { videoId: string; image: { url: string; alt: string }; label: string; className?: string; sizes?: string; priority?: boolean }) {
  const [active, setActive] = useState(false);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&playsinline=1&rel=0`;

  return (
    <div
      className={`group overflow-hidden bg-ink ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`}
      onMouseEnter={() => !reduced && setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <Image src={image.url} alt={image.alt} fill sizes={sizes} priority={priority}
        className={`object-cover transition-[transform,opacity] duration-[1400ms] ease-out-expo ${active ? "scale-105 opacity-0" : "opacity-100"}`} />
      {active && (
        <iframe
          title={label}
          src={src}
          allow="autoplay; encrypted-media; picture-in-picture"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 border-0"
          loading="lazy"
        />
      )}
      <button
        type="button"
        onClick={() => setActive((v) => !v)}
        onFocus={() => !reduced && setActive(true)}
        onBlur={() => setActive(false)}
        className="absolute bottom-0 left-0 z-10 flex items-center gap-3 bg-ink/85 px-5 py-4 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur transition-colors hover:bg-blue hover:text-blue-ink"
        aria-pressed={active}
        aria-label={active ? `Stop clip: ${label}` : `Play clip: ${label}`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/40">
          <Play className="h-3 w-3 fill-current" aria-hidden />
        </span>
        {active ? "Playing" : "Hover to play"}
      </button>
    </div>
  );
}
