import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : undefined;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * When PUBLIC_WEBSITE_URL is set (e.g. https://newlifeglobalaz.org), the public website lives on WordPress
 * and this app only serves /admin and the form APIs. Visitors to the app's old public pages are sent there.
 */
const publicWebsite = process.env.PUBLIC_WEBSITE_URL?.replace(/\/+$/, "");
const PUBLIC_PAGES: [string, string][] = [
  ["/", "/"], ["/about", "/about/"], ["/visit", "/im-new/"], ["/ministries/:path*", "/ministries/"],
  ["/messages/:path*", "/messages/"], ["/events/:path*", "/events/"], ["/gallery", "/gallery/"],
  ["/prayer", "/prayer/"], ["/contact", "/contact/"], ["/give", "/give/"], ["/privacy", "/privacy-policy/"],
];

const nextConfig: NextConfig = {
  // Classic ISR (`export const revalidate`) is used instead of Cache Components; see docs/architecture.md.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  async redirects() {
    if (!publicWebsite) return [];
    return PUBLIC_PAGES.map(([source, to]) => ({ source, destination: `${publicWebsite}${to}`, permanent: false }));
  },
  async headers() {
    return [
      // church photos may be loaded by the public WordPress website
      { source: "/media/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "https://newlifeglobalaz.org" }] },
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
