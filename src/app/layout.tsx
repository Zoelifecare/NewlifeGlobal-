import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { getSettings } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
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

export const viewport: Viewport = { themeColor: "#001b3d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        {/* marks JS-enabled browsers so reveal animations never hide content without JS */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}<AuthHashHandler /></body>
    </html>
  );
}
