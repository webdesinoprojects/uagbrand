import { PackageX, Star } from "lucide-react";
import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { Product } from "@/types";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="mt-6 rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <p className="font-display text-xl font-black text-foreground">
          No matching products yet
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          More product records can be connected here when the backend catalog is
          ready.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => {
        const primaryImage = product.images[0];

        if (!primaryImage) {
          return null;
        }

        return (
          <Link
            key={product.slug}
            href={`/products/${product.slug}`}
            className="card-hover group overflow-hidden rounded-lg border border-border bg-surface hover:border-brand"
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
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                wrapperClassName="aspect-square w-full"
                className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.04] sm:p-7"
              />
              <div className="flex h-8 items-center bg-brand px-2 text-[10px] font-black text-foreground sm:text-xs">
                <span className="line-clamp-1">{product.feature}</span>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <h2 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-foreground sm:text-base">
                {product.title}
              </h2>
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
    </section>
  );
}
