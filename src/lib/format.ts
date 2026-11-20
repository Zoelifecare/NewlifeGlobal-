const TZ = "America/Phoenix";

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
}

export function formatEventDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: TZ });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

export function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit", timeZone: TZ }),
    month: d.toLocaleDateString("en-US", { month: "short", timeZone: TZ }).toUpperCase(),
    year: d.toLocaleDateString("en-US", { year: "numeric", timeZone: TZ }),
  };
}

export function formatSermonDate(date: string | null) {
  if (!date) return "";
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Google Calendar "add event" link. */
export function googleCalendarUrl(e: { title: string; startsAt: string; endsAt: string | null; address: string | null; summary: string | null }) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 2 * 3600_000).toISOString();
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${fmt(e.startsAt)}/${fmt(end)}`, details: e.summary ?? "", location: e.address ?? "" });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function isEventPast(e: { startsAt: string; endsAt: string | null }) {
  return new Date(e.endsAt ?? e.startsAt).getTime() < Date.now();
}

export function isFuture(iso: string | null | undefined) {
  return Boolean(iso) && new Date(iso as string).getTime() > Date.now();
}
