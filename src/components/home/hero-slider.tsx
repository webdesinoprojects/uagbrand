"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(false);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const updateMobileState = () => setIsMobile(query.matches);

    updateMobileState();
    query.addEventListener("change", updateMobileState);

    return () => query.removeEventListener("change", updateMobileState);
  }, []);

  useEffect(() => {
    if (!isMobile || slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isMobile, slides.length]);

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
      <article className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-surface md:h-[78svh] md:min-h-[520px] md:max-h-[820px] lg:h-[82svh]">
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.76)_0%,rgba(0,0,0,0.52)_36%,rgba(0,0,0,0.1)_62%,rgba(0,0,0,0.3)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.54)_34%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.05)_100%)]" />
          <div className="absolute inset-y-0 left-0 flex w-full max-w-xl flex-col justify-center px-5 pt-16 text-white sm:px-8 md:max-w-3xl md:px-12 md:py-24 lg:px-20">
            <p className="text-xs font-extrabold uppercase text-accent sm:text-sm">
              {activeSlide.eyebrow}
            </p>
            <h1 className="mt-5 max-w-[360px] text-[34px] font-black leading-[1.04] sm:max-w-xl sm:text-5xl md:mt-4 lg:text-6xl">
              {activeSlide.title}
            </h1>
            <p className="mt-5 max-w-[350px] text-sm font-semibold leading-5 text-white/88 sm:max-w-xl sm:text-base sm:leading-7 md:text-lg">
              {activeSlide.description}
            </p>
            <div className="mt-16 flex flex-wrap items-center gap-3 sm:mt-20 md:mt-7">
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-xs font-black text-slate-950 transition group-hover:bg-accent sm:h-12 sm:px-5 sm:text-sm">
                {activeSlide.ctaLabel}
                <ArrowRight size={17} />
              </span>
              <span className="rounded-md border border-white/20 bg-white/12 px-3 py-2 text-xs font-extrabold text-white backdrop-blur sm:text-sm">
                {activeSlide.offer}
              </span>
            </div>
          </div>
        </Link>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous hero slide"
              onClick={previousSlide}
              className="absolute left-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white md:left-3 lg:left-5 lg:h-12 lg:w-12"
            >
              <ArrowLeft size={21} />
            </button>
            <button
              type="button"
              aria-label="Next hero slide"
              onClick={nextSlide}
              className="absolute right-5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-md bg-white/78 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white md:right-3 lg:right-5 lg:h-12 lg:w-12"
            >
              <ArrowRight size={21} />
            </button>

            <div className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-3 px-5">
              <span className="rounded-md bg-black/38 px-2 py-1 font-mono text-xs font-bold text-white backdrop-blur">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </span>
              <div className="flex max-w-[56vw] items-center gap-1.5 overflow-x-auto no-scrollbar sm:max-w-none sm:gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    aria-label={`Show ${slide.title}`}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "h-1.5 shrink-0 rounded-full transition-all",
                      index === activeIndex
                        ? "w-10 bg-brand sm:w-16"
                        : "w-5 bg-white/55 hover:bg-white sm:w-9",
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </article>
    </section>
  );
}
