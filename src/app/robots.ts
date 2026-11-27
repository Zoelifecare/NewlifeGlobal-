import type { MetadataRoute } from "next";

/**
 * This app is the church admin (app.newlifeglobalaz.org; also newlifeglobal.vercel.app).
 * The public website is a separate repository on newlifeglobalaz.org, so search engines
 * must not index anything here (it would compete with the real website).
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
