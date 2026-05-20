"use client";

import { ArrowRight, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Category, ImageAsset, Product } from "@/types";

type CategoryGridProps = {
  categories: Category[];
  products: Product[];
};

type CategoryShowcaseCard = {
  title: string;
  eyebrow: string;
  href: string;
  image: ImageAsset;
  price?: string;
  discount?: string;
};

type CategoryListingCardProps = {
  card: CategoryShowcaseCard;
  previewMedia: ImageAsset;
  isAutoPreviewing?: boolean;
};

const CARDS_PER_CATEGORY = 3;

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

function getCategoryPreviewMedia(category: Category, index: number): ImageAsset {
  if (category.hoverMedia) {
    return category.hoverMedia;
  }

  const src =
    categoryGifMap[category.slug] ??
    fallbackGifs[index % fallbackGifs.length] ??
    fallbackGifs[0];

  return {
    src,
    alt: `${category.shortName} preview`,
    width: 420,
    height: 420,
    label: src.split("/").pop() ?? "preview.gif",
    resourceType: "gif",
  };
}

function buildCardsForCategory(
  category: Category,
  products: Product[],
): CategoryShowcaseCard[] {
  const matchingProducts = products
    .filter((product) => product.categorySlug === category.slug)
    .slice(0, CARDS_PER_CATEGORY);

  return Array.from({ length: CARDS_PER_CATEGORY }, (_, index) => {
    const product = matchingProducts[index];
    const productImage = product?.images[0];

    if (product && productImage) {
      return {
        title: product.title,
        eyebrow: product.feature || product.badge,
        href: `/products/${product.slug}`,
        image: productImage,
        price: product.price,
        discount: product.discount,
      };
    }

    const fallbackTitles = [
      `${category.shortName} picks`,
      `New ${category.shortName}`,
      `${category.shortName} deals`,
    ];
    const fallbackEyebrows = ["Top picks", "Fresh arrivals", "Daily deals"];

    return {
      title: fallbackTitles[index] ?? category.name,
      eyebrow: fallbackEyebrows[index] ?? "View products",
      href: category.href,
      image: category.image,
    };
  });
}

function CategoryListingCard({
  card,
  previewMedia,
  isAutoPreviewing = false,
}: CategoryListingCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const shouldShowPreview = isPreviewing || isAutoPreviewing;

  return (
    <Link
      href={card.href}
      aria-label={`Shop ${card.title}`}
      className="card-hover group min-w-0 overflow-hidden rounded-lg border border-border bg-surface outline-none hover:border-brand focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      onBlur={() => setIsPreviewing(false)}
      onFocus={() => setIsPreviewing(true)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") {
          setIsPreviewing(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch") {
          setIsPreviewing(false);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-soft sm:aspect-[1.18/1]">
        <span className="absolute left-1.5 top-1.5 z-10 max-w-[88%] rounded-sm bg-foreground px-1.5 py-0.5 text-[7px] font-black uppercase leading-none text-background sm:left-2 sm:top-2 sm:text-[9px]">
          {card.eyebrow}
        </span>
        <OptimizedImage
          src={card.image.src}
          alt={card.image.alt}
          width={card.image.width}
          height={card.image.height}
          sizes="(max-width: 640px) 31vw, (max-width: 1024px) 24vw, 18vw"
          wrapperClassName="h-full w-full bg-surface-soft"
          className="h-full w-full object-contain p-2.5 transition duration-300 group-hover:scale-[1.04] sm:p-4"
        />
        {shouldShowPreview ? (
          previewMedia.resourceType === "video" ? (
            <video
              aria-hidden="true"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={previewMedia.src} />
            </video>
          ) : (
            <Image
              src={previewMedia.src}
              alt=""
              aria-hidden="true"
              fill
              unoptimized
              sizes="(max-width: 640px) 31vw, (max-width: 1024px) 24vw, 18vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : null}
      </div>

      <div className="p-2 sm:p-3">
        <h4 className="line-clamp-2 min-h-8 text-[10px] font-black leading-4 text-foreground sm:min-h-10 sm:text-sm sm:leading-5">
          {card.title}
        </h4>
        {card.price ? (
          <div className="mt-2 border-t border-dashed border-border pt-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-xs font-black text-foreground sm:text-base">
                {card.price}
              </p>
              {card.discount ? (
                <span className="text-[9px] font-extrabold text-success sm:text-xs">
                  {card.discount}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-brand sm:text-xs">
            View products
            <ArrowRight
              size={13}
              className="transition group-hover:translate-x-0.5"
            />
          </span>
        )}
      </div>
    </Link>
  );
}

export function CategoryGrid({ categories, products }: CategoryGridProps) {
  const [mobilePreviewIndex, setMobilePreviewIndex] = useState(-1);
  const totalPreviewCards = categories.length * CARDS_PER_CATEGORY;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    let intervalId: number | null = null;

    const syncMobilePreview = () => {
      if (!mediaQuery.matches || totalPreviewCards < 2) {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
        setMobilePreviewIndex(-1);
        return;
      }

      setMobilePreviewIndex((current) =>
        current < 0 ? 0 : current % totalPreviewCards,
      );

      if (!intervalId) {
        intervalId = window.setInterval(() => {
          setMobilePreviewIndex(
            (current) => (current + 1) % totalPreviewCards,
          );
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
  }, [totalPreviewCards]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="soft-enter bg-background py-7 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <p className="mb-2 text-xs font-bold uppercase text-brand">
            Shop by need
          </p>
          <h2 className="font-sans text-3xl font-black tracking-normal text-foreground sm:text-4xl lg:text-5xl">
            Explore Categories
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Quick paths for earbuds, watches, charging gear and daily mobile
            accessories.
          </p>
        </div>

        <div className="space-y-5 sm:space-y-7">
          {categories.map((category, categoryIndex) => (
            <section
              key={category.slug}
              aria-labelledby={`category-${category.slug}`}
              className="border-t border-border/80 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  id={`category-${category.slug}`}
                  className="font-display text-lg font-black uppercase tracking-normal text-foreground sm:text-2xl"
                >
                  {category.shortName}
                </h3>
                <Link
                  href={category.href}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-brand transition hover:text-foreground sm:text-sm"
                >
                  View All
                  <Plus size={15} />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {buildCardsForCategory(category, products).map(
                  (card, cardIndex) => {
                    const previewIndex =
                      categoryIndex * CARDS_PER_CATEGORY + cardIndex;

                    return (
                      <CategoryListingCard
                        key={`${category.slug}-${cardIndex}-${card.title}`}
                        card={card}
                        previewMedia={getCategoryPreviewMedia(
                          category,
                          categoryIndex,
                        )}
                        isAutoPreviewing={mobilePreviewIndex === previewIndex}
                      />
                    );
                  },
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
