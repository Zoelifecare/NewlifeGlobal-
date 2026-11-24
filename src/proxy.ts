import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 1. The admin domain (ADMIN_URL / NEXT_PUBLIC_SITE_URL, e.g. app.newlifeglobalaz.org) shows only the admin:
 *    any other page there displays the admin in place (a rewrite: the address does not change; nobody is
 *    sent to another website). The public website is a separate repository hosted on newlifeglobalaz.org.
 * 2. Refreshes the Supabase session cookie and gates /admin.
 *    This is the first of three authorization layers (proxy → server checks → Postgres RLS).
 */
const hostOf = (u?: string) => {
  try { return u ? new URL(u).host : null; } catch { return null; }
};
const ADMIN_HOST = hostOf(process.env.ADMIN_URL || process.env.NEXT_PUBLIC_SITE_URL);
// paths the admin domain serves as they are
const ADMIN_DOMAIN_KEEPS = /^\/(admin|api|_next|media|embed\.js|icon|favicon|robots\.txt)(\/|$|\?)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  // admin domain: public pages are not served here; show the admin instead (no redirect)
  if (ADMIN_HOST && host === ADMIN_HOST && !ADMIN_DOMAIN_KEEPS.test(pathname)) {
    return NextResponse.rewrite(new URL("/admin", request.url));
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
