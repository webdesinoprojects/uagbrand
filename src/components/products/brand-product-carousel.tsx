"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { useSwipeCarousel } from "@/hooks/use-swipe-carousel";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types";

export type BrandProductCarouselSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  image: ImageAsset;
  videoSrc?: string;
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
    threshold: 34,
  });

  if (!activeSlide) {
    return null;
  }

  return (
    <section
      {...swipeHandlers}
      className="relative touch-pan-y select-none overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
    >
      <Link href={activeSlide.href} className="group block">
        <div className="relative h-[230px] overflow-hidden bg-slate-950 sm:h-[300px]">
          {activeSlide.videoSrc ? (
            <video
              key={activeSlide.id}
              autoPlay
              loop
              muted
              playsInline
              poster={activeSlide.image.src}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            >
              <source src={activeSlide.videoSrc} type="video/mp4" />
            </video>
          ) : (
            <OptimizedImage
              key={activeSlide.id}
              src={activeSlide.image.src}
              alt={activeSlide.image.alt}
              width={activeSlide.image.width}
              height={activeSlide.image.height}
              sizes="(max-width: 1280px) 100vw, 1280px"
              wrapperClassName="absolute inset-0 h-full w-full"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.62)_48%,rgba(0,0,0,0.18)_100%)]" />
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
        <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Show ${slide.title}`}
              onClick={() => setActiveIndex(index)}
              onPointerDown={(event) => event.stopPropagation()}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex
                  ? "w-8 bg-brand"
                  : "w-4 bg-white/55 hover:bg-white",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
