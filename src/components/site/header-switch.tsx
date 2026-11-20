"use client";
import { usePathname } from "next/navigation";
import { SiteHeader, type HeaderProps } from "./site-header";

/** The header sits over a dark hero only on the homepage; elsewhere it starts solid. */
export function HeaderSwitch(props: Omit<HeaderProps, "overHero">) {
  const pathname = usePathname();
  return <SiteHeader key={pathname === "/" ? "hero" : "page"} overHero={pathname === "/"} {...props} />;
}
