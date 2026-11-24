const clean = (u: string) => u.replace(/\/+$/, "");

/**
 * The PUBLIC website address (canonical links, sitemap, SEO): the church's main domain.
 * PUBLIC_WEBSITE_URL (e.g. https://newlifeglobalaz.org) wins; then NEXT_PUBLIC_SITE_URL; then Vercel's own address.
 */
export function siteUrl() {
  const raw = process.env.PUBLIC_WEBSITE_URL || process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return clean(raw);
}

/**
 * The ADMIN address (links in staff emails, sign-in links): e.g. https://app.newlifeglobalaz.org.
 * ADMIN_URL wins; then NEXT_PUBLIC_SITE_URL; then the public address.
 */
export function adminUrl() {
  return clean(process.env.ADMIN_URL || process.env.NEXT_PUBLIC_SITE_URL || siteUrl());
}
