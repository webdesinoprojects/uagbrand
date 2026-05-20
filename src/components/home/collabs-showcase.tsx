"use client";

import { useEffect, useMemo, useRef } from "react";

import { SectionHeader } from "@/components/ui/section-header";
import type { Brand, CollabSlide } from "@/types";

type CollabsShowcaseProps = {
  slides: CollabSlide[];
  brands: Brand[];
};

const AUTO_SCROLL_SPEED = 18;
const INTERACTION_PAUSE_MS = 1800;
const CARD_COUNT = 12;
const FALLBACK_COLLAB_VIDEO_SRC = "/assets/content/our-product-video.mp4";

type CollabCard = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: CollabSlide["image"];
  videoSrc: string;
  posterSrc?: string;
};

export function CollabsShowcase({ slides, brands }: CollabsShowcaseProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const directionRef = useRef(1);
  const collabCards = useMemo<CollabCard[]>(() => {
    if (slides.length > 0) {
      return fillCollabCards(
        slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle,
          href: slide.href,
          image: slide.image,
          videoSrc:
            slide.image.resourceType === "video"
              ? slide.image.src
              : FALLBACK_COLLAB_VIDEO_SRC,
          posterSrc:
            slide.image.resourceType === "video" ? undefined : slide.image.src,
        })),
      );
    }

    return fillCollabCards(
      brands.map((brand) => ({
        id: brand.slug,
        title: brand.name,
        subtitle: brand.deal,
        href: brand.href,
        image: brand.logo,
        videoSrc: FALLBACK_COLLAB_VIDEO_SRC,
        posterSrc: brand.logo.src,
      })),
    );
  }, [brands, slides]);

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
        {collabCards.map((card) => (
          <article
            key={card.id}
            className="group w-[190px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:shadow-md sm:w-[236px] lg:w-[272px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-soft">
              <CollabMedia card={card} />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
            </div>

            <div className="min-h-24 px-3 py-4 text-center sm:px-4">
              <h3 className="line-clamp-2 font-display text-sm font-black leading-5 text-foreground sm:text-base">
                {card.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs font-bold text-muted">
                {card.subtitle}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function fillCollabCards(cards: CollabCard[]) {
  if (cards.length === 0) {
    return [];
  }

  const filled: CollabCard[] = [];

  for (let index = 0; index < CARD_COUNT; index += 1) {
    const card = cards[index % cards.length]!;
    filled.push({
      ...card,
      id: index < cards.length ? card.id : `${card.id}-${index}`,
    });
  }

  return filled;
}

function CollabMedia({ card }: { card: CollabCard }) {
  return (
    <video
      aria-label={card.image.alt}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      poster={card.posterSrc}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
    >
      <source src={card.videoSrc} type="video/mp4" />
    </video>
  );
}
