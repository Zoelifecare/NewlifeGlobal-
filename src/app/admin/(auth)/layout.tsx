import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = { title: "Staff sign in · New Life Global", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <Image src="/media/instagram/refresh-women-2026-05.jpg" alt="" fill sizes="50vw" className="object-cover opacity-50" priority />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,38,36,.95),rgba(11,38,36,.3))]" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="nl-label nl-label--light mb-4">Staff area</p>
          <p className="max-w-md text-4xl font-medium leading-tight tracking-tight">Worship. Grow. Serve.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2" aria-label="New Life Global website">
            <Image src="/media/brand/nlc-logo-color.png" alt="New Life" width={300} height={101} className="h-10 w-auto" />
            <span className="border-l border-line pl-2 text-[0.6rem] font-bold tracking-[0.3em] text-blue-deep">GLOBAL</span>
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
