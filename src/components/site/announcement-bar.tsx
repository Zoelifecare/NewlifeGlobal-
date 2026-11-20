import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Announcement } from "@/lib/content/types";
import { LongArrow } from "./icons";

/** Pinned announcements (managed in Admin › Announcements), shown under the hero. */
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  return (
    <section aria-label="Announcements" className="border-b border-line bg-blue-mist">
      <ul className="nl-container grid divide-y divide-line">
        {items.slice(0, 3).map((a) => {
          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-deep text-white"><Megaphone className="h-4 w-4" aria-hidden /></span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="nl-hb-lift font-semibold text-ink">{a.title}</span>
                {a.body && <span className="text-sm text-body">{a.body}</span>}
              </span>
              {a.linkUrl && <span className="hidden items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-blue-deep sm:flex">{a.linkLabel || "Learn more"}<LongArrow className="h-3 w-8" /></span>}
            </>
          );
          return (
            <li key={a.id}>
              {a.linkUrl ? (
                <Link href={a.linkUrl} className="nl-hoverbox flex items-center gap-4 px-2 py-4">{inner}</Link>
              ) : <div className="nl-hoverbox flex items-center gap-4 px-2 py-4">{inner}</div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
