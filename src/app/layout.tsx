import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope, Newsreader } from "next/font/google";
import { getSettings } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["500", "600", "700", "800"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["italic", "normal"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = `${s.name}, ${s.address.city}, Arizona. ${s.statement}. Join us Sundays at 3:00 PM.`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${s.name} | ${s.address.city}, AZ`, template: `%s · ${s.name}` },
    description,
    applicationName: s.name,
    openGraph: { type: "website", siteName: s.name, locale: "en_US", description, images: [{ url: "/media/instagram/refresh-women-2026-04.jpg", width: 1200, height: 960, alt: "Worship at New Life Global" }] },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = { themeColor: "#0b2624", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        {/* marks JS-enabled browsers so reveal animations never hide content without JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}<AuthHashHandler /></body>
    </html>
  );
}
