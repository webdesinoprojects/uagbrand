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
    <section className="bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex snap-x justify-start gap-3 overflow-x-auto py-2 no-scrollbar xl:justify-center">
          {items.map((item) => {
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.label}
                href={item.href}
                className="card-hover group flex h-16 min-w-40 snap-start items-center gap-3 rounded-lg border border-border bg-surface px-4 text-sm font-extrabold text-foreground hover:border-brand hover:text-brand"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-foreground transition group-hover:text-brand">
                  <Icon size={19} />
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
