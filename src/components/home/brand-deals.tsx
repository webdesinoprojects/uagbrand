import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { SectionHeader } from "@/components/ui/section-header";
import type { Brand } from "@/types";

type BrandDealsProps = {
  brands: Brand[];
};

const dealBrandSlugs = new Set([
  "oneplus",
  "boat",
  "redmi",
  "realme",
  "noise",
  "ptron",
  "ubon",
  "go-boult",
  "boult-audio",
  "jbl",
  "zebronics",
  "sony",
]);

export function BrandDeals({ brands }: BrandDealsProps) {
  const dealBrands = brands.filter((brand) => dealBrandSlugs.has(brand.slug));

  return (
    <section id="brands" className="soft-enter bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Only Deals In Brands" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {dealBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={brand.href}
              className="card-hover group rounded-lg border border-border bg-surface p-3 hover:border-brand"
            >
              <OptimizedImage
                src={brand.logo.src}
                alt={brand.logo.alt}
                width={brand.logo.width}
                height={brand.logo.height}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                wrapperClassName="aspect-[11/5] rounded-lg border border-border bg-background"
                className="h-full w-full object-contain p-3"
              />
              <div className="mt-3">
                <p className="truncate text-sm font-extrabold text-foreground">
                  {brand.name}
                </p>
                <p className="mt-1 truncate text-xs font-bold text-muted">
                  {brand.deal}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
