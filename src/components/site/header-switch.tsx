"use client";
import { usePathname } from "next/navigation";
import { SiteHeader, type HeaderProps } from "./site-header";

/** The header sits over a dark hero on the homepage and the Give page; elsewhere it starts solid. */
const OVER_HERO = ["/", "/give"];
export function HeaderSwitch(props: Omit<HeaderProps, "overHero">) {
  const pathname = usePathname();
  const over = OVER_HERO.includes(pathname);
  return <SiteHeader key={over ? `hero-${pathname}` : "page"} overHero={over} {...props} />;
}
