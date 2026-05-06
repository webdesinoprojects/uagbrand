"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { SectionHeader } from "@/components/ui/section-header";
import { useSwipeCarousel } from "@/hooks/use-swipe-carousel";
import { cn } from "@/lib/utils";
import type { CollabSlide } from "@/types";

type WarehouseCarouselProps = {
  slides: CollabSlide[];
};

export function WarehouseCarousel({ slides }: WarehouseCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (!isPlaying || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isPlaying, slides.length]);

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const previousSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const swipeHandlers = useSwipeCarousel({
    itemCount: slides.length,
    onNext: nextSlide,
    onPrevious: previousSlide,
  });

  if (!activeSlide) {
    return null;
  }

  return (
    <section className="soft-enter bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our warehouse"
          title="Stock, Packing And Dispatch"
          description="A separate auto-swipe carousel for warehouse, packing and fast delivery proof images."
        />

        <article
          {...swipeHandlers}
          className="relative h-[360px] touch-pan-y select-none overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)] sm:h-[500px]"
        >
          <Link href={activeSlide.href} className="group block h-full">
            <OptimizedImage
              key={activeSlide.id}
              src={activeSlide.image.src}
              alt={activeSlide.image.alt}
              width={activeSlide.image.width}
              height={activeSlide.image.height}
              sizes="(max-width: 1280px) 100vw, 1280px"
              wrapperClassName="h-full w-full bg-surface"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.012]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.68)_0%,rgba(0,0,0,0.36)_44%,rgba(0,0,0,0.04)_100%)]" />
            <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-6 py-8 text-white sm:px-12">
              <p className="text-xs font-black uppercase text-accent sm:text-sm">
                {activeSlide.subtitle}
              </p>
              <h3 className="mt-3 font-display text-4xl font-black leading-[1.02] sm:text-6xl">
                {activeSlide.title}
              </h3>
              <span className="mt-7 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950 transition group-hover:bg-accent">
                View details
                <ArrowRight size={17} />
              </span>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Previous warehouse slide"
            onClick={previousSlide}
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <button
            type="button"
            aria-label="Next warehouse slide"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowRight aria-hidden="true" size={20} />
          </button>

          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 px-5">
            <span className="rounded-md bg-black/42 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur">
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
              aria-label={
                isPlaying
                  ? "Pause warehouse carousel"
                  : "Play warehouse carousel"
              }
              onClick={() => setIsPlaying((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-lg bg-black/42 text-white backdrop-blur transition hover:bg-black/62"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={16} />
              ) : (
                <Play aria-hidden="true" size={16} />
              )}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
