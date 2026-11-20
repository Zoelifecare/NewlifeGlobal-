"use client";
import { usePathname } from "next/navigation";
import { SiteHeader } from "./site-header";

/** The header sits over a dark hero only on the homepage; elsewhere it starts solid. */
export function HeaderSwitch() {
  const pathname = usePathname();
  return <SiteHeader key={pathname === "/" ? "hero" : "page"} overHero={pathname === "/"} />;
}
