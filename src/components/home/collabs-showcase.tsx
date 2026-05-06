"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { SectionHeader } from "@/components/ui/section-header";
import { useSwipeCarousel } from "@/hooks/use-swipe-carousel";
import { cn } from "@/lib/utils";
import type { Brand, CollabSlide } from "@/types";

type CollabsShowcaseProps = {
  slides: CollabSlide[];
  brands: Brand[];
};

export function CollabsShowcase({ slides, brands }: CollabsShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (!isPlaying || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4400);

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
      <div className="mx-auto max-w-[1600px] px-0 sm:px-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-2">
          <SectionHeader
            eyebrow="Our collabs with brands"
            title="Brand Product Banners"
            description="Clickable full-width carousel for branded product banners and launch visuals."
          />
        </div>

        <article
          {...swipeHandlers}
          className="relative h-[430px] touch-pan-y select-none overflow-hidden border-y border-border bg-surface shadow-[var(--shadow-soft)] sm:h-[560px] sm:rounded-lg sm:border"
        >
          <Link href={activeSlide.href} className="group block h-full">
            <OptimizedImage
              key={activeSlide.id}
              src={activeSlide.image.src}
              alt={activeSlide.image.alt}
              width={activeSlide.image.width}
              height={activeSlide.image.height}
              sizes="100vw"
              wrapperClassName="h-full w-full bg-surface"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.012]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.44)_42%,rgba(0,0,0,0.06)_100%)]" />
            <div className="absolute inset-y-0 left-0 flex max-w-3xl flex-col justify-center px-6 py-10 text-white sm:px-12 lg:px-20">
              <p className="text-sm font-extrabold uppercase text-accent">
                {activeSlide.subtitle}
              </p>
              <h3 className="mt-3 text-4xl font-black leading-[1.03] sm:text-6xl">
                {activeSlide.title}
              </h3>
              <span className="mt-7 inline-flex h-12 w-fit items-center gap-2 rounded-md bg-white px-5 text-sm font-black text-slate-950 transition group-hover:bg-accent">
                View collection
                <ArrowRight size={17} />
              </span>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Previous collaboration slide"
            onClick={previousSlide}
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next collaboration slide"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowRight size={20} />
          </button>

          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3 px-5">
            <span className="rounded-md bg-black/38 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(slides.length).padStart(2, "0")}
            </span>
            <div className="flex max-w-[56vw] items-center gap-2">
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
                isPlaying ? "Pause collaboration carousel" : "Play collaboration carousel"
              }
              onClick={() => setIsPlaying((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-md bg-black/38 text-white backdrop-blur transition hover:bg-black/58"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </article>

        <div className="mx-auto mt-4 flex max-w-7xl gap-2 overflow-x-auto px-4 pb-1 sm:px-0 no-scrollbar">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={brand.href}
              className="shrink-0 rounded-md border border-border bg-surface px-4 py-2 text-sm font-extrabold text-foreground transition hover:border-brand hover:text-brand hover:shadow-md"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
