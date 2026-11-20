import Image from "next/image";
import type { Leader } from "@/lib/content/types";

/** Leader profile. `featured` = wide layout for the lead pastor (photo beside bio). */
export function LeaderCard({ leader, featured = false }: { leader: Leader; featured?: boolean }) {
  const initials = leader.name.replace(/^(Rev\.|Dr\.|Pastor)\s*/g, "").replace(/^(Rev\.|Dr\.|Pastor)\s*/g, "")
    .split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("");
  return (
    <article className={`nl-hoverbox group grid h-full gap-5 bg-white p-6 ${featured ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center sm:gap-10" : ""}`}>
      <div className={`nl-zoom relative overflow-hidden bg-paper ${featured ? "aspect-[4/4.2]" : "aspect-[4/4.4]"}`}>
        {leader.photo ? (
          <Image src={leader.photo.url} alt={leader.photo.alt || leader.name} fill sizes={featured ? "(min-width:640px) 22rem, 100vw" : "(min-width:640px) 26rem, 100vw"} className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,var(--nl-paper),var(--nl-mist))]" role="img" aria-label={`Portrait of ${leader.name} coming soon`}>
            <span className="text-6xl font-medium tracking-tight text-blue-deep/30">{initials}</span>
          </div>
        )}
      </div>
      <div className="grid content-center gap-3">
        <div className="grid gap-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-deep">{leader.title}</p>
          <h3 className={`nl-hb-lift nl-h4 ${featured ? "!text-[clamp(1.6rem,2.6vw,2.2rem)]" : "!text-xl"}`}>{leader.name}</h3>
        </div>
        {leader.bio && <p className="text-[0.95rem] leading-relaxed text-body">{leader.bio}</p>}
      </div>
    </article>
  );
}
