import { NextResponse, type NextRequest } from "next/server";

/**
 * The public website (WordPress at newlifeglobalaz.org) posts its forms to this app's API.
 * Only these origins may do so; any other cross-site origin is refused.
 * Extra origins can be added with PUBLIC_FORM_ORIGINS (comma-separated).
 */
const ALLOWED = new Set(
  ["https://newlifeglobalaz.org", "https://www.newlifeglobalaz.org", ...(process.env.PUBLIC_FORM_ORIGINS ?? "").split(",")]
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean),
);

/** True when the request is same-origin, has no Origin header, or comes from an allowed website. */
export function originAllowed(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    if (new URL(origin).host === req.headers.get("host")) return true;
  } catch {
    return false;
  }
  return ALLOWED.has(origin);
}

/** CORS headers for an allowed cross-site origin (none otherwise). */
export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Preflight response for the public form endpoints. */
export function preflight(req: NextRequest) {
  if (!originAllowed(req)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
