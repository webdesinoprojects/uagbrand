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
    <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
    <article className="group overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-lift)] sm:rounded-xl">
      <div className="relative aspect-square bg-surface-soft">
        <OptimizedImage
          src={item.image.src}
          alt={item.image.alt}
          width={item.image.width}
          height={item.image.height}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          wrapperClassName="h-full w-full"
          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105 sm:p-8"
        />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface/95 px-2 py-1 text-[10px] font-black text-foreground shadow-sm backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs">
          <PackageX aria-hidden="true" size={14} />
          Out of stock
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <h2 className="line-clamp-2 min-h-10 font-display text-sm font-black text-foreground sm:min-h-12 sm:text-lg">
          {item.title}
        </h2>
        <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-muted sm:min-h-10 sm:text-sm">
          {item.description}
        </p>
        <button
          type="button"
          disabled
          className="mt-3 h-10 w-full cursor-not-allowed rounded-md border border-border bg-surface-soft px-2 text-xs font-black text-muted sm:mt-4 sm:h-11 sm:rounded-lg sm:px-4 sm:text-sm"
        >
          Currently unavailable
        </button>
      </div>
    </article>
  );
}

function SkeletonProductCard() {
  return (
    <article className="rounded-lg border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="skeleton aspect-square rounded-md" />
      <div className="mt-3 h-3 w-20 rounded-sm bg-surface-strong sm:mt-4 sm:h-4 sm:w-24" />
      <div className="mt-3 h-5 w-10/12 rounded-sm bg-surface-strong" />
      <div className="mt-4 flex items-center justify-between sm:mt-5">
        <div className="h-5 w-14 rounded-sm bg-surface-strong sm:h-6 sm:w-20" />
        <div className="h-9 w-16 rounded-md bg-brand/20 sm:h-10 sm:w-24" />
      </div>
    </article>
  );
}
