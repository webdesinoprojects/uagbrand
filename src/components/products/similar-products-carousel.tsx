"use client";

import { ChevronLeft, ChevronRight, PackageX, Star } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Brand, Product } from "@/types";

type SimilarProductsCarouselProps = {
  brand: Brand;
  products: Product[];
};

export function SimilarProductsCarousel({
  brand,
  products,
}: SimilarProductsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }

  function scrollByCard(direction: "previous" | "next") {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const amount = Math.min(scroller.clientWidth * 0.86, 960);
    scroller.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-brand">
            Similar products
          </p>
          <h2 className="font-display text-3xl font-black text-foreground">
            More from {brand.name}
          </h2>
        </div>
        {products.length > 1 ? (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous similar products"
              onClick={() => scrollByCard("previous")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:border-brand hover:text-brand"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next similar products"
              onClick={() => scrollByCard("next")}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:border-brand hover:text-brand"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto pb-2 no-scrollbar sm:gap-4"
      >
        {products.map((product) => {
          const primaryImage = product.images[0];

          if (!primaryImage) {
            return null;
          }

          return (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="card-hover group w-[72vw] max-w-[280px] flex-none snap-start overflow-hidden rounded-lg border border-border bg-surface hover:border-brand sm:w-[260px] lg:w-[285px]"
            >
              <div className="relative bg-surface-soft">
                <span className="absolute left-2 top-2 z-10 rounded-sm bg-foreground px-2 py-1 text-[9px] font-black uppercase leading-none text-background sm:text-[10px]">
                  {product.badge}
                </span>
                {product.availability === "out-of-stock" ? (
                  <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-sm bg-surface/95 px-2 py-1 text-[9px] font-black text-foreground shadow-sm sm:text-[10px]">
                    <PackageX size={12} />
                    Out
                  </span>
                ) : null}
                <OptimizedImage
                  src={primaryImage.src}
                  alt={primaryImage.alt}
                  width={primaryImage.width}
                  height={primaryImage.height}
                  sizes="(max-width: 640px) 72vw, 285px"
                  wrapperClassName="aspect-square w-full"
                  className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.04] sm:p-7"
                />
                <div className="flex h-8 items-center bg-brand px-2 text-[10px] font-black text-foreground sm:text-xs">
                  <span className="line-clamp-1">{product.feature}</span>
                </div>
              </div>

              <div className="p-3 sm:p-4">
                <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-foreground sm:text-base">
                  {product.title}
                </h3>
                <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-muted">
                  {product.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-extrabold text-foreground">
                  <Star
                    size={13}
                    className="fill-accent text-accent"
                    aria-hidden="true"
                  />
                  {product.rating}
                  <span className="font-bold text-success">
                    ({product.ratingCount})
                  </span>
                </div>
                <div className="mt-3 border-t border-dashed border-border pt-3">
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-lg font-black text-foreground">
                      {product.price}
                    </p>
                    <span className="text-xs font-extrabold text-success">
                      {product.discount}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted line-through">
                    {product.compareAt}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
