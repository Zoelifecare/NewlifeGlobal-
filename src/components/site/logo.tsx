import Image from "next/image";
import Link from "next/link";

/**
 * Official New Life mark (newlifekigali.org, OD-2) + "GLOBAL" lockup as used on New Life Global flyers.
 * `tone="light"` renders the mark in white for dark backgrounds.
 */
export function Logo({ tone = "dark", src = "/media/brand/nlc-logo-color.png", className = "" }: { tone?: "dark" | "light"; src?: string; className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label="New Life Global home">
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
