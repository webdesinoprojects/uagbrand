import { Plus } from "lucide-react";
import Link from "next/link";

import { OptimizedImage } from "@/components/ui/optimized-image";
import type { FeaturedDeal } from "@/types";

type TopPicksProps = {
  deals: FeaturedDeal[];
};

export function TopPicks({ deals }: TopPicksProps) {
  return (
    <section className="soft-enter bg-background py-6 sm:py-8">
      <div className="w-full px-2 sm:px-4 lg:px-7">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="font-display text-xl font-black tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Top Deals & New Drops
          </h2>
          <Link
            href="/products?sort=deals"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold text-brand transition hover:text-foreground sm:text-sm"
          >
            View All
            <Plus size={15} />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.href}
              aria-label={`Shop ${deal.title}`}
              className="card-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface hover:border-brand"
            >
              <div className="relative bg-surface-soft">
                <span className="absolute left-1 top-1 z-10 max-w-[92%] rounded-sm bg-foreground px-1.5 py-0.5 text-[7px] font-black uppercase leading-none text-background sm:text-[9px] lg:text-[10px]">
                  {deal.badge}
                </span>
                <OptimizedImage
                  src={deal.image.src}
                  alt={deal.image.alt}
                  width={deal.image.width}
                  height={deal.image.height}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  wrapperClassName="aspect-[1.06/1] w-full"
                  className="h-full w-full object-contain p-2.5 transition duration-300 group-hover:scale-[1.03] sm:p-3 lg:p-4"
                />
                <div className="flex h-6 items-center bg-brand px-1.5 text-[8px] font-black text-foreground sm:h-7 sm:px-2 sm:text-[10px] lg:h-8 lg:text-xs">
                  <span className="line-clamp-1">{deal.feature}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-1.5 sm:p-2 lg:p-3">
                <h3 className="line-clamp-2 min-h-8 text-[10px] font-black leading-4 text-foreground sm:min-h-9 sm:text-xs sm:leading-[18px] lg:min-h-10 lg:text-sm lg:leading-5">
                  {deal.title}
                </h3>
                <div className="mt-2 border-t border-dashed border-border pt-2 lg:mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-foreground sm:text-base lg:text-xl">
                      {deal.price}
                    </p>
                    <span className="hidden items-center text-[10px] font-bold text-muted min-[420px]:flex sm:text-xs">
                      <span className="h-3 w-3 rounded-full bg-foreground sm:h-4 sm:w-4" />
                      <span className="-ml-1 h-3 w-3 rounded-full border border-surface bg-brand sm:h-4 sm:w-4" />
                      +1
                    </span>
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] sm:mt-1 sm:gap-2 sm:text-xs">
                  <span className="text-muted line-through">
                    {deal.compareAt}
                  </span>
                  <span className="font-extrabold text-emerald-600">
                    {deal.discount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
