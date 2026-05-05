"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

export type BrandProductCarouselSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  image: ImageAsset;
};

type BrandProductCarouselProps = {
  slides: BrandProductCarouselSlide[];
};

export function BrandProductCarousel({ slides }: BrandProductCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [slides.length]);

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
    <section className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <Link href={activeSlide.href} className="group block">
        <div className="relative h-[230px] overflow-hidden bg-slate-950 sm:h-[300px]">
          <div className="absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_70%_35%,rgba(245,196,0,0.28),transparent_34%),linear-gradient(135deg,rgba(0,120,212,0.16),rgba(15,17,21,0.2))]" />
          <OptimizedImage
            key={activeSlide.id}
            src={activeSlide.image.src}
            alt={activeSlide.image.alt}
            width={activeSlide.image.width}
            height={activeSlide.image.height}
            sizes="(max-width: 640px) 60vw, 420px"
            wrapperClassName="absolute bottom-0 right-0 h-[72%] w-[58%]"
            className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.62)_48%,rgba(0,0,0,0.16)_100%)]" />
          <div className="absolute inset-y-0 left-0 flex max-w-[68%] flex-col justify-center px-5 py-6 text-white sm:px-7">
            <p className="text-xs font-black uppercase text-accent">
              {activeSlide.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">
              {activeSlide.title}
            </h2>
            <p className="mt-3 line-clamp-2 text-xs font-semibold leading-5 text-white/78 sm:text-sm">
              {activeSlide.description}
            </p>
            <span className="mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-md bg-white px-4 text-xs font-black text-slate-950 transition group-hover:bg-accent sm:text-sm">
              View range
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous carousel item"
            onClick={previousSlide}
            className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md bg-white/82 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next carousel item"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md bg-white/82 text-slate-950 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <ArrowRight size={18} />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show ${slide.title}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex
                    ? "w-8 bg-brand"
                    : "w-4 bg-white/55 hover:bg-white",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
