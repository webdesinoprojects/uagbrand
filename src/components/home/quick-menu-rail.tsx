import {
  BadgePercent,
  Headphones,
  ShieldCheck,
  Truck,
  Watch,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import type { QuickMenuIcon, QuickMenuItem } from "@/types";

const iconMap = {
  "badge-percent": BadgePercent,
  zap: Zap,
  headphones: Headphones,
  watch: Watch,
  truck: Truck,
  shield: ShieldCheck,
} satisfies Record<QuickMenuIcon, ComponentType<{ size?: number }>>;

type QuickMenuRailProps = {
  items: QuickMenuItem[];
};

export function QuickMenuRail({ items }: QuickMenuRailProps) {
  return (
    <section className="bg-background py-8 sm:py-11">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex snap-x justify-start gap-4 overflow-x-auto py-2 no-scrollbar xl:justify-center">
          {items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex h-20 min-w-48 snap-start items-center gap-4 rounded-lg border border-border bg-surface px-5 text-base font-extrabold text-foreground shadow-sm transition hover:border-brand hover:shadow-md sm:min-w-52"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground">
                  <Icon size={21} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
