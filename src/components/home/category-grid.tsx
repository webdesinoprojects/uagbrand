import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { SectionHeader } from "@/components/ui/section-header";
import type { Category } from "@/types";

type CategoryGridProps = {
  categories: Category[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className="soft-enter bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Shop by need"
          title="Explore Categories"
          description="Quick paths for earbuds, watches, charging gear and daily mobile accessories."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className="card-hover group grid min-h-40 grid-cols-[112px_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-surface hover:border-brand sm:grid-cols-[132px_minmax(0,1fr)]"
            >
              <OptimizedImage
                src={category.image.src}
                alt={category.image.alt}
                width={category.image.width}
                height={category.image.height}
                sizes="(max-width: 640px) 112px, 132px"
                wrapperClassName="h-full w-full bg-background"
                className="h-full w-full object-contain p-4"
              />
              <div className="flex min-w-0 flex-col justify-between p-4">
                <div>
                  <p className="font-display text-base font-black text-foreground">
                    {category.shortName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {category.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand">
                  View products
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
