"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, PlayCircle } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { LongArrow } from "./icons";

export interface HeroSlideView {
  index: string;
  label: string;
  caption: string;
  headline: string;
  body: string;
  image: { url: string; alt: string } | null;
  /** A message to feature (e.g. Pastor Charles preaching): shown as a framed video card. */
  video?: { id: string; title: string; href: string } | null;
}

const DURATION = 7000;

/**
 * ai.gov.rw P2 — full-bleed slider of three numbered chapters with
 * caption tabs, segmented progress, 01 / 03 counter, prev/next, swipe and keyboard support.
 */
export function HeroSlider({
  slides, primary, secondary,
}: { slides: HeroSlideView[]; primary: { label: string; href: string }; secondary: { label: string; href: string } }) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hoverPause, setHoverPause] = useState(false);
  const [videoOn, setVideoOn] = useState<string | null>(null);
  const start = useRef<number>(0);
  const elapsed = useRef(0);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((i: number) => {
    setActive(((i % n) + n) % n);
    elapsed.current = 0;
    setProgress(0);
    setVideoOn(null); // stop the message when changing slides
  }, [n]);

  const reduceMotion = useReducedMotion();
  const autoplay = playing && !reduceMotion; // reduced-motion users get manual navigation only

  useEffect(() => {
    if (!autoplay || hoverPause || n < 2) return;
    let raf = 0;
    start.current = performance.now() - elapsed.current;
    const tick = (t: number) => {
      elapsed.current = t - start.current;
      const p = Math.min(elapsed.current / DURATION, 1);
      setProgress(p);
      if (p >= 1) { go(active + 1); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoplay, hoverPause, active, go, n]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
  };

  const slide = slides[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="New Life Global: three chapters"
      className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-ink text-white h-[100svh] max-h-[880px] md:min-h-[720px]"
      onMouseEnter={() => setHoverPause(true)}
      onMouseLeave={() => setHoverPause(false)}
      onFocusCapture={() => setHoverPause(true)}
      onBlurCapture={() => setHoverPause(false)}
      onKeyDown={onKey}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* media layers */}
      {slides.map((s, i) => (
        <div
          key={s.index}
          aria-hidden={i !== active}
          className={`absolute inset-0 -z-10 transition-opacity duration-[1100ms] ease-out-expo ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          {!s.image && s.video && (
            <Image src={`https://i.ytimg.com/vi/${s.video.id}/maxresdefault.jpg`} alt="" fill sizes="100vw" priority={i === 0}
              className="scale-110 object-cover opacity-70 blur-[6px]" />
          )}
          {s.image && (
            <Image
              src={s.image.url}
              alt={i === active ? s.image.alt : ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-transform ease-linear ${i === active ? "scale-[1.08] duration-[7000ms]" : "scale-100 duration-0"} motion-reduce:!scale-100`}
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,27,61,.88)_0%,rgba(0,27,61,.55)_45%,rgba(0,27,61,.15)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(0,27,61,.9),transparent)]" />
        </div>
      ))}

      {/* content */}
      <div className="nl-container flex flex-1 flex-col justify-end pb-10 pt-[calc(var(--nl-header-h)+3rem)] md:justify-center md:pb-0">
        <div key={slide.index} className={`max-w-[58rem] ${slide.video ? "lg:max-w-[46%]" : ""}`} aria-live="polite">
          <p className="nl-label nl-label--light mb-6 animate-[fadeUp_.9s_var(--nl-ease)_both]">
            {slide.index} · {slide.label}
          </p>
          <h1 className="nl-display whitespace-pre-line animate-[fadeUp_1s_var(--nl-ease)_.05s_both]">{slide.headline}</h1>
          <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-white/85 md:text-[1.15rem] animate-[fadeUp_1s_var(--nl-ease)_.15s_both]">
            {slide.body}
          </p>
          {slide.video && (
            <Link href={slide.video.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-blue lg:hidden">
              <PlayCircle className="h-5 w-5" aria-hidden />Watch: {slide.video.title}
            </Link>
          )}
        </div>
        {slide.video && (
          <div key={`v-${slide.index}`} className="absolute right-[calc(var(--nl-pad)+3rem)] top-1/2 z-10 hidden w-[min(38vw,36rem)] -translate-y-1/2 animate-[fadeUp_1.1s_var(--nl-ease)_.2s_both] lg:block">
            {videoOn === slide.video.id ? (
              <span className="relative block aspect-video overflow-hidden border border-white/20 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)]">
                <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${slide.video.id}?autoplay=1&rel=0&modestbranding=1`}
                  title={slide.video.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              </span>
            ) : (
              <button type="button" onClick={() => { setVideoOn(slide.video!.id); setPlaying(false); }} aria-label={`Play ${slide.video.title}`}
                className="group relative block aspect-video w-full overflow-hidden border border-white/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)]">
                <Image src={`https://i.ytimg.com/vi/${slide.video.id}/maxresdefault.jpg`} alt={`Pastor Charles Mugisha preaching: ${slide.video.title}`} fill sizes="38vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/5">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue text-blue-ink transition-transform group-hover:scale-110"><Play className="ml-1 h-6 w-6" aria-hidden /></span>
                </span>
              </button>
            )}
            <Link href={slide.video.href} className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/75 hover:text-blue"><span className="h-px w-6 bg-blue" />Open the full message page</Link>
          </div>
        )}
        <div className="mt-9 grid max-w-[44rem] gap-3 sm:grid-cols-2 sm:gap-0">
          <Link href={primary.href} className="nl-btn nl-btn--lg !justify-between !bg-blue-deep sm:!py-7">
            <span>{primary.label}</span>
            <LongArrow />
          </Link>
          <Link href={secondary.href} className="nl-btn nl-btn--ghost nl-btn--lg !justify-between sm:!py-7">
            <span>{secondary.label}</span>
            <LongArrow />
          </Link>
        </div>
      </div>

      {/* scroll cue */}
      <div aria-hidden className="absolute bottom-36 right-[var(--nl-pad)] hidden flex-col items-center gap-3 md:flex">
        <span className="text-[0.6rem] font-bold tracking-[0.3em] text-white/60 [writing-mode:vertical-rl]">SCROLL</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/20">
          <span className="absolute inset-0 bg-white animate-[nl-cue_2.2s_var(--nl-ease)_infinite]" />
        </span>
      </div>

      {/* chapter bar */}
      <div className="relative border-t border-white/15 bg-ink/40 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 flex gap-px" aria-hidden>
          {slides.map((s, i) => (
            <span key={s.index} className="relative h-[3px] flex-1 overflow-hidden bg-white/15">
              <i
                className="absolute inset-0 origin-left bg-blue"
                style={{ transform: `scaleX(${i < active ? 1 : i === active ? progress : 0})` }}
              />
            </span>
          ))}
        </div>
        <div className="nl-container flex items-stretch">
          <div className="grid flex-1 md:grid-cols-3" role="tablist" aria-label="Chapters">
            {slides.map((s, i) => (
              <button
                key={s.index}
                role="tab"
                aria-selected={i === active}
                aria-controls="hero-panel"
                onClick={() => go(i)}
                className={`py-4 pr-6 text-left transition-opacity duration-500 md:py-5 ${i === active ? "opacity-100" : "hidden opacity-45 hover:opacity-80 md:block"}`}
              >
                <span className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white">
                  {s.index} · {s.label}
                </span>
                <span className="mt-1 block text-xs text-white/60">{s.caption}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pl-4">
            <span className="nl-num text-xs font-semibold tracking-[0.14em] text-white/60">
              <b className="text-white">{slides[active].index}</b> / {String(n).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => setPlaying((p) => !p)} className="hidden h-12 w-12 items-center justify-center border-l border-white/15 text-white/80 hover:text-white sm:flex" aria-label={autoplay ? "Pause slideshow" : "Play slideshow"}>
              {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => go(active - 1)} className="flex h-12 w-12 items-center justify-center border-l border-white/15 hover:bg-white/10" aria-label="Previous chapter">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => go(active + 1)} className="flex h-12 w-12 items-center justify-center border-l border-white/15 hover:bg-white/10" aria-label="Next chapter">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <span id="hero-panel" className="sr-only">Chapter {slides[active].index}: {slides[active].label}</span>
    </section>
  );
}
