import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { Sermon } from "@/lib/content/types";
import { formatSermonDate } from "@/lib/format";

export function SermonCard({ s, priority = false }: { s: Sermon; priority?: boolean }) {
  return (
    <Link href={`/messages/${s.slug}`} className="nl-hoverbox group -m-3 grid gap-4 p-3">
      <div className="nl-zoom relative aspect-video bg-ink">
        {s.thumbnail && <Image src={s.thumbnail} alt="" fill priority={priority} sizes="(min-width:1280px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover" />}
        <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-blue-deep transition-transform duration-500 ease-out-expo group-hover:scale-110">
          <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
        </span>
        {s.category && <span className="absolute right-3 top-3 bg-ink/80 px-2.5 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">{s.category.name}</span>}
      </div>
      <div className="grid gap-1.5">
        <p className="text-xs text-muted">{formatSermonDate(s.preachedOn)}{s.series ? ` · ${s.series}` : ""}</p>
        <h3 className="nl-hb-lift text-lg font-medium leading-snug tracking-tight text-ink">{s.title}</h3>
        <p className="text-sm text-body">{s.speakerName}</p>
      </div>
    </Link>
  );
}
