import { PackageX } from "lucide-react";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { ImageAsset } from "@/types";

export type ProductAvailabilityItem = {
  id: string;
  title: string;
  description: string;
  image: ImageAsset;
  status: "loading" | "out-of-stock";
};

type ProductAvailabilityGridProps = {
  items: ProductAvailabilityItem[];
};

export function ProductAvailabilityGrid({
  items,
}: ProductAvailabilityGridProps) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) =>
        item.status === "out-of-stock" ? (
          <OutOfStockCard key={item.id} item={item} />
        ) : (
          <SkeletonProductCard key={item.id} />
        ),
      )}
    </section>
  );
}

function OutOfStockCard({ item }: { item: ProductAvailabilityItem }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-square bg-surface-soft">
        <OptimizedImage
          src={item.image.src}
          alt={item.image.alt}
          width={item.image.width}
          height={item.image.height}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          wrapperClassName="h-full w-full"
          className="h-full w-full object-contain p-8 transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border border-border bg-surface/95 px-2.5 py-1 text-xs font-black text-foreground shadow-sm backdrop-blur">
          <PackageX aria-hidden="true" size={14} />
          Out of stock
        </span>
      </div>

      <div className="p-4">
        <h2 className="line-clamp-2 min-h-12 font-display text-lg font-black text-foreground">
          {item.title}
        </h2>
        <p className="mt-2 min-h-10 text-sm leading-5 text-muted">
          {item.description}
        </p>
        <button
          type="button"
          disabled
          className="mt-4 h-11 w-full cursor-not-allowed rounded-lg border border-border bg-surface-soft px-4 text-sm font-black text-muted"
        >
          Currently unavailable
        </button>
      </div>
    </article>
  );
}

function SkeletonProductCard() {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="skeleton aspect-square rounded-md" />
      <div className="mt-4 h-4 w-24 rounded-sm bg-surface-strong" />
      <div className="mt-3 h-5 w-10/12 rounded-sm bg-surface-strong" />
      <div className="mt-5 flex items-center justify-between">
        <div className="h-6 w-20 rounded-sm bg-surface-strong" />
        <div className="h-10 w-24 rounded-md bg-brand/20" />
      </div>
    </article>
  );
}
