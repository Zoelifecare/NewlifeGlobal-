import { getMinistries, getSettings } from "@/lib/content";
import { SiteFooter } from "@/components/site/site-footer";
import { HeaderSwitch } from "@/components/site/header-switch";
import { RevealObserver } from "@/components/site/reveal-observer";
import { churchJsonLd } from "@/lib/seo";

export const revalidate = 300;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, ministries] = await Promise.all([getSettings(), getMinistries()]);
  return (
    <>
      <a href="#main" className="nl-skip">Skip to content</a>
      <HeaderSwitch />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} ministries={ministries} />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd(settings)) }} />
    </>
  );
}
