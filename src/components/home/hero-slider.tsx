"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types";

type HeroSliderProps = {
  slides: HeroSlide[];
};

export function HeroSlider({ slides }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (!isPlaying || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [isPlaying, slides.length]);

  if (!activeSlide) {
    return null;
  }

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const previousSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1600px] px-0 py-0 sm:px-4 sm:py-4">
        <article className="relative h-[460px] overflow-hidden border-y border-border bg-surface shadow-[var(--shadow-soft)] sm:h-[560px] sm:rounded-xl sm:border">
          <Link href={activeSlide.href} className="group block h-full">
            <OptimizedImage
              key={activeSlide.id}
              src={activeSlide.image.src}
              alt={activeSlide.image.alt}
              width={activeSlide.image.width}
              height={activeSlide.image.height}
              preload
              sizes="100vw"
              wrapperClassName="h-full w-full bg-surface"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.015]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.54)_34%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.05)_100%)]" />
            <div className="absolute inset-y-0 left-0 flex w-full max-w-3xl flex-col justify-center px-6 py-12 text-white sm:px-12 lg:px-20">
              <p className="text-sm font-extrabold uppercase text-accent">
                {activeSlide.eyebrow}
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.04] sm:text-5xl lg:text-6xl">
                {activeSlide.title}
              </h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/82 sm:text-lg">
                {activeSlide.description}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-black text-slate-950 transition group-hover:bg-accent">
                  {activeSlide.ctaLabel}
                  <ArrowRight size={17} />
                </span>
                <span className="rounded-md border border-white/20 bg-white/12 px-3 py-2 text-sm font-extrabold text-white backdrop-blur">
                  {activeSlide.offer}
                </span>
              </div>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Previous hero slide"
            onClick={previousSlide}
            className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-md bg-white/74 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white sm:grid"
          >
            <ArrowLeft size={21} />
          </button>
          <button
            type="button"
            aria-label="Next hero slide"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-md bg-white/74 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white sm:grid"
          >
            <ArrowRight size={21} />
          </button>

          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 px-5">
            <span className="rounded-md bg-black/38 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </span>
            <div className="flex max-w-[52vw] items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show ${slide.title}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === activeIndex
                      ? "w-16 bg-brand"
                      : "w-9 bg-white/55 hover:bg-white",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label={isPlaying ? "Pause hero carousel" : "Play hero carousel"}
              onClick={() => setIsPlaying((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-md bg-black/38 text-white backdrop-blur transition hover:bg-black/58"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
