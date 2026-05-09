"use client";

import { useEffect, useState } from "react";

import { CategoryMediaCard } from "@/components/home/category-media-card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Category } from "@/types";

type CategoryGridProps = {
  categories: Category[];
};

const categoryGifMap: Record<string, string> = {
  earbuds: "/assets/category-gifs/earbuds.gif",
  "wired-earphones": "/assets/category-gifs/earbuds.gif",
  neckband: "/assets/category-gifs/neckband.gif",
  "wireless-headphones": "/assets/category-gifs/neckband.gif",
  "smart-watch": "/assets/category-gifs/watch.gif",
};

const fallbackGifs = [
  "/assets/category-gifs/earbuds.gif",
  "/assets/category-gifs/neckband.gif",
  "/assets/category-gifs/watch.gif",
] as const;

function getCategoryGif(category: Category, index: number) {
  return (
    categoryGifMap[category.slug] ??
    fallbackGifs[index % fallbackGifs.length] ??
    fallbackGifs[0]
  );
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  const [mobilePreviewIndex, setMobilePreviewIndex] = useState(-1);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    let intervalId: number | null = null;

    const syncMobilePreview = () => {
      if (!mediaQuery.matches || categories.length < 2) {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
        setMobilePreviewIndex(-1);
        return;
      }

      setMobilePreviewIndex((current) =>
        current < 0 ? 0 : current % categories.length,
      );

      if (!intervalId) {
        intervalId = window.setInterval(() => {
          setMobilePreviewIndex((current) => (current + 1) % categories.length);
        }, 2400);
      }
    };

    syncMobilePreview();
    mediaQuery.addEventListener("change", syncMobilePreview);

    return () => {
      mediaQuery.removeEventListener("change", syncMobilePreview);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [categories.length]);

  return (
    <section id="categories" className="soft-enter bg-background py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Shop by need"
          title="Explore Categories"
          description="Quick paths for earbuds, watches, charging gear and daily mobile accessories."
        />

        <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-x-3 sm:gap-y-5 sm:overflow-visible sm:pb-0 md:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryMediaCard
              key={category.slug}
              category={category}
              gifSrc={getCategoryGif(category, index)}
              isAutoPreviewing={mobilePreviewIndex === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
