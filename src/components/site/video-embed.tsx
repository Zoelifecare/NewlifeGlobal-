"use client";
import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

/** Click-to-load YouTube player (privacy-enhanced domain; no third-party request until the visitor presses play). */
export function VideoEmbed({ videoId, title, thumbnail }: { videoId: string; title: string; thumbnail?: string | null }) {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <div className="relative aspect-video bg-black">
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" onClick={() => setOn(true)} className="group relative block aspect-video w-full overflow-hidden bg-ink text-left" aria-label={`Play video: ${title}`}>
      <Image src={thumbnail ?? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt="" fill sizes="(min-width:1024px) 66vw, 100vw" className="object-cover opacity-85 transition-transform duration-[1400ms] ease-out-expo group-hover:scale-105" priority />
      <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,27,61,.7),transparent_60%)]" />
      <span className="absolute bottom-6 left-6 flex items-center gap-4 text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-deep transition-transform duration-500 ease-out-expo group-hover:scale-110">
          <Play className="ml-1 h-6 w-6 fill-current" aria-hidden />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.16em]">Watch message</span>
      </span>
    </button>
  );
}
