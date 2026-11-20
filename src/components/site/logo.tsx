import Image from "next/image";
import Link from "next/link";

/**
 * Church logo (editable in Church Identity & Settings › Brand) with the "GLOBAL" lockup used on the
 * church's own flyers. `tone="light"` renders the mark in white for dark backgrounds.
 */
export function Logo({ tone = "dark", src = "/media/brand/nlc-logo-color.png", alt = "New Life Global", className = "" }: { tone?: "dark" | "light"; src?: string; alt?: string; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label={`${alt} home`}>
      <Image
        src={src}
        alt=""
        width={300}
        height={101}
        priority
        className="h-9 w-auto transition-[filter] duration-500 md:h-10"
        style={tone === "light" ? { filter: "brightness(0) invert(1)" } : undefined}
      />
      <span
        className={`border-l pl-3 text-[0.65rem] font-bold uppercase leading-none tracking-[0.32em] transition-colors duration-500 ${
          tone === "light" ? "border-white/35 text-white" : "border-ink/20 text-green"
        }`}
      >
        Global
      </span>
    </Link>
  );
}
