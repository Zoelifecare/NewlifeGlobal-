import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 1. Domain routing
 *    - The admin domain (ADMIN_URL / NEXT_PUBLIC_SITE_URL, e.g. app.newlifeglobalaz.org) serves ONLY /admin
 *      (plus the APIs and files it needs). Any other page there is sent to the public website.
 *    - The public website (PUBLIC_WEBSITE_URL, e.g. newlifeglobalaz.org, and newlifeglobal.vercel.app)
 *      sends /admin to the admin domain, so staff always sign in in one place.
 * 2. Refreshes the Supabase session cookie and gates /admin.
 *    This is the first of three authorization layers (proxy → server checks → Postgres RLS).
 */
const hostOf = (u?: string) => {
  try { return u ? new URL(u).host : null; } catch { return null; }
};
const ADMIN_ORIGIN = (process.env.ADMIN_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const PUBLIC_ORIGIN = (process.env.PUBLIC_WEBSITE_URL || "").replace(/\/+$/, "");
const ADMIN_HOST = hostOf(ADMIN_ORIGIN);
const PUBLIC_HOST = hostOf(PUBLIC_ORIGIN);
// paths the admin domain must keep serving itself
const ADMIN_DOMAIN_KEEPS = /^\/(admin|api|_next|media|embed\.js|icon|favicon|robots\.txt)(\/|$|\?)/;

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host");

  // ---- domain routing (only when both domains are configured and differ)
  if (ADMIN_HOST && PUBLIC_HOST && ADMIN_HOST !== PUBLIC_HOST && host) {
    if (host === ADMIN_HOST && !ADMIN_DOMAIN_KEEPS.test(pathname)) {
      return NextResponse.redirect(`${PUBLIC_ORIGIN}${pathname}${search}`, 308);
    }
    if (host !== ADMIN_HOST && !host.startsWith("localhost") && pathname.startsWith("/admin")) {
      return NextResponse.redirect(`${ADMIN_ORIGIN}${pathname}${search}`, 308);
    }
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  // ---- admin gate
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPublicAdmin = pathname === "/admin/login" || pathname.startsWith("/admin/auth") || pathname === "/admin/setup";

  if (!url || !key) {
    // Database not configured: admin explains how to connect it.
    if (!isPublicAdmin) return NextResponse.redirect(new URL("/admin/setup", request.url));
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublicAdmin) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  // every page, but not static build files or images
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|map|txt|xml|woff2?)$).*)"],
};
