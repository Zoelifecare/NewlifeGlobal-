"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";

/** Click-to-load Google Map (no third-party request until the visitor asks for it). */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  const [on, setOn] = useState(false);
  if (on) {
    return (
      <iframe
        title={title}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
        className="aspect-[16/10] w-full border-0 bg-paper"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }
  return (
    <button type="button" onClick={() => setOn(true)} className="group flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 border border-line bg-[linear-gradient(135deg,var(--nl-paper),var(--nl-mist))] text-ink">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-deep text-white transition-transform duration-500 ease-out-expo group-hover:scale-110"><MapPin className="h-6 w-6" aria-hidden /></span>
      <span className="font-semibold">Show map</span>
      <span className="text-xs text-muted">Loads Google Maps</span>
    </button>
  );
}
