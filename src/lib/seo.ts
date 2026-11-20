import type { SiteSettings } from "./content/types";
import { siteUrl } from "./site-url";

/** schema.org Church markup (address + Sunday service). */
export function churchJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: s.name,
    url: siteUrl(),
    logo: `${siteUrl()}${s.logo.color}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.line1,
      addressLocality: s.address.city,
      addressRegion: s.address.region,
      postalCode: s.address.postal,
      addressCountry: "US",
    },
    sameAs: s.social.map((x) => x.url),
    ...(s.contact.email ? { email: s.contact.email } : {}),
    ...(s.contact.phone ? { telephone: s.contact.phone } : {}),
    event: undefined,
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "15:00", closes: "17:00" }],
  };
}
