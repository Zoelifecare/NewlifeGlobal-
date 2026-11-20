import { getChurchContent, getMinistries, getSettings } from "@/lib/content";
import { SiteFooter } from "@/components/site/site-footer";
import { HeaderSwitch } from "@/components/site/header-switch";
import { RevealObserver } from "@/components/site/reveal-observer";
import { churchJsonLd } from "@/lib/seo";
import type { ChurchContent, NavItem } from "@/lib/content/types";

/** About-page anchors and the identity sections that must be published for them to exist. */
const ABOUT_ANCHORS: Record<string, string[]> = {
  story: ["our_story"], mission: ["mission", "vision"], vision: ["vision"], values: ["core_values"], beliefs: ["beliefs"],
};

/**
 * Drop menu entries that point at pages switched off in Church Identity & Settings, and at
 * About sections that are not published yet (so the menu never links to something missing).
 */
function filterNav(nav: NavItem[], pages: Record<string, boolean>, content: ChurchContent): NavItem[] {
  const pageOf = (href: string) => href.split(/[?#]/)[0].replace(/^\//, "").split("/")[0];
  const published = (key: string) => Boolean(content[key]?.body?.trim() || content[key]?.items?.length);
  const on = (href: string) => {
    if (pages[pageOf(href)] === false) return false;
    const [path, anchor] = href.split("#");
    if (path === "/about" && anchor && ABOUT_ANCHORS[anchor]) return ABOUT_ANCHORS[anchor].some(published);
    return true;
  };
  return nav
    .filter((n) => n.visible && on(n.href))
    .map((n) => ({ ...n, children: n.children?.filter((c) => c.visible && on(c.href)) }));
}

export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, ministries, content] = await Promise.all([getSettings(), getMinistries(), getChurchContent()]);
  return (
    <>
      <a href="#main" className="nl-skip">Skip to content</a>
      <HeaderSwitch
        nav={filterNav(settings.navigation, settings.pages, content)}
        showGive={settings.giving.enabled && settings.pages.give !== false}
        logoSrc={settings.logo.color}
        logoAlt={settings.name}
      />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} ministries={ministries} />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd(settings)) }} />
    </>
  );
}
