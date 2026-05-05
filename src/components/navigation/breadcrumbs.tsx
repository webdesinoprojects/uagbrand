import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 overflow-x-auto no-scrollbar">
      <ol className="flex min-w-max items-center gap-1 text-sm font-bold text-muted">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" size={15} className="text-muted/70" />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-surface-soft hover:text-brand"
                >
                  {isFirst ? <Home aria-hidden="true" size={15} /> : null}
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-foreground"
                >
                  {isFirst ? <Home aria-hidden="true" size={15} /> : null}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
