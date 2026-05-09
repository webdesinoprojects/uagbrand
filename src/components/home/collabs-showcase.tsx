"use client";

import { useEffect, useMemo, useRef } from "react";

import { SectionHeader } from "@/components/ui/section-header";
import type { Brand, CollabSlide } from "@/types";

type CollabsShowcaseProps = {
  slides: CollabSlide[];
  brands: Brand[];
};

const collabVideoSrc = "/assets/content/our-product-video.mp4";
const AUTO_SCROLL_SPEED = 18;
const INTERACTION_PAUSE_MS = 1800;

export function CollabsShowcase({ brands }: CollabsShowcaseProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const directionRef = useRef(1);
  const collabCards = useMemo(() => brands.slice(0, 12), [brands]);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail || collabCards.length < 2) {
      return;
    }

    let frameId = 0;
    let previousTime = performance.now();

    const tick = (time: number) => {
      const deltaSeconds = (time - previousTime) / 1000;
      previousTime = time;

      if (time > pauseUntilRef.current && rail.scrollWidth > rail.clientWidth) {
        const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
        const nextScrollLeft =
          rail.scrollLeft + AUTO_SCROLL_SPEED * deltaSeconds * directionRef.current;

        if (nextScrollLeft >= maxScrollLeft) {
          rail.scrollLeft = maxScrollLeft;
          directionRef.current = -1;
        } else if (nextScrollLeft <= 0) {
          rail.scrollLeft = 0;
          directionRef.current = 1;
        } else {
          rail.scrollLeft = nextScrollLeft;
        }
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [collabCards.length]);

  const pauseAutoScroll = () => {
    pauseUntilRef.current = performance.now() + INTERACTION_PAUSE_MS;
  };

  if (collabCards.length === 0) {
    return null;
  }

  return (
    <section className="soft-enter bg-background py-9 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Our collabs with brands"
          title="Brand Product Banners"
          description="Auto-moving brand video cards for product launches, collabs and campaign visuals."
        />
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex touch-pan-x select-none gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6 lg:px-8"
        onPointerDown={pauseAutoScroll}
        onPointerMove={pauseAutoScroll}
        onWheel={pauseAutoScroll}
      >
        {collabCards.map((brand) => (
          <article
            key={brand.slug}
            className="group w-[172px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-md sm:w-[218px] lg:w-[250px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-soft">
              <video
                aria-hidden="true"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              >
                <source src={collabVideoSrc} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
            </div>

            <div className="min-h-24 px-3 py-4 text-center sm:px-4">
              <h3 className="line-clamp-2 font-display text-sm font-black leading-5 text-foreground sm:text-base">
                {brand.name}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs font-bold text-muted">
                {brand.deal}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
